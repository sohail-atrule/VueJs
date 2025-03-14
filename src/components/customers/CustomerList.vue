<template>
  <div class="customer-list" role="region" aria-label="Customer List">
    <!-- Search and Filter Section -->
    <QCard class="filter-section q-mb-md">
  <QCardSection>
    <div class="row q-col-gutter-md items-center">

      <!-- Search Bar -->
      <div class="col-12 col-md-4">
        <SearchBar
          :placeholder="t('customer.search.placeholder')"
          :loading="loading"
          :debounce-time="300"
          @search="handleSearch"
          @clear="handleSearchClear"
          class="search-bar"
        />
      </div>

      <!-- Filters -->
      <div class="col-12 col-md-8">
        <div class="row q-col-gutter-md">

          <!-- Industry Filter -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="filters.industry"
              :options="industryOptions"
              outlined
              dense
              emit-value
              map-options
              :label="t('customer.filters.industry')"
              @update:model-value="handleFilterChange"
              class="filter-select"
            />
          </div>

          <!-- Region Filter -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="filters.region"
              :options="regionOptions"
              outlined
              dense
              emit-value
              map-options
              :label="t('customer.filters.region')"
              @update:model-value="handleFilterChange"
              class="filter-select"
            />
          </div>

          <!-- Status Filter -->
          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="filters.status"
              :options="statusOptions"
              outlined
              dense
              emit-value
              map-options
              :label="t('customer.filters.status')"
              @update:model-value="handleFilterChange"
              class="filter-select"
            />
          </div>

          <!-- Add Customer Button -->
          <div class="col-12 col-sm-6 col-md-3 flex justify-end">
            <q-btn
              color="primary"
              :label="t('customer.actions.add')"
              icon="add"
              no-caps
              @click="handleAddCustomer"
              :aria-label="t('customer.actions.add_aria')"
              class="add-btn"
            />
          </div>

        </div>
      </div>
    </div>
  </QCardSection>
