import pl from "../../i18n/translate";
import {CarrierDto} from "../Carriers/model/Carrier";
import {DeviceDto} from "../Devices/dto/DeviceDto";
import {courierDeviceOptions, courierVehicleOptions, deviceLabel, packageTypeLabel, vehicleLabel} from "./courierOperationalData";

const carrier = (carrierId: number, name: string, active: boolean, vehicles: CarrierDto["vehicles"]): CarrierDto => ({
    carrierId, name, active, drivers: [], vehicles,
});

const carriers = [
    carrier(1, "Trans-Pol", true, [
        {vehicleId: "6047483447382963523", registrationNumber: "SK 12345", brand: "Volvo", model: "FH16", vehicleType: "TRUCK", active: true},
        {vehicleId: 11, registrationNumber: "SK 999", brand: null, model: null, vehicleType: "VAN", active: false},
    ]),
    carrier(2, "Kurier-Bis", false, [
        {vehicleId: 20, registrationNumber: "KR 1", brand: "Iveco", model: "Daily", vehicleType: "VAN", active: true},
    ]),
    carrier(3, "Ekspres", true, [
        {vehicleId: 30, registrationNumber: "WA 7", brand: "Ford", model: null, vehicleType: "VAN", active: true},
    ]),
];

describe("courier vehicle options", () => {
    it("lists active vehicles of active carriers with registration, make, model and carrier", () => {
        const options = courierVehicleOptions(carriers, null);
        expect(options).toEqual([
            {id: "6047483447382963523", label: "SK 12345 · Volvo FH16 — Trans-Pol", selectable: true},
            {id: "30", label: "WA 7 · Ford — Ekspres", selectable: true},
        ]);
    });

    it("keeps the current vehicle listed even when it is inactive", () => {
        const options = courierVehicleOptions(carriers, 11);
        expect(options).toContainEqual({id: "11", label: "SK 999 — Trans-Pol", selectable: false});
    });

    it("marks a current vehicle that no carrier owns", () => {
        const options = courierVehicleOptions(carriers, "94151");
        expect(options[0]).toEqual({
            id: "94151", label: pl.couriers.fields.vehicleMissing.replace("{id}", "94151"), selectable: false,
        });
        expect(vehicleLabel(options, 94151)).toBe(options[0].label);
    });
});

describe("package type labels", () => {
    it("translates known types and falls back to the raw value", () => {
        expect(packageTypeLabel("FRAGILE")).toBe(pl.couriers.fields.packageType.FRAGILE);
        expect(packageTypeLabel("PALLET")).toBe("PALLET");
    });
});

const device = (deviceId: string, deviceType: string, depot: string, active: boolean, username: string | null = null): DeviceDto => ({
    deviceId: {value: deviceId}, version: null, deviceType, username: username ? {value: username} : null,
    depotCode: {value: depot}, lastUpdate: null, active,
});

describe("courier device options", () => {
    const devices = [
        device("TL:waw-1", "TERMINAL", "WAW1", true),
        device("MB:kt-2", "MOBILE", "KT1", true, "s-soja"),
        device("TL:kt-old", "TERMINAL", "KT1", false),
    ];

    it("lists active devices of the courier department first with type, owner and department", () => {
        expect(courierDeviceOptions(devices, null, "KT1")).toEqual([
            {id: "MB:kt-2", label: `MB:kt-2 · ${pl.devices.create.deviceTypes.MOBILE} · s-soja · KT1`, selectable: true},
            {id: "TL:waw-1", label: `TL:waw-1 · ${pl.devices.create.deviceTypes.TERMINAL} · WAW1`, selectable: true},
        ]);
    });

    it("keeps the current inactive or unknown device listed but not selectable", () => {
        expect(courierDeviceOptions(devices, "TL:kt-old", "KT1"))
            .toContainEqual({id: "TL:kt-old", label: `TL:kt-old · ${pl.devices.create.deviceTypes.TERMINAL} · KT1`, selectable: false});
        const options = courierDeviceOptions(devices, "TL:gone", "KT1");
        expect(options[0]).toEqual({id: "TL:gone", label: pl.couriers.fields.deviceMissing.replace("{id}", "TL:gone"), selectable: false});
        expect(deviceLabel(options, "TL:gone")).toBe(options[0].label);
    });
});
