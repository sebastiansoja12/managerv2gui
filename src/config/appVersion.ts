import {getAppEnvironment} from "./appEnvironment";

export const APP_VERSION = process.env.REACT_APP_VERSION;

export const getAppVersion = () => {
    const version = APP_VERSION || "-";
    const environment = getAppEnvironment();
    const shouldUseSnapshotSuffix = environment === "development" || environment === "test";

    if (!shouldUseSnapshotSuffix || version.endsWith("-SNAPSHOT")) {
        return version;
    }

    return `${version}-SNAPSHOT`;
};
