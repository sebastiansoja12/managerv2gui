import { AppEnvironment } from "./appEnvironment";

const BASE_VERSION = "2026.2";

const ENV_VERSION: Record<AppEnvironment, string> = {
    development: `${BASE_VERSION}-SNAPSHOT`,
    test: BASE_VERSION,
    uat: BASE_VERSION,
    production: BASE_VERSION,
};

export const getAppVersion = (env: AppEnvironment): string => {
    const version = ENV_VERSION[env];
    return `${env.toUpperCase()} ${version}`;
};