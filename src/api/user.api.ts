/**
 * @fileoverview User API client module providing comprehensive user management operations
 * with enhanced error handling, validation, retry logic, and logging capabilities.
 * @version 1.0.0
 */

import type { IUser } from '../models/user.model';
import api from '../utils/api.util';
import retry from 'axios-retry';
import rateLimit from 'axios-rate-limit';
import createError from 'http-errors';
import axios from 'axios';

// API endpoint constants
const API_VERSION = 'v1';
const API_ENDPOINTS = {
  USERS: `/${API_VERSION}/users`,
} as const;

// Retry configuration for failed requests
const RETRY_CONFIG = {
  retries: 3,
  retryDelay: retry.exponentialDelay,
  retryCondition: retry.isNetworkOrIdempotentRequestError,
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 50,
  perMilliseconds: 1000,
};

// Simple logger for browser environment
const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[MOCK API] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[MOCK API ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[MOCK API WARNING] ${message}`, ...args);
  },
};

// Dummy data for users
const dummyUsers: IUser[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    isActive: true,
    phoneNumber: '+1234567890',
    azureAdB2CId: 'dummy-azure-id-1',
    userRoles: [{ id: 1, userId: 1, roleId: 1, assignedAt: new Date(), revokedAt: null }],
    createdAt: new Date('2024-01-01'),
    modifiedAt: null,
    lastLoginAt: new Date('2024-03-15'),
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    isActive: true,
    phoneNumber: '+0987654321',
    azureAdB2CId: 'dummy-azure-id-2',
    userRoles: [{ id: 2, userId: 2, roleId: 2, assignedAt: new Date(), revokedAt: null }],
    createdAt: new Date('2024-01-15'),
    modifiedAt: null,
    lastLoginAt: new Date('2024-03-14'),
  },
  {
    id: 3,
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    isActive: false,
    phoneNumber: '+1122334455',
    azureAdB2CId: 'dummy-azure-id-3',
    userRoles: [{ id: 3, userId: 3, roleId: 3, assignedAt: new Date(), revokedAt: null }],
    createdAt: new Date('2024-02-01'),
    modifiedAt: null,
    lastLoginAt: new Date('2024-03-10'),
  },
];

/**
 * User API client class providing comprehensive user management operations
 * with error handling, validation, and logging capabilities.
 */
export class UserApiClient {
  constructor() {
    // Configure retry and rate limiting
    retry(api, RETRY_CONFIG);
    rateLimit(api, RATE_LIMIT_CONFIG);
  }

  /**
   * Retrieves a list of users with pagination and filtering
   * @param params Query parameters for filtering and pagination
   * @returns Promise resolving to array of users and total count
   * @throws {ApiError} If the request fails
   */
  async getUsers(params: {
    pageNumber: number;
    pageSize: number;
    searchTerm?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: IUser[]; total: number }> {
    try {

      logger.info('GET /api/v1/users', params);
      const response = await api.get(API_ENDPOINTS.USERS, {
        params: {
          pageNumber: params.pageNumber,
          pageSize: params.pageSize,
          searchTerm: params.searchTerm || undefined,
          isActive: params.isActive !== undefined ? params.isActive : undefined,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder,
        },
      });

      const { users, totalCount } = response.data;

      logger.info('Response:', { total: totalCount, users: users.length });
      return {
        users,
        total: totalCount
      };
    } catch (error) {
      logger.error('Failed to fetch users list', { error, params });
      throw createError(500, 'Failed to fetch users list', { cause: error });
    }
  }

  /**
   * Retrieves a user by ID
   * @param id User identifier
   * @returns Promise resolving to the user
   * @throws {ApiError} If the request fails or user is not found
   */
  async getUserById(id: number): Promise<IUser> {
    try {
      logger.info(`GET /api/v1/users/${id}`);
      const response = await api.get(`${API_ENDPOINTS.USERS}/${id}`, {
        headers: { 'Accept': 'application/json' },
      });
      logger.info('Response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch user by ID', { error, id });
      throw createError(error.response?.status || 500, 'Failed to fetch user', { cause: error });
    }
  }

  /**
   * Creates a new user
   * @param userData User data to create
   * @returns Promise resolving to created user
   * @throws {ApiError} If the request fails or validation errors occur
   */

  async createUser(userData: Partial<IUser>): Promise<IUser> {
    try {
      logger.info('POST /api/v1/users', { userData });
      const response = await api.post(API_ENDPOINTS.USERS, userData, {
        headers: { 'Content-Type': 'application/json' },
      });
      logger.info('Response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to create user', { error, userData });
      throw createError(error.response?.status || 400, 'Failed to create user', { cause: error });
    }
  }

  /**
   * Updates an existing user
   * @param id User identifier
   * @param updates Updated user data
   * @returns Promise resolving to updated user
   * @throws {ApiError} If the request fails or user is not found
   */

  async updateUser(id: number, updates: Partial<IUser>): Promise<IUser> {

    try {
      logger.info(`PUT /api/v1/users/${id}`, { updates });
      const response = await api.put(`${API_ENDPOINTS.USERS}/${id}`, updates, {
        headers: { 'Content-Type': 'application/json' },
      });
      logger.info('Response:', response.data);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to update user', { error, id, updates });
      throw createError(error.response?.status || 400, 'Failed to update user', { cause: error });
    }
  }

  /**
   * Deletes a user
   * @param id User identifier
   * @throws {ApiError} If the request fails or user is not found
   */

  async deleteUser(id: number): Promise<void> {
    try {
      logger.info(`DELETE /api/v1/users/${id}`);
      await api.delete(`${API_ENDPOINTS.USERS}/${id}`);
      logger.info('User deleted successfully');
    } catch (error: any) {
      logger.error('Failed to delete user', { error, id });
      throw createError(error.response?.status || 400, 'Failed to delete user', { cause: error });
    }
  }
}

// Export singleton instance
const userApiClient = new UserApiClient();
export default userApiClient;

// Export individual functions for convenience
export const getUserById = (id: number) =>
  userApiClient.getUserById(id);

export const getUsers = (params: Parameters<UserApiClient['getUsers']>[0]) =>
  userApiClient.getUsers(params);

export const createUser = (userData: Parameters<UserApiClient['createUser']>[0]) =>
  userApiClient.createUser(userData);

export const updateUser = (id: number, updates: Parameters<UserApiClient['updateUser']>[1]) =>
  userApiClient.updateUser(id, updates);

export const deleteUser = (id: number) => userApiClient.deleteUser(id);
