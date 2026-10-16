export type DepartmentLoad = {
    departmentId: number;
    deliveriesToday: number;
    dailyCapacity: number;
    utilizationPercent: number;
    warning: boolean;
    overloaded: boolean;
};
