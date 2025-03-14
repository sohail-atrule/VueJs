import { EquipmentStatus, EquipmentType, type EquipmentStatusValue, type EquipmentTypeValue } from '@/models/equipment-types';
import api from '@/utils/api.util';

const API_VERSION = 'v1';
const API_BASE_PATH = {
    adminDashboard:`/${API_VERSION}/Dashboard`,
    operationalDashboard:`/${API_VERSION}/Dashboard/operational-dashboard`,
    inspectorDashboard:`/${API_VERSION}/Dashboard/inspector-dashboard`,
};
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
export class EquipmentDto {
    id: number;
    serialNumber: string;
    model: string;
    type: EquipmentTypeValue;
    condition: string;
    status: EquipmentStatusValue;
    isActive: boolean;
    isAvailable: boolean;
    purchaseDate: Date;
    lastMaintenanceDate: Date | null;
    notes: string;

    constructor(init?: Partial<EquipmentDto>) {
      Object.assign(this, init);
    }
  }

  function convertToEquipmentDto(item: any): EquipmentDto {
      return new EquipmentDto({
          id: Number(item.id),
          serialNumber: item.serialNumber,
          model: item.name, // Using name as model
          type: EquipmentType.TestKit, // Default to TestKit for now
          condition: item.condition,
          status: item.isAvailable ? EquipmentStatus.AVAILABLE : EquipmentStatus.IN_USE,
          isActive: item.isActive !== 'retired',
          isAvailable: !!item.isAvailable,
          purchaseDate: new Date(item.purchaseDate),
          lastMaintenanceDate: item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate) : null,
          notes: item.notes
      });
  }

export const fetchDashboardValues = async () => {
    try {
        logger.info('Fetching Dashboard details');

      const response = await api.get(API_BASE_PATH.adminDashboard);
       return response.data;
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
       throw new Error('Failed to fetch dashboard data');
    }
  };
export const fetchOperationalDashboardValues = async () => {
    try {
        logger.info('Fetching Dashboard details');

      const response = await api.get(API_BASE_PATH.operationalDashboard);
       return response.data;
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
       throw new Error('Failed to fetch dashboard data');
    }
};
export const fetchInspectorDashboardValues = async () => {
    try {
        logger.info('Fetching Dashboard details');
      const response = await api.get(API_BASE_PATH.inspectorDashboard);
      debugger;
      return response.data;
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
       throw new Error('Failed to fetch dashboard data');
    }
};