</QCard>

    <!-- Customer Data Table -->
    <QCard>
      <q-table
        :columns="columns"
        :rows="customerList"
        :loading="loading"
        row-key="id"
        virtual-scroll
        v-model:pagination="pagination"
        @row-click="handleRowClick"
        @request="onTableRequest"
      >
        <!-- Custom Status Column -->
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-chip
              :color="getStatusColor(props.value)"
              text-color="white"
              dense
              :label="props.value"
            />
          </q-td>
        </template>

        <!-- Custom Actions Column -->
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn-group flat>
              <q-btn
                flat
                round
                color="primary"
                icon="edit"
                :aria-label="t('customer.actions.edit')"
                @click.stop="handleEditCustomer(props.row)"
              />
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                :aria-label="t('customer.actions.delete')"
                @click.stop="handleDeleteCustomer(props.row)"
              />
            </q-btn-group>
          </q-td>
        </template>
      </q-table>
    </QCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, defineEmits } from 'vue';
  import { useRouter } from 'vue-router';
  import { useQuasar } from 'quasar'; // v2.0.0
  import { useI18n } from 'vue-i18n'; // v9.0.0
  import DataTable from '../common/DataTable.vue';
  import SearchBar from '../common/SearchBar.vue';
  import { useCustomerStore } from '@/stores/customer.store';
  import { CustomerStatus, type ICustomer } from '@/models/customer.model';
  import { validateRequired } from '@/utils/validation.util';

  // Define emits
  const emit = defineEmits<{
    (e: 'row-click', customerId: number): void;
    (e: 'search', searchText: string): void;
    (e: 'create-customer'): void;
    (e: 'sort', field: string, order: 'asc' | 'desc'): void;
  }>();

  // Initialize composables
  const router = useRouter();
  const $q = useQuasar();
  const { t } = useI18n();
  const customerStore = useCustomerStore();


  // Component state
  const filters = ref({
    region: 'North',
    status: null as CustomerStatus | null,
    search: '',
    industry:'',
  });

  const pagination = ref({
    sortBy: 'FirstName',
    descending: false,
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
  });
  const onTableRequest = async (props: any) => {

    const { page, rowsPerPage, sortBy, descending } = props.pagination;

    // Update pagination state reactively
    Object.assign(pagination.value, {
      page,
      rowsPerPage,
      sortBy,
      descending,
    });

    await fetchCustomers();
};

  // Table columns definition
  const columns = [
    {
      name: 'code',
      field: 'code',
      label: t('customer.fields.code'),
      align: 'left' as const,
      sortable: false,
      required: true,
    },
    {
      name: 'name',
      field: 'name',
      label: t('customer.fields.name'),
      align: 'left' as const,
      sortable: false,
      required: true,
    },
    {
      name: 'region',
      field: 'region',
      label: t('customer.fields.region'),
      align: 'left' as const,
      sortable: false
    },
    {
      name: 'status',
      field: (row: any) => (row.isActive ? 'ACTIVE' : 'INACTIVE'),
      label: t('customer.fields.status'),
      align: 'center' as const,
      sortable: false
    },
    {
      name: 'actions',
      field: 'actions',
      label: t('customer.fields.actions'),
      align: 'center' as const,
      required: true,
    },
  ];

  // Computed properties
  const regionOptions = computed(() => [
    // { label: t('customer.regions.all'), value: null },
    { label: t('customer.regions.north'), value: 'North' },
    { label: t('customer.regions.south'), value: 'South' },
    { label: t('customer.regions.east'), value: 'East' },
    { label: t('customer.regions.west'), value: 'West' },
  ]);

  const industryOptions = computed(() => [
    { label: t('customer.industry.all'), value: null },
    { label: t('customer.industry.energy'), value: 'Energy' },
    { label: t('customer.industry.manufacturing'), value: 'Manufacturing' },
    { label: t('customer.industry.transportation'), value: 'Transportation' },
    { label: t('customer.industry.utilities'), value: 'Utilities' },
  ]);

  const statusOptions = computed(() => [
    { label: t('customer.status.all'), value: null },
    { label: t('customer.status.active'), value: CustomerStatus.Active },
    { label: t('customer.status.inactive'), value: CustomerStatus.Inactive },
    //{ label: t('customer.status.pending'), value: CustomerStatus.Pending },
  ]);

  const customerList = computed(() => customerStore.customerList);
  const loading = computed(() => customerStore.loading);

  // Event handlers
  const handleSearch = async (searchText: string) => {
    try {
      filters.value.search = searchText;
      pagination.value.page = 1;
      await fetchCustomers();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: t('customer.errors.search_failed'),
        position: 'top',
      });
    }
  };

 const handleSearchClear = async () => {
  try {
    filters.value.search = '';
    pagination.value.page = 1;
    await fetchCustomers();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('customer.errors.load_failed'),
      position: 'top',
    });
    console.error('Error clearing search:', error);
  }
};

  const handleFilterChange = async () => {
    try {
      fetchCustomers();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: t('customer.errors.filter_failed'),
        position: 'top',
      });
    }
  };

  const handleRowClick = async (evt: Event, row: ICustomer) => {
  };


  const handleAddCustomer = () => {
    emit('create-customer');
  };

  const handleEditCustomer = (customer: ICustomer) => {
    router.push({
      name: 'edit-customer',
      params: { id: customer.id  },
    });
  };

  const handleDeleteCustomer = (customer: ICustomer) => {
    $q.dialog({
      title: t('customer.delete.title'),
      message: t('customer.delete.confirm', { name: customer.name }),
      cancel: true,
      persistent: true,
      ok: {
        color: 'negative',
        label: t('common.delete'),
        'aria-label': t('customer.delete.confirm_aria'),
      },
    }).onOk(async () => {
      try {
        await customerStore.deleteCustomer(customer.id);
        $q.notify({
          type: 'positive',
          message: t('customer.delete.success'),
          position: 'top',
        });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: t('customer.delete.error'),
          position: 'top',
        });
      }
    });
  };

  const getStatusColor = (status: CustomerStatus): string => {
    const statusColors = {
      [CustomerStatus.Active]: 'positive',
      [CustomerStatus.Inactive]: 'negative',
      [CustomerStatus.Pending]: 'warning',
      [CustomerStatus.Suspended]: 'grey',
    };
    return statusColors[status] || 'grey';
  };




  const fetchCustomers = async () => {
  try {
    const response = await customerStore.fetchCustomers({
      region: filters.value.region,
      status: filters.value.status,
      search: filters.value.search,
      industry: filters.value.industry,
      page: pagination.value.page,
      pageSize: pagination.value.rowsPerPage,
    });
    if (response && typeof response.total === 'number') {
      pagination.value.rowsNumber = response.total;
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('customer.errors.load_failed'),
      position: 'top',
    });
  }
};

  // Lifecycle hooks
  onMounted(fetchCustomers);
</script>

