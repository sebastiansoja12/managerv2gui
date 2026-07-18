import { AppEnvironment } from "./appEnvironment";
import {APP_VERSION} from "./appVersion";

export const getAppVersion = (env: AppEnvironment): string => {
    const version = APP_VERSION || "-";
    const shouldUseSnapshotSuffix = env === "development" || env === "test";
    const displayVersion = shouldUseSnapshotSuffix && !version.endsWith("-SNAPSHOT")
        ? `${version}-SNAPSHOT`
        : version;

    return `${env.toUpperCase()} ${displayVersion}`;
};
