import type {TDocumentDefinitions} from "pdfmake/interfaces";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import {Delivery} from "./model/Delivery";
import {
    deliveryLifecycleLabel,
    deliveryMethodLabel,
    deliveryOutcomeLabel,
    deliveryStatusLabel,
    deliveryStepCommentText,
    deliveryTargetLabel,
    deliveryTypeLabel,
    departmentCodeLabel,
    formatDeliveryDateTime,
    pickupMethodLabel,
} from "./deliveryLabels";

const detailRows = (delivery: Delivery, departments: Department[]): [string, string][] => [
    [pl.deliveries.columns.id, delivery.id],
    [pl.deliveries.columns.shipment, delivery.shipmentId || pl.common.dash],
    [pl.deliveries.columns.target, `${deliveryTargetLabel(delivery.targetType)} · ${delivery.targetId}`],
    [pl.deliveries.columns.type, deliveryTypeLabel(delivery.type)],
    [pl.deliveries.columns.status, deliveryStatusLabel(delivery.deliveryStatus)],
    [pl.deliveries.lifecycleLabel, deliveryLifecycleLabel(delivery.lifecycleStatus)],
    [pl.shipments.summary.originDepartment, departmentCodeLabel(departments, delivery.originDepartmentId)],
    [pl.shipments.summary.destination, departmentCodeLabel(departments, delivery.destinationDepartmentId)],
    [pl.shipments.form.fields.pickupMethod, pickupMethodLabel(delivery.pickupMethod)],
    [pl.deliveries.methodLabel, deliveryMethodLabel(delivery.method)],
    [pl.shipments.summary.pickupPoint, delivery.pickupPointId || pl.common.dash],
    [pl.shipments.summary.deliveryPickupPoint, delivery.deliveryPickupPointId || pl.common.dash],
    [pl.deliveries.columns.created, formatDeliveryDateTime(delivery.createdAt)],
    [pl.deliveries.plannedLabel, formatDeliveryDateTime(delivery.plannedAt)],
    [pl.deliveries.deliveredLabel, formatDeliveryDateTime(delivery.deliveredAt)],
];

const attemptRows = (delivery: Delivery, departments: Department[]): string[][] =>
    [...delivery.steps].sort((left, right) => left.stepNumber - right.stepNumber).map((step) => [
        String(step.stepNumber),
        step.userId || pl.common.dash,
        departmentCodeLabel(departments, step.departmentId),
        step.supplierId || pl.common.dash,
        formatDeliveryDateTime(step.attemptedAt),
        deliveryStatusLabel(step.deliveryStatus),
        deliveryOutcomeLabel(step.outcome),
        step.vehicleId || pl.common.dash,
        deliveryStepCommentText(step) || pl.common.dash,
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

export const exportDeliveryExcel = async (delivery: Delivery, departments: Department[] = []) => {
    const {default: ExcelJS} = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ManagerV2";
    const details = workbook.addWorksheet(pl.deliveries.detailsTitle);
    details.columns = [{width: 24}, {width: 48}];
    details.addRows(detailRows(delivery, departments));
    details.getColumn(1).font = {bold: true};

    const history = workbook.addWorksheet(pl.deliveries.historyTitle);
    history.addRow(attemptHeaders());
    history.addRows(attemptRows(delivery, departments));
    history.getRow(1).font = {bold: true};
    history.columns.forEach((column, index) => { column.width = index === 8 || index === 9 ? 32 : 20; });
    history.autoFilter = {from: {row: 1, column: 1}, to: {row: 1, column: 10}};

    const data = await workbook.xlsx.writeBuffer();
    downloadBlob(new Blob([data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),
        `delivery-${delivery.id}.xlsx`);
};

export const exportDeliveryPdf = async (delivery: Delivery, departments: Department[] = []) => {
    const [pdfMake, {default: pdfFonts}] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
    ]);
    pdfMake.addVirtualFileSystem(pdfFonts);
    const historyRows = attemptRows(delivery, departments);
    const documentDefinition: TDocumentDefinitions = {
        pageSize: "A4",
        pageMargins: [36, 42, 36, 42],
        defaultStyle: {font: "Roboto", fontSize: 9},
        content: [
            {text: pl.deliveries.detailsTitle, style: "title"},
            {text: delivery.id, style: "subtitle"},
            {table: {widths: [130, "*"], body: detailRows(delivery, departments)}, layout: "lightHorizontalLines"},
            {text: pl.deliveries.historyTitle, style: "section"},
            ...(historyRows.length ? historyRows.map((row) => ({
                stack: [
                    {text: `${pl.deliveries.columns.steps} ${row[0]} · ${row[5]} · ${row[6]}`, bold: true},
                    {text: `${pl.deliveries.userLabel}: ${row[1]}    ${pl.deliveries.departmentLabel}: ${row[2]}`},
                    {text: `${pl.deliveries.courierLabel}: ${row[3]}    ${pl.deliveries.attemptDateLabel}: ${row[4]}`},
                    {text: `${pl.deliveries.vehicleLabel}: ${row[7]}`},
                    ...(row[8] !== pl.common.dash ? [{text: `${pl.deliveries.commentLabel}: ${row[8]}`}] : []),
                    ...(row[9] !== pl.common.dash ? [{text: `${pl.deliveries.failureReasonLabel}: ${row[9]}`}] : []),
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
