/**
 * @fileoverview Equipment API client module providing comprehensive equipment management operations
 * with enhanced error handling, validation, retry logic, and logging capabilities.
 * @version 1.0.0
 */

import { Equipment, EquipmentType, EquipmentStatus } from '../models/equipment.model';
import type { EquipmentAssignment, EquipmentHistory } from '../models/equipment-types';
import api from '../utils/api.util';
import retry from 'axios-retry';
import rateLimit from 'axios-rate-limit';
import createError from 'http-errors';
import { eq } from 'lodash';

// API endpoint constants
const API_VERSION ='v1';
const API_ENDPOINTS = {
    EQUIPMENT: `/${API_VERSION}/equipment`,
    ASSIGNMENTS: `/${API_VERSION}/equipment/assignments`,
    HISTORY: `/${API_VERSION}/equipment/history`
} as const;

// Retry configuration for failed requests
const RETRY_CONFIG = {
    retries: 3,
    retryDelay: retry.exponentialDelay,
    retryCondition: retry.isNetworkOrIdempotentRequestError
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
    maxRequests: 50,
    perMilliseconds: 1000
};

// Simple logger for browser environment
const logger = {
    info: (message: string, ...args: any[]) => {
        console.log(`[INFO] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {

        console.error(`[ERROR] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(`[WARN] ${message}`, ...args);
    }
};

// Helper function to convert IEquipment to Equipment
function convertToEquipment(item: any): Equipment {
    return new Equipment({
        id: Number(item.id),
        serialNumber: item.serialNumber,
        model: item.name, // Using name as model
        type: EquipmentType.TestKit, // Default to TestKit for now
        condition: item.condition,
        status: item.status?.toUpperCase() || 'AVAILABLE',
        isActive: item.status !== 'retired',
        isAvailable: item.status === 'available',
        purchaseDate: new Date(item.purchaseDate),
        lastMaintenanceDate: item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate) : null,
        notes: item.notes,
        specifications: item.specifications ? {
            manufacturer: item.specifications.manufacturer,
            model: item.specifications.model,
            calibrationDue: item.specifications.calibrationDue,
            warranty: item.specifications.warranty
        } : null,
        maintenanceHistory: item.history ? item.history.map((record: any) => ({
            id: record.id,
            date: record.date,
            type: record.type,
            technician: record.technician,
            notes: record.notes
        })) : [],
        documents: item.documents ? item.documents.map((doc: any) => ({
            id: doc.id,
            type: doc.type,
            name: doc.name,
            url: doc.url
        })) : []
    });
}

// Helper function to convert Equipment to IEquipment
function convertToIEquipment(item: Equipment): any {
    return {
        id: String(item.id || 0),
        name: item.model,
        type: item.type,
        serialNumber: item.serialNumber,
        status: (item.status || 'available').toLowerCase(),
        condition: item.condition,
        purchaseDate: item.purchaseDate,
        lastMaintenanceDate: item.lastMaintenanceDate,
        assignedTo: null, // This would need to come from assignments
        location: '', // This would need to be added to the Equipment type
        notes: item.notes,
        specifications: item.specifications,
        maintenanceHistory: item.maintenanceHistory,
        documents: item.documents,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "Admin", // Hardcoded for now
    };
}

/**
 * Equipment API client class providing comprehensive equipment management operations
 * with error handling, validation, and logging capabilities.
 */
export class EquipmentApiClient {
    constructor() {
        // Configure retry and rate limiting
        retry(api, RETRY_CONFIG);
        rateLimit(api, RATE_LIMIT_CONFIG);
    }

    /**
     * Retrieves a list of all equipment items with optional filtering
     * @param params Optional query parameters for filtering equipment
     * @returns Promise resolving to array of Equipment items
     * @throws {ApiError} If the request fails or validation errors occur
     */
    async getEquipmentList(params?: {
        type?: typeof EquipmentType[keyof typeof EquipmentType];
        isAvailable?: boolean;
        search?: string;
    }): Promise<Equipment[]> {
        try {
            logger.info('Fetching equipment list', params);
            const response = await api.get<Equipment[]>(API_ENDPOINTS.EQUIPMENT, { params });
            return response.data.map(convertToEquipment);
        } catch (error) {
            logger.error('Failed to fetch equipment list', { error, params });
            throw createError(500, 'Failed to fetch equipment list', { cause: error });
        }
    }

