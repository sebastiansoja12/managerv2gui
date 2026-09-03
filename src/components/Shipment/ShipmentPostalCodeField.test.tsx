import {fireEvent, render, screen} from "@testing-library/react";
import ShipmentPostalCodeField, {postalCodeRegionLabel, postalCodeSuggestionLabel} from "./ShipmentPostalCodeField";
import pl from "../../i18n/translate";

const postalCode = {
    countryCode: "PL", postalCode: "59-700", city: "Bolesławiec", regionCode: "72", latitude: 51.26, longitude: 15.56,
};

describe("postal code suggestions", () => {
    it("labels suggestion with postal code, city and region in parentheses", () => {
        expect(postalCodeSuggestionLabel(postalCode))
            .toBe(`59-700 Bolesławiec (${pl.shipments.postalCodeRegions["PL-72"]})`);
    });

    it("translates voivodeship code to region name", () => {
        expect(postalCodeRegionLabel(postalCode)).toBe(pl.shipments.postalCodeRegions["PL-72"]);
    });

    it("falls back to country code for unknown region", () => {
        expect(postalCodeRegionLabel({...postalCode, regionCode: null})).toBe("PL");
    });

    it("shows a dropdown of matching postal codes and fills the field on pick", async () => {
        const onSelect = jest.fn();
        const search = jest.fn().mockResolvedValue({data: [postalCode]});
        render(<ShipmentPostalCodeField id="pc" label="Kod" value="59" onChange={jest.fn()} onSelect={onSelect} search={search} />);

        fireEvent.focus(screen.getByRole("combobox"));
        fireEvent.click(await screen.findByRole("option", {name: postalCodeSuggestionLabel(postalCode)}));

        expect(search).toHaveBeenCalledWith("59");
        expect(onSelect).toHaveBeenCalledWith(postalCode);
    });
});
