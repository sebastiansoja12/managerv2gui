export const ACTING_DEPARTMENT_HEADER = "X-Acting-Department";

const STORAGE_KEY = "manager.actingDepartment";

export const getActingDepartment = (): string | null => {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
};

export const setActingDepartment = (departmentCode: string | null) => {
    try {
        if (departmentCode) {
            window.localStorage.setItem(STORAGE_KEY, departmentCode);
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        return;
    }
};