<style lang="scss" scoped>
  .customer-list {
    width: 100%;
    height: 100vh;
    min-height: 400px;
    position: relative;
    background-color: var(--q-primary-light, #f8fafc);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    padding: 1.5rem;

    .filter-section {
      margin-bottom: 1.5rem;
      background: var(--q-primary);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.15);
      width: 100%;

      .q-card__section {
        padding: 1.5rem;
      }

      .row {
        margin: 0 -0.75rem;
        width: 100%;

        > .col-12 {
          padding: 0.75rem;
        }
      }

      :deep(.search-bar) {
        width: 100%;

        .q-field__control {
          height: 44px;
          background: white;
          border-radius: 8px;
          padding: 0 12px;
        }

        .q-field__native {
          padding: 0 12px;
          color: var(--q-dark);
          font-size: 0.875rem;
        }

        .q-field__native::placeholder {
          color: rgba(0, 0, 0, 0.6);
        }

        .q-field__label {
          color: white;
          font-weight: 500;
          font-size: 0.875rem;
          padding-left: 12px;
        }

        .q-icon {
          color: var(--q-primary);
        }
      }

      :deep(.status-filter) {
        width: 100%;

        .q-field__control {
          height: 44px;
          background: white;
          border-radius: 8px;
          padding: 0 12px;
        }

        .q-field__label {
          color: white;
          font-weight: 500;
          font-size: 0.875rem;
          padding-left: 12px;
        }

        .q-chip {
          background: rgba(255, 255, 255, 0.9) !important;
          color: var(--q-primary);
          font-weight: 500;
          margin: 2px;
        }
      }

      :deep(.q-field--outlined) {
        .q-field__control:before {
          border-color: rgba(255, 255, 255, 0.3);
        }

        &:hover .q-field__control:before {
          border-color: white;
        }

        &.q-field--focused .q-field__control {
          border-color: white;
        }
      }

      @media (max-width: $breakpoint-sm) {
        .q-card__section {
          padding: 1rem;
        }

        .row {
          margin: 0 -0.5rem;

          > .col-12 {
            padding: 0.5rem;
          }
        }
      }
    }


    .filter-section {
  background: var(--q-primary-light, #f0f4f8);
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  padding: 1rem;

  .q-card__section {
    padding: 1.5rem;
  }

  .search-bar {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .add-btn {
    width: 100%;
    max-width: 180px;
    font-weight: 600;
    padding: 8px 12px;
  }

  @media (max-width: 768px) {
    .filter-select {
      width: 100%;
    }

    .add-btn {
      max-width: 100%;
      justify-content: center;
    }
  }
}

    :deep(.q-table) {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

      thead {
        tr {
          background-color: var(--q-primary-light, #e3f2fd);

          th {
            font-weight: 600;
            color: var(--q-primary, #1976d2);
            padding: 1rem;
            font-size: 0.875rem;
            border-bottom: 2px solid var(--q-primary-light, rgba(25, 118, 210, 0.1));
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
      }

      tbody tr {
        transition: all 0.2s ease;

        td {
          color: var(--q-dark, #1d1d1d);
          font-size: 0.875rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        &:hover {
          background-color: var(--q-primary-light, rgba(25, 118, 210, 0.05));
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
      }
    }

    .q-card {
      background-color: white;
    }

    // Dark mode support
    .body--dark & {
      background-color: var(--q-dark);

      .filter-section {
        background: var(--q-primary-dark, #1565c0);

        :deep(.search-bar),
        :deep(.status-filter) {
          .q-field__control {
            background: var(--q-dark-page);
          }

          .q-field__native {
            color: white;

            &::placeholder {
              color: rgba(255, 255, 255, 0.7);
            }
          }

          .q-icon {
            color: white;
          }
        }
      }

      :deep(.q-table) {
        background-color: var(--q-dark-page);

        thead tr {
          background-color: var(--q-primary-dark, rgba(25, 118, 210, 0.2));

          th {
            color: white;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          }
        }

        tbody tr {
          td {
            color: rgba(255, 255, 255, 0.9);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }

          &:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }
        }
      }
    }

    // Responsive adjustments
    @media (max-width: $breakpoint-sm) {
      padding: 1rem;

      .filter-section {
        padding: 1rem;
      }

      :deep(.q-table) {
        thead tr th,
        tbody tr td {
          padding: 0.75rem;
          font-size: 0.8125rem;
        }
      }
    }

    // High contrast mode support
    @media (forced-colors: active) {
      & {
        border: 1px solid CanvasText;
      }

      :deep(.q-btn) {
        border: 1px solid CanvasText;
      }
    }
  }
</style>
