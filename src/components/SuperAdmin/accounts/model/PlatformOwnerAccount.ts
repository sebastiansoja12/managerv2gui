export type PlatformOwnerAccount = {
    platformOwnerId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    active: boolean;
    createdAt?: string;
};

export type CreatePlatformOwnerRequest = {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    email: string;
};

export type ChangePlatformOwnerPasswordRequest = {
    password: string;
};

export const createEmptyPlatformOwnerRequest = (): CreatePlatformOwnerRequest => ({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
});
