export type OperatorUserRole = "USER" | "MANAGER" | "ADMIN" | "SUPPLIER";

export type CreateOperatorUserRequest = {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    email: string;
    role: OperatorUserRole;
    departmentCode: string;
    language: string;
};

export type UserIdResponse = {
    value: string | number;
};

export const createEmptyOperatorUserRequest = (): CreateOperatorUserRequest => ({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    email: "",
    role: "USER",
    departmentCode: "",
    language: "pl",
});
