import type {TDocumentDefinitions} from "pdfmake/interfaces";
import pl from "../../i18n/translate";
import {Delivery} from "./model/Delivery";
import {
    deliveryLifecycleLabel,
    deliveryMethodLabel,
    deliveryOutcomeLabel,
    deliveryStatusLabel,
    deliveryTargetLabel,
    deliveryTypeLabel,
    formatDeliveryDateTime,
} from "./deliveryLabels";

const detailRows = (delivery: Delivery): [string, string][] => [
    [pl.deliveries.columns.id, delivery.id],
    [pl.deliveries.columns.shipment, delivery.shipmentId || pl.common.dash],
    [pl.deliveries.columns.target, `${deliveryTargetLabel(delivery.targetType)} · ${delivery.targetId}`],
    [pl.deliveries.columns.type, deliveryTypeLabel(delivery.type)],
    [pl.deliveries.columns.status, deliveryStatusLabel(delivery.deliveryStatus)],
    [pl.deliveries.lifecycleLabel, deliveryLifecycleLabel(delivery.lifecycleStatus)],
    [pl.deliveries.methodLabel, deliveryMethodLabel(delivery.method)],
    [pl.deliveries.columns.created, formatDeliveryDateTime(delivery.createdAt)],
    [pl.deliveries.plannedLabel, formatDeliveryDateTime(delivery.plannedAt)],
    [pl.deliveries.deliveredLabel, formatDeliveryDateTime(delivery.deliveredAt)],
];

const attemptRows = (delivery: Delivery): string[][] =>
    [...delivery.steps].sort((left, right) => left.stepNumber - right.stepNumber).map((step) => [
        String(step.stepNumber),
        step.userId || pl.common.dash,
        step.departmentId || pl.common.dash,
        step.supplierId || pl.common.dash,
        formatDeliveryDateTime(step.attemptedAt),
        deliveryStatusLabel(step.deliveryStatus),
        deliveryOutcomeLabel(step.outcome),
        deliveryMethodLabel(step.method),
        step.vehicleId || pl.common.dash,
        step.comment || pl.common.dash,
        step.failureReason || pl.common.dash,
    ]);

const attemptHeaders = () => [
    pl.deliveries.columns.steps,
    pl.deliveries.userLabel,
    pl.deliveries.departmentLabel,
    pl.deliveries.courierLabel,
    pl.deliveries.attemptDateLabel,
    pl.deliveries.columns.status,
    pl.deliveries.outcomeLabel,
    pl.deliveries.methodLabel,
    pl.deliveries.vehicleLabel,
    pl.deliveries.commentLabel,
    pl.deliveries.failureReasonLabel,
];

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const exportDeliveryExcel = async (delivery: Delivery) => {
    const {default: ExcelJS} = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ManagerV2";
    const details = workbook.addWorksheet(pl.deliveries.detailsTitle);
    details.columns = [{width: 24}, {width: 48}];
    details.addRows(detailRows(delivery));
    details.getColumn(1).font = {bold: true};

    const history = workbook.addWorksheet(pl.deliveries.historyTitle);
    history.addRow(attemptHeaders());
    history.addRows(attemptRows(delivery));
    history.getRow(1).font = {bold: true};
    history.columns.forEach((column, index) => { column.width = index === 9 || index === 10 ? 32 : 20; });
    history.autoFilter = {from: {row: 1, column: 1}, to: {row: 1, column: 11}};

    const data = await workbook.xlsx.writeBuffer();
    downloadBlob(new Blob([data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),
        `delivery-${delivery.id}.xlsx`);
};

export const exportDeliveryPdf = async (delivery: Delivery) => {
    const [pdfMake, {default: pdfFonts}] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
    ]);
    pdfMake.addVirtualFileSystem(pdfFonts);
    const historyRows = attemptRows(delivery);
    const documentDefinition: TDocumentDefinitions = {
        pageSize: "A4",
        pageMargins: [36, 42, 36, 42],
        defaultStyle: {font: "Roboto", fontSize: 9},
        content: [
            {text: pl.deliveries.detailsTitle, style: "title"},
            {text: delivery.id, style: "subtitle"},
            {table: {widths: [130, "*"], body: detailRows(delivery)}, layout: "lightHorizontalLines"},
            {text: pl.deliveries.historyTitle, style: "section"},
            ...(historyRows.length ? historyRows.map((row) => ({
                stack: [
                    {text: `${pl.deliveries.columns.steps} ${row[0]} · ${row[5]} · ${row[6]}`, bold: true},
                    {text: `${pl.deliveries.userLabel}: ${row[1]}    ${pl.deliveries.departmentLabel}: ${row[2]}`},
                    {text: `${pl.deliveries.courierLabel}: ${row[3]}    ${pl.deliveries.attemptDateLabel}: ${row[4]}`},
                    {text: `${pl.deliveries.methodLabel}: ${row[7]}    ${pl.deliveries.vehicleLabel}: ${row[8]}`},
                    ...(row[9] !== pl.common.dash ? [{text: `${pl.deliveries.commentLabel}: ${row[9]}`}] : []),
                    ...(row[10] !== pl.common.dash ? [{text: `${pl.deliveries.failureReasonLabel}: ${row[10]}`}] : []),
                ],
                margin: [0, 8, 0, 8] as [number, number, number, number],
            })) : [{text: pl.deliveries.noSteps}]),
        ],
        styles: {
            title: {fontSize: 18, bold: true, color: "#252525"},
            subtitle: {fontSize: 9, color: "#777777", margin: [0, 2, 0, 18]},
            section: {fontSize: 13, bold: true, margin: [0, 20, 0, 6]},
        },
    };
    return pdfMake.createPdf(documentDefinition).download(`delivery-${delivery.id}.pdf`);
};