    /**
     * Retrieves equipment details by ID
     * @param id Equipment identifier
     * @returns Promise resolving to Equipment details
     * @throws {ApiError} If the request fails or equipment is not found
     */
    async getEquipmentById(id: number): Promise<Equipment> {
        try {
            logger.info('Fetching equipment details', { id });
            const response = await api.get<Equipment>(`${API_ENDPOINTS.EQUIPMENT}/${id}`);
            return convertToEquipment(response.data);
        } catch (error) {
            logger.error('Failed to fetch equipment details', { error, id });
            throw createError(404, 'Equipment not found', { cause: error });
        }
    }

    /**
     * Creates a new equipment record
     * @param equipment Equipment data to create
     * @returns Promise resolving to created Equipment
     * @throws {ApiError} If the request fails or validation errors occur
     */
    async createEquipment(equipment: Partial<Equipment>): Promise<Equipment> {
        try {

            logger.info('Creating new equipment', { equipment });
            // Create a proper Equipment instance first
            const equipmentInstance = new Equipment(equipment);
            const iequipment = convertToIEquipment(equipmentInstance);
            iequipment.createdBy = "Admin";
            const response = await api.post(API_ENDPOINTS.EQUIPMENT, iequipment);
            return convertToEquipment(response.data);
        } catch (error) {
            logger.error('Failed to create equipment', { error, equipment });
            throw createError(400, 'Failed to create equipment', { cause: error });
        }
    }

    /**
     * Updates an existing equipment record
     * @param id Equipment identifier
     * @param equipment Updated equipment data
     * @returns Promise resolving to updated Equipment
     * @throws {ApiError} If the request fails or equipment is not found
     */
    async updateEquipment(id: number, equipment: Partial<Equipment>): Promise<Equipment> {
        try {
            logger.info('Updating equipment', { id, equipment });
            const iequipment = convertToIEquipment({ id, ...equipment } as Equipment);
            const response = await api.put<Equipment>(`${API_ENDPOINTS.EQUIPMENT}/${id}`, iequipment);
            return convertToEquipment(response.data);
        } catch (error) {
            logger.error('Failed to update equipment', { error, id, equipment });
            throw createError(400, 'Failed to update equipment', { cause: error });
        }
    }

    /**
     * Assigns equipment to an inspector
     * @param assignment Equipment assignment details
     * @returns Promise resolving to created EquipmentAssignment
     * @throws {ApiError} If the request fails or validation errors occur
     */
    async assignEquipment(assignment: Omit<EquipmentAssignment, 'id'>): Promise<EquipmentAssignment> {
        try {
            logger.info('Assigning equipment', { assignment });
            const response = await api.post<EquipmentAssignment>(API_ENDPOINTS.ASSIGNMENTS, assignment);
            return response.data;
        } catch (error) {
            logger.error('Failed to assign equipment', { error, assignment });
            throw createError(400, 'Failed to assign equipment', { cause: error });
        }
    }

    /**
     * Records equipment return
     * @param equipmentId Equipment identifier
     * @param returnDetails Return condition and notes
     * @returns Promise resolving to updated EquipmentAssignment
     * @throws {ApiError} If the request fails or assignment is not found
     */
    async returnEquipment(
        equipmentId: number,
        returnDetails: { returnCondition: string; notes?: string }
    ): Promise<EquipmentAssignment> {
        try {
            logger.info('Processing equipment return', { equipmentId, returnDetails });
            const response = await api.put<EquipmentAssignment>(
                `${API_ENDPOINTS.ASSIGNMENTS}/${equipmentId}/return`,
                returnDetails
            );
            return response.data;
        } catch (error) {
            logger.error('Failed to return equipment', { error, equipmentId, returnDetails });
            throw createError(400, 'Failed to process equipment return', { cause: error });
        }
    }

