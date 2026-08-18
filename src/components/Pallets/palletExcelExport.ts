import ShipmentService from "../../hooks/ShipmentService";
import pl from "../../i18n/translate";
import {departmentCodeValue, ShipmentDto} from "../Shipment/dto/ShipmentDto";
import {PalletDto} from "./model/Pallet";
import {formatPalletDate, formatPalletWeight, palletStatusLabel, transportTypeLabel} from "./palletLabels";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const loadShipments = async (pallet: PalletDto): Promise<Array<ShipmentDto | null>> => {
    const results = await Promise.allSettled(
        pallet.shipmentIds.map((shipmentId) => ShipmentService.getControlCenter(String(shipmentId))),
    );
    return results.map((result) => result.status === "fulfilled" ? result.value.data.shipment : null);
};

const download = (data: ArrayBuffer, filename: string) => {
    const url = URL.createObjectURL(new Blob([data], {type: XLSX_TYPE}));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const exportPalletExcel = async (pallet: PalletDto, departmentLabel: (id?: number | string | null) => string) => {
    const translations = pl.pallets.excel;
    const shipments = await loadShipments(pallet);
    const {default: ExcelJS} = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ManagerV2";

    const summary = workbook.addWorksheet(translations.palletSheet);
    summary.columns = [{width: 30}, {width: 48}];
    const carrier = pallet.carrier;
    summary.addRows([
        [translations.trackingNumber, pallet.trackingNumber],
        [translations.status, palletStatusLabel(pallet.palletStatus)],
        [translations.origin, departmentLabel(pallet.originDepartmentId)],
        [translations.destination, departmentLabel(pallet.destinationDepartmentId)],
        [translations.shipments, pallet.shipmentIds.length],
        [translations.grossWeight, formatPalletWeight(pallet.grossWeight, pallet.grossWeightUnit)],
        [translations.maxWeight, formatPalletWeight(pallet.maxGrossWeight, pallet.maxGrossWeightUnit)],
        [translations.seal, pallet.sealNumber || pl.common.dash],
        [translations.carrier, carrier?.carrierName || pl.common.dash],
        [translations.transportType, carrier ? transportTypeLabel(carrier.transportType) : pl.common.dash],
        [translations.driver, carrier ? [carrier.driverName, carrier.driverPhone].filter(Boolean).join(" · ") || pl.common.dash : pl.common.dash],
        [translations.vehicle, carrier ? [carrier.vehicleRegistrationNumber, carrier.trailerRegistrationNumber].filter(Boolean).join(" / ") : pl.common.dash],
        [translations.created, formatPalletDate(pallet.created)],
        [translations.modified, formatPalletDate(pallet.modified)],
    ]);
    summary.getColumn(1).font = {bold: true};

    const items = workbook.addWorksheet(translations.shipmentsSheet);
    items.columns = [
        {header: translations.columns.lp, width: 6},
        {header: translations.columns.trackingNumber, width: 26},
        {header: translations.columns.status, width: 18},
        {header: translations.columns.recipient, width: 28},
        {header: translations.columns.city, width: 20},
        {header: translations.columns.destination, width: 14},
        {header: translations.columns.weight, width: 14},
    ];
    shipments.forEach((shipment, index) => items.addRow([
        index + 1,
        shipment?.trackingNumber?.value || String(pallet.shipmentIds[index]),
        shipment ? pl.shipments.status[shipment.shipmentStatus] : pl.common.dash,
        shipment ? [shipment.recipient?.firstName, shipment.recipient?.lastName].filter(Boolean).join(" ") : pl.common.dash,
        shipment?.recipient?.city || pl.common.dash,
        shipment?.destination ? departmentCodeValue(shipment.destination) || pl.common.dash : pl.common.dash,
        shipment?.weight ? `${shipment.weight.value} ${shipment.weight.unit}` : pl.common.dash,
    ]));
    items.getRow(1).font = {bold: true};

    download(await workbook.xlsx.writeBuffer() as ArrayBuffer, `paleta-${pallet.trackingNumber}.xlsx`);
};

export const exportPalletListExcel = async (pallets: PalletDto[], departmentLabel: (id?: number | string | null) => string) => {
    const translations = pl.pallets.excel;
    const {default: ExcelJS} = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ManagerV2";
    const sheet = workbook.addWorksheet(translations.listSheet);
    sheet.columns = [
        {header: translations.trackingNumber, width: 22},
        {header: translations.status, width: 20},
        {header: translations.shipments, width: 10},
        {header: translations.grossWeight, width: 14},
        {header: translations.maxWeight, width: 14},
        {header: translations.origin, width: 22},
        {header: translations.destination, width: 22},
        {header: translations.carrier, width: 26},
        {header: translations.vehicle, width: 20},
        {header: translations.seal, width: 14},
        {header: translations.modified, width: 20},
    ];
    pallets.forEach((pallet) => sheet.addRow([
        pallet.trackingNumber,
        palletStatusLabel(pallet.palletStatus),
        pallet.shipmentIds.length,
        formatPalletWeight(pallet.grossWeight, pallet.grossWeightUnit),
        formatPalletWeight(pallet.maxGrossWeight, pallet.maxGrossWeightUnit),
        departmentLabel(pallet.originDepartmentId),
        departmentLabel(pallet.destinationDepartmentId),
        pallet.carrier?.carrierName || pl.common.dash,
        pallet.carrier?.vehicleRegistrationNumber || pl.common.dash,
        pallet.sealNumber || pl.common.dash,
        formatPalletDate(pallet.modified),
    ]));
    sheet.getRow(1).font = {bold: true};
    download(await workbook.xlsx.writeBuffer() as ArrayBuffer, "palety.xlsx");
};
