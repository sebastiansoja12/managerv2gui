import fs from "fs";
import path from "path";

const stylesheet = fs.readFileSync(path.join(__dirname, "styles", "shipments.css"), "utf8");

const declarationsFor = (selector: string) => {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = stylesheet.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)}`, "s"));
    return match?.[1] ?? "";
};

describe("ShipmentRouteMap theme styles", () => {
    it("keeps the map point and its popup legible in every application theme", () => {
        expect(declarationsFor(".shipment-history-map-marker")).toContain("fill: var(--primary)");
        expect(declarationsFor(".shipment-history-map-marker")).toContain("stroke: var(--surface-elevated)");
        expect(declarationsFor(".shipment-history-map-marker-number.leaflet-tooltip")).toContain(
            "color: var(--primary-foreground)",
        );
        expect(declarationsFor(".shipment-history-leaflet-map .leaflet-popup-content-wrapper")).toContain(
            "background: var(--card)",
        );
        expect(declarationsFor(".shipment-history-leaflet-map .leaflet-popup-tip")).toContain(
            "background: var(--card)",
        );
    });
});