    /**
     * Retrieves equipment assignment history
     * @param equipmentId Equipment identifier
     * @returns Promise resolving to array of EquipmentHistory records
     * @throws {ApiError} If the request fails
     */
    async getEquipmentHistory(equipmentId: number): Promise<EquipmentHistory[]> {
        try {
            logger.info('Fetching equipment history', { equipmentId });
            const response = await api.get<EquipmentHistory[]>(
                `${API_ENDPOINTS.HISTORY}/${equipmentId}`
            );
            return response.data;
        } catch (error) {
            logger.error('Failed to fetch equipment history', { error, equipmentId });
            throw createError(500, 'Failed to fetch equipment history', { cause: error });
        }
    }
}

// Export singleton instance
export const equipmentApi = new EquipmentApiClient();
export default equipmentApi;

// Standalone functions using the same logger and error handling
export async function getEquipmentList(filters: Record<string, any>): Promise<Equipment[]> {
    try {

        const params = {
            page: filters.page || 1,
            pageSize: filters.pageSize || 10,
            startDate: filters.startDate || null,
            endDate: filters.endDate || null,
            isAvailable: filters.availability ?? null,  // Ensure boolean values are passed correctly
            searchTerm: filters.searchTerm || ''
        };

        logger.info('Final API Query Params:', params);

        const response = await api.get(API_ENDPOINTS.EQUIPMENT, {
            params: params, // Pass the parameters as query parameters
            headers: {
                'Content-Type': 'application/json' // This is usually not necessary for GET requests
            }
        });
        return response.data.map(convertToEquipment);
    } catch (error) {
        logger.error('Failed to fetch equipment list', { error });
        throw createError(500, 'Failed to fetch equipment list', { cause: error });
    }
}

export async function getEquipmentById(id: number): Promise<Equipment> {
    try {
        logger.info('Fetching equipment details', { id });
        const response = await api.get(`${API_ENDPOINTS.EQUIPMENT}/${id}`);
        return convertToEquipment(response.data);
    } catch (error) {
        logger.error('Failed to fetch equipment details', { error, id });
        throw createError(404, 'Equipment not found', { cause: error });
    }
}

export async function createEquipment(equipment: Partial<any>): Promise<Equipment> {
    try {

        equipment.createdBy = "Admin";

        const response = await api.post(API_ENDPOINTS.EQUIPMENT, equipment);
        return response.data;
    } catch (error) {
        logger.error('Failed to create equipment', { error, equipment });
        throw createError(400, 'Failed to create equipment', { cause: error });
    }
}

export async function updateEquipment(id: number, updates: Partial<Equipment>): Promise<Equipment> {
    try {
        logger.info('Updating equipment', { id, updates });
        const iequipment = convertToIEquipment({ id, ...updates } as Equipment);
        const response = await api.put(`${API_ENDPOINTS.EQUIPMENT}/${id}`, iequipment);
        return convertToEquipment(response.data);
    } catch (error) {
        logger.error('Failed to update equipment', { error, id, updates });
        throw createError(400, 'Failed to update equipment', { cause: error });
    }
}

export async function assignEquipment(equipment: any): Promise<void> {
    try {

        logger.info('Assigning equipment', { equipment });
        await api.put(`/v1/equipment/`+ equipment.equipmentId +`/assign`, equipment);
    } catch (error) {
        throw createError(400, 'Failed to assign equipment', { cause: error });
    }
}

export async function returnEquipment(equipmentId: number, returnDetails: any): Promise<void> {
    try {
        logger.info('Processing equipment return', { equipmentId });
        await api.put(`/v1/equipment/${equipmentId}/return`, returnDetails);
    } catch (error) {
        logger.error('Failed to return equipment', { error, equipmentId });
        throw createError(400, 'Failed to return equipment', { cause: error });
    }
}

export async function getEquipmentHistory(equipmentId: number): Promise<EquipmentHistory[]> {
    try {
        logger.info('Fetching equipment history', { equipmentId });
        const response = await api.get(`${API_ENDPOINTS.HISTORY}/${equipmentId}`);
        return response.data;
    } catch (error) {
        logger.error('Failed to fetch equipment history', { error, equipmentId });
        throw createError(500, 'Failed to fetch equipment history', { cause: error });
    }
}
