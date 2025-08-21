<script setup>
import { computed } from 'vue';
import ChartSubmissions from '~/components/forms/ChartSubmissions.vue';
import { AppPermissions } from '~/utils/constants';

defineProps({
  f: {
    type: String,
    required: true,
  },
});

const APP_PERMS = computed(() => AppPermissions);
</script>

<template>
  <BaseSecure :permission="APP_PERMS.VIEWS_FORM_EXPORT">
    <ChartSubmissions :form-id="f" />
  </BaseSecure>
</template>
