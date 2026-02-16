export type AppEnvironment = "development" | "test" | "uat" | "production";

export const APP_ENVIRONMENT: AppEnvironment = "test";

export const getAppEnvironment = (): AppEnvironment => {
    const environmentFromBuild = process.env.REACT_APP_ENVIRONMENT as AppEnvironment | undefined;

    return environmentFromBuild || APP_ENVIRONMENT;
};
