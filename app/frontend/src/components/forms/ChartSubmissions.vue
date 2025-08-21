<script setup>
import { ref, onMounted, computed } from 'vue';
import { useFormStore } from '~/store/form';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import axios from 'axios';

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'vue-chartjs';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
);

const properties = defineProps({
  formId: {
    type: String,
    required: true,
  },
});

const formStore = useFormStore();

const formVersions = ref([]);
const selectedVersion = ref(0);
const { form, isRTL } = storeToRefs(formStore);
const { locale } = useI18n({ useScope: 'global' });

const nlpPrompt = ref('');
const generatedSql = ref('');
const queryResult = ref('');

const activeTab = ref('json');
const tableHeaders = computed(() => {
  try {
    const parsed = JSON.parse(queryResult.value || '{}');
    const rows = parsed?.rows || [];
    if (rows.length === 0) return [];
    const firstRow = rows[0];
    // If only column is 'submission' and has data, flatten to keys of submission.data
    if (
      firstRow.submission &&
      typeof firstRow.submission === 'object' &&
      firstRow.submission.data &&
      typeof firstRow.submission.data === 'object'
    ) {
      return Object.keys(firstRow.submission.data);
    }
    return Object.keys(firstRow);
  } catch (e) {
    return [];
  }
});

function formatHeader(key) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (s) => s.toUpperCase());
}
const tableRows = computed(() => {
  try {
    const parsed = JSON.parse(queryResult.value || '{}');
    const rows = parsed?.rows || [];
    // If only column is 'submission' and has data, flatten to submission.data
    if (
      rows.length > 0 &&
      rows[0].submission &&
      typeof rows[0].submission === 'object' &&
      rows[0].submission.data &&
      typeof rows[0].submission.data === 'object'
    ) {
      return rows.map((r) => r.submission.data);
    }
    return rows;
  } catch (e) {
    return [];
  }
});

const selectedChartColumn = ref('');
const chartType = ref('bar');

const chartOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: `Chart for ${selectedChartColumn.value}`,
    },
  },
}));

