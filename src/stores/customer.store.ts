/**
 * @fileoverview Pinia store for managing customer-related state and operations.
 * Implements comprehensive customer data management with optimistic updates and enhanced error handling.
 * @version 1.0.0
 */

import { defineStore } from 'pinia';
import { useNotificationStore } from './notification.store';
import customerApi from '../api/customer.api';
import type { ICustomer } from '../models/customer.model';
import { CustomerStatus } from '../models/customer.model';
import { ref } from 'vue';

/**
 * Interface defining the API response structure
 */
interface ApiResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interface defining pagination metadata
 */
interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

/**
 * Interface defining filter criteria
 */
interface FilterState {
  search: string;
  region: string;
  status: CustomerStatus | null;
}

/**
 * Interface defining sorting criteria
 */
interface SortingState {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Interface defining the customer store state
 */
interface CustomerState {
  customers: Map<number, ICustomer>;
  loading: boolean;
  error: string | null;
  filters: FilterState;
  pagination: PaginationState;
  sorting: SortingState;
  selectedCustomerId: number | null;
}

/**
 * Pinia store for managing customer state
 */
export const useCustomerStore = defineStore('customer', {
  state: (): any => ({
    customers: new Map(),
    loading: false,
    error: null,
    selectedCustomerId: null,
    filters: {
      search: '',
      region: '',
      status: null
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    },
    sorting: {
      field: 'name',
      order: 'asc'
    }
  }),

  getters: {
    customerList: (state): ICustomer[] => {
      return Array.from(state.customers.values());
    },

    selectedCustomer: (state): ICustomer | null => {
      if (!state.selectedCustomerId) return null;
      return state.customers.get(state.selectedCustomerId) || null;
    },

    totalPages: (state): number => {
      return Math.ceil(state.pagination.total / state.pagination.limit);
    }
  },

  actions: {


    async fetchCustomers(
      {
        region,
        status,
        search,
        industry,
        page,
        pageSize,
      }: {
        region: string;
        status: CustomerStatus;
        search: string;
        industry: string;
        page: number;
        pageSize: number;
      }
    ): Promise<void> {
      try {
        this.loading = true; 
        this.error = null; 
    
        // Fetch the list of customers from the API
        const response = await customerApi.getCustomers(
          {
            region,
            status,
            search,
            industry,
            page,
            pageSize,
          }
        );
    
        // Clear existing customers
        this.customers.clear();
    
        // Check if the response is an array
        if (Array.isArray(response.customers)) {
          // Update store with Map-based storage
          response.customers.forEach((customer: ICustomer) => {
            this.customers.set(customer.id, customer);
          });
          // Update total in store's pagination
        this.pagination.total = response.totalCount;
        // Return the response for the component to use
        return {
          customers: response.customers,
          total: response.totalCount,
        };
        } else {
          this.error = 'No customers found';
          useNotificationStore().error(this.error);
        }
      } catch (error) {
        // Handle errors
        this.error = error instanceof Error ? error.message : 'Failed to fetch customers';
        useNotificationStore().error(this.error); // Notify the user of the error
      } finally {
        this.loading = false; // Set loading state to false
      }
    },
    /**
     * Fetches a single customer
     */
    async fetchCustomerById(id: number): Promise<any> {
      try {
        this.loading = true;
        this.error = null;
        const customer = await customerApi.getCustomerById(id);
        // this.customers.set(customer.id, customer);
        // this.selectedCustomerId = customer.id;

        console.log("customer in store file", customer);
        return customer;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch customer details';
        useNotificationStore().error(this.error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Creates a new customer
     */
    async createCustomer(customer: Omit<any, 'id' | 'createdAt' | 'modifiedAt'>): Promise<void> {
      try {
        this.loading = true;
        this.error = null;

        const createdCustomer = await customerApi.createCustomer(customer);
        this.customers.set(createdCustomer.id, createdCustomer);
        
        useNotificationStore().success('Customer created successfully');
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create customer';
        useNotificationStore().error(this.error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Updates customer
     */


    async updateCustomer(id: number, updates: Partial<any>): Promise<void> {
      // const previousData = this.customers.get(id);
      // if (!previousData) return;


      try {
        this.loading = true;
        this.error = null;

        // Optimistic update
        // this.customers.set(id, { ...previousData, ...updates });

         await customerApi.updateCustomer(id, updates);
        //  this.customers.set(id, updatedCustomer);
        
        useNotificationStore().success('Customer updated successfully');
      } catch (error) {
        // Rollback on error
        // if (previousData) {
        //   this.customers.set(id, previousData);
        // }
        this.error = error instanceof Error ? error.message : 'Failed to update customer';
        useNotificationStore().error(this.error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Deletes customer
     */
    async deleteCustomer(id: number): Promise<void> {
      const previousData = this.customers.get(id);
      if (!previousData) return;

      try {
        this.loading = true;
        this.error = null;

        // Optimistic delete
        this.customers.delete(id);

        await customerApi.deleteCustomer(id);
        useNotificationStore().success('Customer deleted successfully');
      } catch (error) {
        // Rollback on error
        if (previousData) {
          this.customers.set(id, previousData);
        }
        this.error = error instanceof Error ? error.message : 'Failed to delete customer';
        useNotificationStore().error(this.error);
        throw error;
      } finally {
        this.loading = false;
      }
    },




    /**
     * Updates sorting criteria and refreshes data
     */
    async updateSorting(field: string, order: 'asc' | 'desc'): Promise<void> {
      this.sorting = { field, order };
      await this.fetchCustomers();
    },

    /**
     * Updates pagination settings and refreshes data
     */
    async updatePagination(page: number, limit?: number): Promise<void> {
      this.pagination.page = page;
      if (limit) this.pagination.limit = limit;
      await this.fetchCustomers({
        region: this.filters.region,
        status: this.filters.status,
        search: this.filters.search,
        industry: this.filters.search, 
        page: this.pagination.page,
        pageSize: this.pagination.limit,
      });
    },

    /**
     * Resets store state to initial values
     */
    resetState(): void {
      this.customers.clear();
      this.selectedCustomerId = null;
      this.error = null;
      this.loading = false;
      this.filters = {
        search: '',
        region: '',
        status: null
      };
      this.pagination = {
        page: 1,
        limit: 10,
        total: 0
      };
      this.sorting = {
        field: 'name',
        order: 'asc'
      };
    }
  }
});