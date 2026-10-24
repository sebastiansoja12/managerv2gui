import pl from "../../i18n/translate";
import {CarrierDto, CarrierVehicleDto} from "../Carriers/model/Carrier";
import {DeviceDto} from "../Devices/dto/DeviceDto";

export const PACKAGE_TYPES = ["SMALL", "MEDIUM", "LARGE", "FRAGILE", "OVERSIZED"] as const;

export type PackageTypeCode = typeof PACKAGE_TYPES[number];

export const packageTypeLabel = (packageType: string) =>
    pl.couriers.fields.packageType[packageType as PackageTypeCode] || packageType;

export type CourierVehicleOption = {
    id: string;
    label: string;
    selectable: boolean;
};

const vehicleDescription = (vehicle: CarrierVehicleDto) =>
    [vehicle.brand, vehicle.model].map((part) => part?.trim()).filter(Boolean).join(" ");

export const vehicleOptionLabel = (vehicle: CarrierVehicleDto, carrierName: string) => {
    const description = vehicleDescription(vehicle);
    return `${vehicle.registrationNumber}${description ? ` · ${description}` : ""} — ${carrierName}`;
};

// Active vehicles of active carriers can be assigned; the courier's current vehicle stays listed
// (but not selectable) when it is inactive or no longer belongs to any carrier.
export const courierVehicleOptions = (carriers: CarrierDto[],
                                      currentVehicleId?: number | string | null): CourierVehicleOption[] => {
    const current = currentVehicleId === null || currentVehicleId === undefined ? null : String(currentVehicleId);
    const options: CourierVehicleOption[] = [];
    carriers.forEach((carrier) => {
        (carrier.vehicles || []).forEach((vehicle) => {
            const id = String(vehicle.vehicleId);
            const selectable = carrier.active && vehicle.active;
            if (selectable || id === current) {
                options.push({id, label: vehicleOptionLabel(vehicle, carrier.name), selectable});
            }
        });
    });
    options.sort((left, right) => left.label.localeCompare(right.label, pl.common.locale));
    if (current && !options.some((option) => option.id === current)) {
        options.unshift({id: current, label: pl.couriers.fields.vehicleMissing.replace("{id}", current), selectable: false});
    }
    return options;
};

export const vehicleLabel = (options: CourierVehicleOption[], vehicleId: number | string) => {
    const id = String(vehicleId);
    return options.find((option) => option.id === id)?.label
        || pl.couriers.fields.vehicleMissing.replace("{id}", id);
};

export type CourierDeviceOption = CourierVehicleOption;

const deviceTypeLabel = (deviceType: string | null) => (deviceType
    ? pl.devices.create.deviceTypes[deviceType as keyof typeof pl.devices.create.deviceTypes] || deviceType
    : null);

export const deviceOptionLabel = (device: DeviceDto) => [
    device.deviceId?.value,
    deviceTypeLabel(device.deviceType),
    device.username?.value,
    device.depotCode?.value,
].filter(Boolean).join(" · ");

// Active devices can be assigned, the courier's own department first; the current device stays listed
// (but not selectable) when it is inactive or no longer exists.
export const courierDeviceOptions = (devices: DeviceDto[], currentDeviceId?: string | null,
                                     departmentCode?: string | null): CourierDeviceOption[] => {
    const current = currentDeviceId || null;
    const ownDepartment = (device: DeviceDto) => Boolean(departmentCode) && device.depotCode?.value === departmentCode;
    const options = devices
        .filter((device) => device.deviceId?.value && (device.active !== false || device.deviceId.value === current))
        .sort((left, right) => {
            if (ownDepartment(left) !== ownDepartment(right)) {
                return ownDepartment(left) ? -1 : 1;
            }
            return deviceOptionLabel(left).localeCompare(deviceOptionLabel(right), pl.common.locale);
        })
        .map((device) => ({
            id: device.deviceId?.value as string,
            label: deviceOptionLabel(device),
            selectable: device.active !== false,
        }));
    if (current && !options.some((option) => option.id === current)) {
        options.unshift({id: current, label: pl.couriers.fields.deviceMissing.replace("{id}", current), selectable: false});
    }
    return options;
};

export const deviceLabel = (options: CourierDeviceOption[], deviceId: string) =>
    options.find((option) => option.id === deviceId)?.label
    || pl.couriers.fields.deviceMissing.replace("{id}", deviceId);
