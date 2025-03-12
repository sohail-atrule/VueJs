src\pages\customers\CustomerCreatePage.vue



<template>
  <div class="customer-create-page q-pa-md">
    <!-- Dynamic Title -->
    <div v-if="!isEditMode" class="text-h5 q-mb-md">
      {{ t('customer.create.title') }}
    </div>

    <div v-if="isEditMode" class="text-h5 q-mb-md">
      {{ t('customer.edit.title') }}
    </div>

    <QCard class="customer-form">
      <QCardSection>
        <QForm @submit="handleSubmit" class="q-gutter-md">
          <!-- Customer Form Fields -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <QInput
                v-model="formData.name"
                :label="t('customer.fields.name')"
                :rules="[val => !!val || t('validation.required')]"
                outlined
                dense
                lazy-rules
              />
            </div>

            <div class="col-12 col-md-6">
              <QInput
                v-model="formData.code"
                :label="t('customer.fields.code')"
                :rules="[val => !!val || t('validation.required')]"
                outlined
                dense
                lazy-rules
                placeholder="XYZ-123"
                :disable="isEditMode"
              />

              <!-- <q-input
                v-model="formData.code"
                :label="t('customer.fields.code')"
                :rules="[val => !!val || t('validation.required')]"
                outlined
                dense
                lazy-rules
                :disable="isEditMode"

                @update:model-value="handleInput"
              /> -->
            </div>

            <div class="col-12 col-md-6">
              <QSelect
                v-model="formData.region"
                :options="regionOptions"
                :label="t('customer.fields.region')"
                :rules="[val => !!val || t('validation.required')]"
                outlined
                dense
                emit-value
                map-options
                lazy-rules
              />
            </div>

            <div class="col-12 col-md-6">
              <QSelect
                v-model="formData.status"
                :options="statusOptions"
                :label="t('customer.fields.status')"
                outlined
                dense
                emit-value
                map-options
                lazy-rules
                disable


                />
                <!-- :rules="[val => !!val || t('validation.required')]" -->
            </div>

            <div class="col-12">
              <QInput
                v-model="formData.address"
                type="textarea"
                :label="t('customer.fields.address')"
                :rules="[val => !!val || t('validation.required')]"
                outlined
                dense
                lazy-rules
                autogrow
              />
            </div>
          </div>

          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-md-6">
              <QInput
                v-model="formData.contactPerson"
                :label="t('customer.fields.contactPerson')"
                outlined
                dense
                lazy-rules
                disable
                />
                <!-- :rules="[val => !!val || t('validation.required')]" -->
            </div>

            <div class="col-12 col-md-6">
              <QInput
                v-model="formData.email"
                type="email"
                :label="t('customer.fields.email')"
                outlined
                dense
                lazy-rules
                disable
              />
              <!-- :rules="[
                val => !!val || t('validation.required'),
                val => /^[^@]+@[^@]+\.[^@]+$/.test(val) || t('validation.email')
              ]" -->
            </div>

            <div class="col-12 col-md-6">
              <QInput
                v-model="formData.phone"
                :label="t('customer.fields.phone')"
                outlined
                dense
                lazy-rules
                disable
                />
                <!-- :rules="[val => !!val || t('validation.required')]" -->
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="row q-mt-lg">
            <div class="col-12 flex justify-end q-gutter-sm">
              <QBtn
                :label="t('common.cancel')"
                color="grey"
                flat
                :to="{ name: 'customer-list' }"
              />
              <QBtn
                :label="t('common.save')"
                type="submit"
                color="primary"
                :loading="loading"
              />
            </div>
          </div>

        </QForm>
      </QCardSection>
    </QCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { CustomerStatus } from '@/models/customer.model';
import { useCustomerStore } from '@/stores/customer.store';

// Hooks
const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const $q = useQuasar();
const customerStore = useCustomerStore();

// State
const loading = ref(false);
const isEditMode = computed(() => route.path.includes('/customers/edit'));

const formData = ref({
  name: '',
  code: '',
  region: '',
  status: CustomerStatus.Active,
  address: '',
  contactPerson: '',
  email: '',
  phone: '',
});

// Select Options
const regionOptions = computed(() => [
  { label: t('customer.regions.north'), value: 'North' },
  { label: t('customer.regions.south'), value: 'South' },
  { label: t('customer.regions.east'), value: 'East' },
  { label: t('customer.regions.west'), value: 'West' },
]);

const statusOptions = computed(() => [
  { label: t('customer.status.active'), value: CustomerStatus.Active },
  { label: t('customer.status.inactive'), value: CustomerStatus.Inactive },

]);

const fetchCustomer = async () => {
  if (isEditMode.value) {
    try {
      loading.value = true;
      const customer = await customerStore.fetchCustomerById(Number(route.params.id));
      if (customer) {
        formData.value = {
          ...customer,
          status: customer.isActive ? CustomerStatus.Active : CustomerStatus.Inactive, // Convert isActive to status
        };
      }
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: t('customer.fetch.error'),
      });
    } finally {
      loading.value = false;
    }
  }
};

onMounted(fetchCustomer);

// Handle form submission
const handleSubmit = async () => {
  try {
    loading.value = true;

    const customerData = {
      ...formData.value,
      isActive: formData.value.status === CustomerStatus.Active, // Convert status back to isActive
    };

    if (isEditMode.value) {
      const id = route.params.id;
      await customerStore.updateCustomer(Number(id), customerData);
      $q.notify({
        type: 'positive',
        message: t('customer.edit.success'),
      });
    } else {
      await customerStore.createCustomer(customerData);
      $q.notify({
        type: 'positive',
        message: t('customer.create.success'),
      });
    }

    router.push({ name: 'customer-list' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: isEditMode.value
        ? t('customer.edit.error')
        : t('customer.create.error'),
    });
  } finally {
    loading.value = false;
  }
};

</script>

<style lang="scss" scoped>
.customer-create-page {
  max-width: 1200px;
  margin: 0 auto;

  .customer-form {
    border-radius: 8px;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
  }
}
</style>
