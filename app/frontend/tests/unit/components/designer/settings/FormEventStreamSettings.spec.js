import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useFormStore } from '~/store/form';
import FormEventStreamSettings from '~/components/designer/settings/FormEventStreamSettings.vue';

describe('FormEventStreamSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
  });

  it('generates an encryption key when it has an algorithm', async () => {
    formStore.form = ref({
      eventStreamConfig: {
        enablePrivateStream: true,
        encryptionKey: {
          algorithm: 'aes-256-gcm',
          key: null,
        },
      },
    });
    const wrapper = mount(FormEventStreamSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    expect(formStore.form.eventStreamConfig.encryptionKey.key).toBe(null);
    await wrapper.vm.generateKey();
    expect(formStore.form.eventStreamConfig.encryptionKey.key).toBeTruthy(); // populated
  });

  it('does not generate an encryption key without algorithm', async () => {
    formStore.form = ref({
      eventStreamConfig: {
        enablePrivateStream: true,
        encryptionKey: {
          algorithm: null,
          key: null,
        },
      },
    });
    const wrapper = mount(FormEventStreamSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    expect(formStore.form.eventStreamConfig.encryptionKey.key).toBe(null);
    await wrapper.vm.generateKey();
    expect(formStore.form.eventStreamConfig.encryptionKey.key).toBe(undefined);
  });

  it('requires algorithm and key when private stream enabled', async () => {
    formStore.form = ref({
      eventStreamConfig: {
        enablePublicStream: false,
        enablePrivateStream: true,
        encryptionKey: {
          algorithm: null,
          key: null,
        },
      },
    });

    const wrapper = mount(FormEventStreamSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    expect(
      wrapper.vm.encryptionKeyRules[0](
        formStore.form.eventStreamConfig.encryptionKey.algorithm
      )
    ).toEqual('trans.formSettings.encryptionKeyReq');

    expect(
      wrapper.vm.encryptionKeyRules[0](
        formStore.form.eventStreamConfig.encryptionKey.key
      )
    ).toEqual('trans.formSettings.encryptionKeyReq');

    expect(wrapper.vm.encryptionKeyRules[0](null)).toEqual(
      'trans.formSettings.encryptionKeyReq'
    );

    expect(wrapper.vm.encryptionKeyRules[0](undefined)).toEqual(
      'trans.formSettings.encryptionKeyReq'
    );

    expect(wrapper.vm.encryptionKeyRules[0](' ')).toEqual(
      'trans.formSettings.encryptionKeyReq'
    );

    expect(wrapper.vm.encryptionKeyRules[0]('aes-256-gcm')).toEqual(true); // some value should pass
  });
});