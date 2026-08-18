import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import {CarrierDto, DriverDto} from "./model/Carrier";

export const carrierDetailsPath = (carrierId: number | string) => `/carriers/${encodeURIComponent(String(carrierId))}`;

export const driverDetailsPath = (driverId: number | string) => `/drivers/${encodeURIComponent(String(driverId))}`;

export const carrierDetailsTab = (carrier: Pick<CarrierDto, "carrierId" | "name">): AppTabDefinition => ({
    label: `${pl.carriers.view.tabTitle} ${carrier.name}`,
    path: carrierDetailsPath(carrier.carrierId),
});

export const driverDetailsTab = (driver: Pick<DriverDto, "driverId" | "firstName" | "lastName">): AppTabDefinition => ({
    label: `${pl.drivers.view.tabTitle} ${driver.firstName} ${driver.lastName}`,
    path: driverDetailsPath(driver.driverId),
});
