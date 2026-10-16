import ExcelJS from "exceljs";
import {ShipmentDto} from "./dto/ShipmentDto";
import {exportShipmentExcel} from "./shipmentExcelExport";

describe("shipment Excel export", () => {
    it("downloads a valid XLSX with the selected shipment and its related ID", async () => {
        let exportedBlob: Blob | undefined;
        const createObjectURL = jest.fn((blob: Blob) => {
            exportedBlob = blob;
            return "blob:shipment-export";
        });
        URL.createObjectURL = createObjectURL;
        URL.revokeObjectURL = jest.fn();
        const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
            expect(this.download).toBe("shipment-101.xlsx");
        });

        const shipment = {
            shipmentId: {value: "101"},
            shipmentRelatedId: {value: "202"},
            sender: {firstName: "Anna", lastName: "Nowak"},
            recipient: {firstName: "Jan", lastName: "Kowalski"},
            destination: {value: "KT1"},
            shipmentStatus: "CREATED",
            price: {amount: 60, currency: "PLN"},
            trackingNumber: {value: "TRACK-101"},
        } as ShipmentDto;

        try {
            await exportShipmentExcel(shipment);
            expect(click).toHaveBeenCalledTimes(1);
            expect(exportedBlob?.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

            const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as ArrayBuffer);
                reader.onerror = () => reject(reader.error);
                reader.readAsArrayBuffer(exportedBlob!);
            });
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            const values = workbook.worksheets[0].getColumn(2).values;
            expect(values).toContain("101");
            expect(values).toContain("202");
            expect(values).toContain("Anna Nowak");
        } finally {
            click.mockRestore();
        }
    });
});