const chartData = computed(() => {
  const rows = tableRows.value;
  if (!selectedChartColumn.value || rows.length === 0)
    return { labels: [], datasets: [] };

  const counts = {};
  rows.forEach((row) => {
    const val = row[selectedChartColumn.value];
    if (val !== undefined && val !== null) {
      const key = typeof val === 'object' ? JSON.stringify(val) : String(val);
      counts[key] = (counts[key] || 0) + 1;
    }
  });

  const labels = Object.keys(counts);
  const data = Object.values(counts);

  return {
    labels,
    datasets: [
      {
        label: selectedChartColumn.value,
        data,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };
});

async function generateSql() {
  try {
    const response = await axios.post('http://localhost:8000/generate-sql', {
      prompt: nlpPrompt.value,
      schemaId: selectedVersion.value,
    });
    generatedSql.value =
      response.data.sql || JSON.stringify(response.data, null, 2);
  } catch (err) {
    generatedSql.value = `Error: ${
      err?.response?.data?.message || err.message
    }`;
  }
}

async function runQuery() {
  try {
    const response = await axios.post('http://localhost:8000/run-query', {
      sql: generatedSql.value,
    });
    queryResult.value =
      JSON.stringify(response.data, null, 2) || 'No results returned.';
  } catch (err) {
    queryResult.value = `Error: ${err?.response?.data?.message || err.message}`;
  }
}

onMounted(async () => {
  await formStore.fetchForm(properties.formId);

  if (formStore.form && Array.isArray(formStore.form.versions)) {
    let versions = formStore.form.versions;
    versions.sort((a, b) =>
      a.version < b.version ? -1 : a.version > b.version ? 1 : 0
    );
    formVersions.value.push(...versions);
    selectedVersion.value = versions.length > 0 ? versions[0].id : 0;
  }
});
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }">
    <v-row class="mt-6" no-gutters>
      <v-col>
        <v-row>
          <v-col cols="11">
            <h1 :lang="locale">
              {{ $t('trans.exportSubmissions.exportSubmissionsToFile') }}
            </h1>
            <h3>{{ formId ? form.name : '' }}</h3>
          </v-col>
          <v-col :class="isRTL ? 'text-left' : 'text-right'" cols="1">
            <span>
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <router-link
                    :to="{ name: 'FormSubmissions', query: { f: form.id } }"
                  >
                    <v-btn
                      class="mx-1"
                      color="primary"
                      icon
                      v-bind="props"
                      :title="$t('trans.exportSubmissions.viewSubmissions')"
                    >
                      <v-icon icon="mdi:mdi-list-box-outline"></v-icon>
                    </v-btn>
                  </router-link>
                </template>
                <span :lang="locale">{{
                  $t('trans.exportSubmissions.viewSubmissions')
                }}</span>
              </v-tooltip>
            </span>
          </v-col>
        </v-row>
        <v-row class="mt-5">
          <v-col>
            <div class="subTitleObjectStyle" :lang="locale">
              {{ $t('trans.exportSubmissions.formVersion') }}
            </div>
            <div class="text-red mt-3" :lang="locale">
              {{ $t('trans.exportSubmissions.versionIsRequired') }}
            </div>
            <v-select
              v-model="selectedVersion"
              item-title="version"
              item-value="id"
              :items="formVersions"
              class="mt-0"
              style="width: 25%; margin-top: 0px"
            ></v-select>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row class="mt-6">
      <v-col>
        <v-textarea
          v-model="nlpPrompt"
          label="Enter natural language prompt"
          variant="outlined"
          rows="3"
          :lang="locale"
        ></v-textarea>
        <v-btn class="mt-3" color="primary" @click="generateSql">
          Generate SQL
        </v-btn>
        <v-textarea
          v-model="generatedSql"
          label="Generated SQL"
          variant="outlined"
          readonly
          rows="6"
          class="mt-3"
          :lang="locale"
        ></v-textarea>
        <v-btn class="mt-3" color="secondary" @click="runQuery">
          Run Query
        </v-btn>
        <v-tabs v-model="activeTab" class="mt-3">
          <v-tab value="json">JSON View</v-tab>
          <v-tab value="table">Table View</v-tab>
        </v-tabs>
        <v-row class="mt-3" align="center">
          <v-col cols="4">
            <v-select
              v-model="selectedChartColumn"
              :items="tableHeaders"
              label="Select Column to Chart"
            ></v-select>
          </v-col>
          <v-col cols="3">
            <v-radio-group v-model="chartType" row>
              <v-radio label="Bar" value="bar" />
              <v-radio label="Pie" value="pie" />
            </v-radio-group>
          </v-col>
          <v-col v-if="selectedChartColumn" cols="12">
            <div style="max-width: 600px; max-height: 400px; margin: auto">
              <component
                :is="chartType === 'bar' ? Bar : Pie"
                :data="chartData"
                :options="chartOptions"
              />
            </div>
          </v-col>
        </v-row>
        <v-window v-model="activeTab">
          <v-window-item value="json">
            <v-textarea
              v-model="queryResult"
              label="Query Result (JSON)"
              variant="outlined"
              readonly
              rows="10"
              class="mt-2"
              :lang="locale"
            />
          </v-window-item>
          <v-window-item value="table">
            <v-simple-table class="mt-2">
              <thead>
                <tr>
                  <th v-for="header in tableHeaders" :key="header">
                    {{ formatHeader(header) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in tableRows" :key="index">
                  <td v-for="header in tableHeaders" :key="header">
                    <span
                      v-if="
                        typeof row[header] === 'object' && row[header] !== null
                      "
                    >
                      {{ JSON.stringify(row[header], null, 2) }}
                    </span>
                    <span v-else>
                      {{ row[header] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </div>
</template>
