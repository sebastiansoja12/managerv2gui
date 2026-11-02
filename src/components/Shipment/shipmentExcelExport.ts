import type {Workbook} from "exceljs";
import pl from "../../i18n/translate";
import {ShipmentDto} from "./dto/ShipmentDto";

const personName = (firstName?: string, lastName?: string) =>
    [firstName, lastName].filter(Boolean).join(" ") || pl.common.dash;

export const exportShipmentExcel = async (shipment: ShipmentDto) => {
    const {default: ExcelJS} = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ManagerV2";
    const sheet = workbook.addWorksheet(pl.shipments.page.detailsTitle);
    sheet.columns = [{width: 28}, {width: 52}];
    sheet.addRows([
        [pl.shipments.table.shipmentId, shipment.shipmentId.value],
        [pl.shipments.table.trackingNumber, shipment.trackingNumber?.value || pl.common.dash],
        [pl.shipments.summary.dimensions, shipment.dimensions
            ? `${shipment.dimensions.length} × ${shipment.dimensions.width} × ${shipment.dimensions.height} ${shipment.dimensions.unit}`
            : pl.common.dash],
        [pl.shipments.table.columns.sender, personName(shipment.sender?.firstName, shipment.sender?.lastName)],
        [pl.shipments.table.columns.recipient, personName(shipment.recipient?.firstName, shipment.recipient?.lastName)],
        [pl.shipments.table.columns.deliveryDate, (shipment.shipmentStatus === "DELIVERY" && shipment.updatedAt) || pl.common.dash],
        [pl.shipments.table.columns.price, shipment.price
            ? `${shipment.price.amount} ${shipment.price.currency}` : pl.common.dash],
        [pl.shipments.table.columns.user, shipment.operatorId?.value?.toString() || pl.shipments.table.unassigned],
        [pl.shipments.table.columns.status, pl.shipments.status[shipment.shipmentStatus]],
        [pl.shipments.table.columns.relatedShipment, shipment.shipmentRelatedId?.value || pl.common.dash],
    ]);
    sheet.getColumn(1).font = {bold: true};

    await downloadWorkbook(workbook, `shipment-${shipment.shipmentId.value}.xlsx`);
};

const shipmentDimensions = (shipment: ShipmentDto) => shipment.dimensions
    ? `${shipment.dimensions.length} × ${shipment.dimensions.width} × ${shipment.dimensions.height} ${shipment.dimensions.unit}`
    : pl.common.dash;

// One row per shipment, for exporting a bulk selection from the list.
export const exportShipmentsExcel = async (shipments: ShipmentDto[]) => {
    const {default: ExcelJS} = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ManagerV2";
    const sheet = workbook.addWorksheet(pl.shipments.table.title);
    sheet.columns = [
        {header: pl.shipments.table.shipmentId, width: 24},
        {header: pl.shipments.table.trackingNumber, width: 24},
        {header: pl.shipments.summary.dimensions, width: 18},
        {header: pl.shipments.table.columns.sender, width: 24},
        {header: pl.shipments.table.columns.recipient, width: 24},
        {header: pl.shipments.table.columns.price, width: 12},
        {header: pl.shipments.table.columns.status, width: 18},
        {header: pl.shipments.summary.createdAt, width: 20},
    ];
    sheet.addRows(shipments.map((shipment) => [
        shipment.shipmentId.value,
        shipment.trackingNumber?.value || pl.common.dash,
        shipmentDimensions(shipment),
        personName(shipment.sender?.firstName, shipment.sender?.lastName),
        personName(shipment.recipient?.firstName, shipment.recipient?.lastName),
        shipment.price ? `${shipment.price.amount} ${shipment.price.currency}` : pl.common.dash,
        pl.shipments.status[shipment.shipmentStatus],
        shipment.createdAt || pl.common.dash,
    ]));
    sheet.getRow(1).font = {bold: true};

    await downloadWorkbook(workbook, `shipments-${shipments.length}.xlsx`);
};

const downloadWorkbook = async (workbook: Workbook, filename: string) => {
    const data = await workbook.xlsx.writeBuffer();
    const blob = new Blob([data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
