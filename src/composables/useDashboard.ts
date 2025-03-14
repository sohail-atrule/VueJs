import { fetchDashboardValues, fetchInspectorDashboardValues, fetchOperationalDashboardValues } from '@/api/dashboard.api';
import { EquipmentType } from '@/models';
import { onMounted, ref } from 'vue';

export interface DashboardData {
    dashboard: {
      equipment: number;
      availableEquipment: number;
      inspector: number;
      MobilizedInspector: number;
    };
    recentActivityLog: {
      icon: string;
      color: string;
      title: string;
      timestamp: string;
    }[];
  }
  const EquipmentTypeMapping = [
    EquipmentType.Laptop,         // 0
    EquipmentType.Mobile,         // 1
    EquipmentType.Tablet,         // 2
    EquipmentType.TestKit,        // 3
    EquipmentType.SafetyGear,     // 4
    EquipmentType.InspectionTool  // 5
];
export interface InspectorDashboardData {
    dashboard: {
      assignedEquipment: number;
      lastDrugTest: string;
      lastMobiledDate: string;
    };
    recentActivityLog: {
      icon: string;
      color: string;
      title: string;
      timestamp: string;
    }[];
    equipmentList: {
      serialNumber: string;
      type: string;
      status: string;
      assignedDate: string;
    }[];
  }


export function useDashboard() {
    const dashboardValues = ref<DashboardData | null>(null);
    const operationalDashboardValues = ref<DashboardData | null>(null);
    const inspectorDashboardValue = ref<any>(null);
    const fetchData = async () => {
        try {
            const data = await fetchDashboardValues();
             dashboardValues.value = data;
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        }
      };
    const fetchOperationalData = async () => {
        try {
            const data = await fetchOperationalDashboardValues();
             operationalDashboardValues.value = data;
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        }
      };


    const fetchInspectorData = async () => {
        try {
            const data = await fetchInspectorDashboardValues();
              var equipmentList = data.equipmentList.map((item: any) => {
                return {
                  serialNumber: item.serialNumber,
                  type: EquipmentTypeMapping[item.type] || EquipmentType.Laptop,
                  status: item.isActive?'IN_USE':'MAINTENANCE',
                  assignedDate: new Date(item.purchaseDate).toLocaleDateString()
                };
              });
              debugger;
              data.equipmentList = equipmentList;
              inspectorDashboardValue.value = data;
            return inspectorDashboardValue.value;
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        }
      };
      onMounted(() => {
        fetchData();
        fetchOperationalData();
        fetchInspectorData();
      });
    return { dashboardValues,fetchData,operationalDashboardValues,fetchOperationalData
        ,inspectorDashboardValue,fetchInspectorData

    }
}
