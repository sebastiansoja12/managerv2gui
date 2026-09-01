import fs from "fs";
import path from "path";

const stylesheet = fs.readFileSync(path.join(__dirname, "styles", "department-relations-map.css"), "utf8");

const declarationsFor = (selector: string) => {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = stylesheet.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)}`, "s"));
    return match?.[1] ?? "";
};

describe("DepartmentRelationsMap layout styles", () => {
    it("keeps a large, viewport-bounded relation dialog", () => {
        const dialogStyles = declarationsFor(".departments-relations-dialog");

        expect(dialogStyles).toContain("max-width: 1600px");
        expect(dialogStyles).toContain("height: min(920px, calc(100dvh - 32px))");
        expect(dialogStyles).toContain("overflow: hidden");
    });

    it("scrolls the relation records instead of growing the dialog", () => {
        const editorStyles = declarationsFor(".department-relations-editor");
        const listStyles = declarationsFor(".department-relations-list");
        const recordStyles = declarationsFor(".department-relations-list-item");

        expect(editorStyles).toContain("overflow: hidden");
        expect(listStyles).toContain("overflow-y: auto");
        expect(listStyles).toContain("min-height: 0");
        expect(recordStyles).toContain("flex: 0 0 auto");
    });
});
