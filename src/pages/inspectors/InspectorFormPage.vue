<template>
  <div class="inspector-create-page q-pa-md">
    <!-- Page Title -->
    <h3>{{ isEditMode ? 'Edit Inspector' : 'Create Inspector' }}</h3>

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
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api.util';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const loading = ref(false);

// Check if the component is in edit mode
const isEditMode = computed(() => route.path.includes('/inspectors/edit'));

/**
 * Data Model
 */
const formData = ref({           
  id: 0,             
  badgeNumber: '',      
  latitude: '',   
  longitude: ''   
});

/**
 * Check if the component is in edit mode
 * and fetch the inspector data if it is.
 */
onMounted(async () => {
  if (isEditMode.value && route.query.inspectorId) {
    await fetchInspectorData(route.query.inspectorId as string);
  }
});

/**
 * Fetch Inspector Data for Edit
 */
async function fetchInspectorData(id: string) {
  try {
    loading.value = true;
    const response = await api.get(`/v1/Inspectors/${id}`);
    const inspector = response.data;
    formData.value.id = inspector.id;
    // Populate the form fields
    formData.value.badgeNumber = inspector.badgeNumber;
    formData.value.latitude = inspector.location.coordinates[1]; // Latitude
    formData.value.longitude = inspector.location.coordinates[0]; // Longitude
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: 'Failed to fetch inspector data'
    });
  } finally {
    loading.value = false;
  }
}

/**
 * Handle Form Submission
 */
async function handleSubmit() {
  try {
    loading.value = true;

    // Construct the JSON payload
    const payload = {
      Id: formData.value.id,
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

    if (isEditMode.value && route.query.inspectorId) {
      // Update existing inspector
      await api.put(`/v1/Inspectors/${route.query.inspectorId}`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      $q.notify({
        type: 'positive',
        message: 'Inspector updated successfully'
      });
    } else {
      // Create new inspector
      await api.post('/v1/Inspectors', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      $q.notify({
        type: 'positive',
        message: 'Inspector created successfully'
      });
    }

    // Redirect to the inspector list page
    router.push('/dashboard/inspectors');
  } catch (error: any) {
    // Show a more detailed error if available
    const errorMessage = error?.response?.data?.error || 'Error saving inspector';
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