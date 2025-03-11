<template>
  <div class="inspector-create-page q-pa-md">
    <!-- Page Title -->
    <h3>Create Inspector</h3>

    <QCard class="inspector-form q-mt-md">
      <QCardSection>
        <QForm @submit.prevent="handleSubmit" class="q-gutter-md">


          <!-- BADGE NUMBER -->
          <QInput
            v-model="formData.badgeNumber"
            label="Badge Number"
            outlined
            dense
          />

          <!-- LATITUDE -->
          <QInput
            v-model.number="formData.latitude"
            label="Latitude"
            type="number"
            outlined
            dense
          />

          <!-- LONGITUDE -->
          <QInput
            v-model.number="formData.longitude"
            label="Longitude"
            type="number"
            outlined
            dense
          />

          <!-- ACTION BUTTONS -->
          <div class="row q-pt-md justify-end q-gutter-sm">
            <!-- CANCEL (optional) -->
            <QBtn
              label="Cancel"
              color="grey"
              flat
              :to="{ name: 'inspector-list' }"
            />
            <!-- SAVE -->
            <QBtn
              label="Save"
              type="submit"
              color="primary"
              :loading="loading"
            />
          </div>
        </QForm>
      </QCardSection>
    </QCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';

// If you'd like to use your Pinia store:
import { useInspectorStore } from '@/stores/inspector.store';
import router from '@/router';
import api from '@/utils/api.util';
// or import { createInspector } from '@/api/inspector.api';
const inspectorStore = useInspectorStore();

const $q = useQuasar();
const loading = ref(false);

/**
 * Data Model
 * Match the shape of the .NET command:
 * {
 *   "UserId": 1,
 *   "BadgeNumber": "BN120",
 *   "Location": {
 *     "type": "Point",
 *     "coordinates": [long, lat]
 *   }
 * }
 */
const formData = ref({
  userId: 1,             // Example default
  badgeNumber: '',       // Start empty
  latitude: '',      // Example default
  longitude: ''    // Example default
});

/**
 * Handle Form Submission
 * Builds the JSON exactly as your cURL & .NET controller expects
 * and posts to 'https://192.168.1.28:7031/api/v1/Inspectors'.
 */
async function handleSubmit() {
  try {
    loading.value = true;

    // Construct the JSON payload
    const payload = {
      UserId: formData.value.userId,
      BadgeNumber: formData.value.badgeNumber,
      Location: {
        type: 'Point',
        // Important: GeoJSON uses [longitude, latitude]
        coordinates: [
          Number(formData.value.longitude),
          Number(formData.value.latitude)
        ]
      }
    };

    // Perform the POST request directly via axios
    // (You could also call your createInspector(...) API method if you adapt it)

    await api.post(
      '/v1/Inspectors',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Success notification
    $q.notify({
      type: 'positive',
      message: 'Inspector created successfully'
    });
    router.push('/dashboard/inspectors')
    // If you want to do something else on success, like refresh a list:
    // await inspectorStore.searchInspectors(...);

    // Or navigate to the inspector list:
    // router.push({ name: 'inspector-list' });
  } catch (error: any) {
    // Show a more detailed error if available
    const errorMessage = error?.response?.data?.error || 'Error creating inspector';
    $q.notify({
      type: 'negative',
      message: errorMessage
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.inspector-create-page {
  max-width: 600px;
  margin: 0 auto;

  .inspector-form {
    border-radius: 8px;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
  }
}
</style>
