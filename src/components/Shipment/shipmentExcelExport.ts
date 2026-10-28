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

    const data = await workbook.xlsx.writeBuffer();
    const blob = new Blob([data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shipment-${shipment.shipmentId.value}.xlsx`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
