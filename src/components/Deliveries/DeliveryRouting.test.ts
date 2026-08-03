import {getTabTitle} from "../AppShell/tabConfig";
import {isPathAllowedForProfile} from "../../config/operationalProfile";
import pl from "../../i18n/translate";

describe("delivery edit route", () => {
    it("uses a delivery title and warehouse access", () => {
        const path = "/deliveries/6ce57331-8ef7-4a81-bf0f-14baa23231ad/edit";

        expect(getTabTitle(path)).toBe(`${pl.deliveries.detailsTitle} 6ce57331-8ef7-4a81-bf0f-14baa23231ad`);
        expect(isPathAllowedForProfile(path, "warehouse")).toBe(true);
        expect(isPathAllowedForProfile(path, "courier")).toBe(false);
    });
});
