import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import DepartmentMapService from "../../hooks/DepartmentMapService";
import pl from "../../i18n/translate";
import DepartmentMapWorkspace from "./DepartmentMapWorkspace";
import {DepartmentMapDto} from "./model/DepartmentMap";

jest.mock("../../hooks/DepartmentMapService", () => ({
    __esModule: true,
    default: {
        findMaps: jest.fn(),
        getMap: jest.fn(),
        createMap: jest.fn(),
        saveLayout: jest.fn(),
        deleteMap: jest.fn(),
        placePallet: jest.fn(),
        movePallet: jest.fn(),
        removePallet: jest.fn(),
        reserveLocation: jest.fn(),
        cancelReservation: jest.fn(),
        findPalletLocation: jest.fn(),
        searchPallets: jest.fn(),
        palletHistory: jest.fn(),
    },
}));

const service = DepartmentMapService as jest.Mocked<typeof DepartmentMapService>;

const departmentMap = (overrides: Partial<DepartmentMapDto> = {}): DepartmentMapDto => ({
    mapId: "map-1",
    departmentId: "100",
    name: "Hala A",
    width: 40,
    height: 20,
    gridSize: 1,
    version: 3,
    createdAt: "2026-10-18T10:00:00Z",
    updatedAt: "2026-10-18T10:00:00Z",
    elements: [
        {elementId: "rack-1", type: "RACK", label: "R1", x: 5, y: 5, width: 6, height: 1, rotation: 0, color: "#B9C7D8"},
        {elementId: "loc-1", type: "STORAGE_LOCATION", x: 5, y: 8, width: 1.2, height: 1, rotation: 0, locationCode: "A-01", capacity: 1},
        {elementId: "loc-2", type: "STORAGE_LOCATION", x: 8, y: 8, width: 1.2, height: 1, rotation: 0, locationCode: "A-02", capacity: 1},
    ],
    locations: [
        {locationId: "loc-1", mapId: "map-1", code: "A-01", capacity: 1, status: "FREE", pallets: [], reservation: null, version: 0},
        {
            locationId: "loc-2", mapId: "map-1", code: "A-02", capacity: 1, status: "OCCUPIED", version: 1, reservation: null,
            pallets: [{palletTrackingNumber: "PAL000000000002", placedAt: "2026-10-18T10:00:00Z"}],
        },
    ],
    ...overrides,
});

const summary = {mapId: "map-1", departmentId: "100", name: "Hala A", width: 40, height: 20, version: 3,
    updatedAt: "2026-10-18T10:00:00Z", locationCount: 2, occupiedLocationCount: 1, palletCount: 1};

const problem = (code: string, detail = "rejected") => ({status: 409, message: detail, details: {detail, properties: {code}}});

const renderWorkspace = () => render(<DepartmentMapWorkspace departmentCode="KT1" departmentId="100" />);

describe("DepartmentMapWorkspace", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        service.findMaps.mockResolvedValue({status: 200, data: [summary]});
        service.getMap.mockResolvedValue({status: 200, data: departmentMap()});
    });

    it("shows an empty state and creates the first map with an automatic layout", async () => {
        service.findMaps.mockResolvedValueOnce({status: 200, data: []}).mockResolvedValue({status: 200, data: [summary]});
        service.createMap.mockResolvedValue({status: 201, data: departmentMap({elements: [], locations: [], version: 0})});
        service.saveLayout.mockResolvedValue({status: 200, data: departmentMap()});
        renderWorkspace();

        expect(await screen.findByText(pl.departmentMap.page.emptyTitle)).toBeInTheDocument();
        fireEvent.click(screen.getAllByRole("button", {name: pl.departmentMap.create.open})[0]);
        const dialog = await screen.findByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText(new RegExp(pl.departmentMap.create.fields.width.replace(/[()]/g, "."))),
            {target: {value: "35"}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.departmentMap.create.submit}));

        await waitFor(() => expect(service.createMap).toHaveBeenCalledWith({
            departmentId: "100", name: "Plan KT1", width: 35, height: 40, gridSize: 1,
        }));
        await waitFor(() => expect(service.saveLayout).toHaveBeenCalledTimes(1));
        const [mapId, request] = service.saveLayout.mock.calls[0];
        expect(mapId).toBe("map-1");
        expect(request.version).toBe(0);
        expect(request.width).toBe(35);
        expect(request.elements.some((element) => element.type === "SORTER")).toBe(true);
        expect(request.elements.some((element) => element.type === "STORAGE_LOCATION")).toBe(true);
        expect(await screen.findByLabelText(pl.departmentMap.canvas.ariaLabel)).toBeInTheDocument();
    });

    it("creates an empty map when automatic layout is switched off", async () => {
        service.findMaps.mockResolvedValueOnce({status: 200, data: []}).mockResolvedValue({status: 200, data: [summary]});
        service.createMap.mockResolvedValue({status: 201, data: departmentMap({elements: [], locations: [], version: 0})});
        renderWorkspace();

        await screen.findByText(pl.departmentMap.page.emptyTitle);
        fireEvent.click(screen.getAllByRole("button", {name: pl.departmentMap.create.open})[0]);
        const dialog = await screen.findByRole("dialog");
        fireEvent.click(within(dialog).getByLabelText(pl.departmentMap.generator.autoLayout));
        fireEvent.click(within(dialog).getByRole("button", {name: pl.departmentMap.create.submit}));

        await waitFor(() => expect(service.createMap).toHaveBeenCalledTimes(1));
        expect(service.saveLayout).not.toHaveBeenCalled();
    });

    it("generates a new layout in the editor from given dimensions", async () => {
        service.getMap.mockResolvedValue({status: 200, data: departmentMap({locations: []})});
        service.saveLayout.mockResolvedValue({status: 200, data: departmentMap({version: 4})});
        renderWorkspace();

        await screen.findByLabelText(pl.departmentMap.canvas.ariaLabel);
        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.departmentMap.toolbar.edit)}));
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.generator.open}));
        const dialog = await screen.findByRole("dialog");
        fireEvent.change(within(dialog).getByLabelText(new RegExp(pl.departmentMap.create.fields.width.replace(/[()]/g, "."))),
            {target: {value: "80"}});
        fireEvent.change(within(dialog).getByLabelText(new RegExp(pl.departmentMap.create.fields.height.replace(/[()]/g, "."))),
            {target: {value: "50"}});
        fireEvent.click(within(dialog).getByRole("button", {name: pl.departmentMap.generator.generate}));

        expect(await screen.findAllByRole("button", {name: new RegExp(pl.departmentMap.elementTypes.SORTER.replace(/[()]/g, "."))}))
            .not.toHaveLength(0);
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.toolbar.save}));

        await waitFor(() => expect(service.saveLayout).toHaveBeenCalledTimes(1));
        const request = service.saveLayout.mock.calls[0][1];
        expect(request.width).toBe(80);
        expect(request.height).toBe(50);
        expect(request.elements.filter((element) => element.type === "RACK").length).toBeGreaterThan(4);
    });

    it("refuses to regenerate a layout while pallets stand on the map", async () => {
        renderWorkspace();

        await screen.findByRole("button", {name: "Miejsce A-01 – Wolne"});
        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.departmentMap.toolbar.edit)}));
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.generator.open}));
        fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", {name: pl.departmentMap.generator.generate}));

        expect(await screen.findByText(pl.departmentMap.generator.occupiedBlocked)).toBeInTheDocument();
    });

    it("places a pallet on a free location selected on the map", async () => {
        service.placePallet.mockResolvedValue({status: 201, data: {} as never});
        renderWorkspace();

        fireEvent.click(await screen.findByRole("button", {name: "Miejsce A-01 – Wolne"}));
        fireEvent.change(screen.getByLabelText(pl.departmentMap.operations.palletNumber), {target: {value: " pal000000000001 "}});
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.operations.place}));

        await waitFor(() => expect(service.placePallet).toHaveBeenCalledWith("loc-1", "PAL000000000001"));
        expect(await screen.findByText(pl.departmentMap.operations.placed
            .replace("{pallet}", "PAL000000000001").replace("{code}", "A-01"))).toBeInTheDocument();
        expect(service.getMap).toHaveBeenCalledTimes(2);
    });

    it("explains that a location was taken by someone else at the same time", async () => {
        service.placePallet.mockRejectedValue(problem("LOCATION_CONCURRENT_MODIFICATION"));
        renderWorkspace();

        fireEvent.click(await screen.findByRole("button", {name: "Miejsce A-01 – Wolne"}));
        fireEvent.change(screen.getByLabelText(pl.departmentMap.operations.palletNumber), {target: {value: "PAL1"}});
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.operations.place}));

        expect(await screen.findByText(pl.departmentMap.errors.LOCATION_CONCURRENT_MODIFICATION)).toBeInTheDocument();
    });

    it("reloads the map when another user occupied the location first", async () => {
        service.placePallet.mockRejectedValue(problem("LOCATION_OCCUPIED"));
        service.getMap.mockResolvedValueOnce({status: 200, data: departmentMap()}).mockResolvedValue({status: 200,
            data: departmentMap({version: 3, locations: [
                {locationId: "loc-1", mapId: "map-1", code: "A-01", capacity: 1, status: "OCCUPIED", version: 1,
                    reservation: null, pallets: [{palletTrackingNumber: "PAL9", placedAt: "2026-10-18T10:05:00Z"}]},
                departmentMap().locations[1],
            ]})});
        renderWorkspace();

        fireEvent.click(await screen.findByRole("button", {name: "Miejsce A-01 – Wolne"}));
        fireEvent.change(screen.getByLabelText(pl.departmentMap.operations.palletNumber), {target: {value: "PAL1"}});
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.operations.place}));

        expect(await screen.findByText(pl.departmentMap.errors.LOCATION_OCCUPIED)).toBeInTheDocument();
        await waitFor(() => expect(service.getMap).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole("button", {name: "Miejsce A-01 – Zajęte"})).toBeInTheDocument();
        expect(screen.getByText(pl.departmentMap.errors.LOCATION_OCCUPIED)).toBeInTheDocument();
    });

    it("disables placing a pallet on an occupied single-pallet location", async () => {
        renderWorkspace();

        fireEvent.click(await screen.findByRole("button", {name: "Miejsce A-02 – Zajęte"}));

        expect(screen.getByText(pl.departmentMap.operations.locationFull)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: pl.departmentMap.operations.place})).toBeDisabled();
        expect(screen.getByText("PAL000000000002")).toBeInTheDocument();
    });

    it("moves a pallet to the location chosen from the list", async () => {
        service.movePallet.mockResolvedValue({status: 200, data: {} as never});
        renderWorkspace();

        fireEvent.click(await screen.findByRole("button", {name: "Miejsce A-02 – Zajęte"}));
        fireEvent.change(screen.getByLabelText(pl.departmentMap.operations.moveTarget), {target: {value: "loc-1"}});
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.operations.move}));

        await waitFor(() => expect(service.movePallet).toHaveBeenCalledWith("PAL000000000002", "loc-1"));
    });

    it("finds a pallet and selects its location", async () => {
        service.searchPallets.mockResolvedValue({status: 200, data: [{
            palletTrackingNumber: "PAL000000000002", mapId: "map-1", mapName: "Hala A", departmentId: "100",
            locationId: "loc-2", locationCode: "A-02", placedAt: "2026-10-18T10:00:00Z",
        }]});
        renderWorkspace();

        await screen.findByRole("button", {name: "Miejsce A-02 – Zajęte"});
        fireEvent.change(screen.getByLabelText(pl.departmentMap.search.label), {target: {value: "pal000000000002"}});
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.search.submit}));

        expect(await screen.findByRole("heading", {name: "A-02"})).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Miejsce A-02 – Zajęte"})).toHaveAttribute("aria-pressed", "true");
    });

    it("edits an element in layout mode and saves the map with its version", async () => {
        service.saveLayout.mockResolvedValue({status: 200, data: departmentMap({version: 4})});
        renderWorkspace();

        await screen.findByRole("button", {name: "Miejsce A-01 – Wolne"});
        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.departmentMap.toolbar.edit)}));
        fireEvent.click(screen.getByRole("button", {name: `${pl.departmentMap.elementTypes.RACK} R1`}));
        fireEvent.change(screen.getByLabelText(pl.departmentMap.editor.fields.label), {target: {value: "Regał główny"}});
        expect(screen.getByText(pl.departmentMap.editor.unsaved)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.toolbar.save}));

        await waitFor(() => expect(service.saveLayout).toHaveBeenCalledTimes(1));
        const [mapId, request] = service.saveLayout.mock.calls[0];
        expect(mapId).toBe("map-1");
        expect(request.version).toBe(3);
        expect(request.elements.find((element) => element.elementId === "rack-1")?.label).toBe("Regał główny");
        expect(await screen.findByText(pl.departmentMap.editor.saved)).toBeInTheDocument();
    });

    it("lets the user clear and retype map dimensions before saving", async () => {
        service.saveLayout.mockResolvedValue({status: 200, data: departmentMap({version: 4, width: 60})});
        renderWorkspace();

        await screen.findByRole("button", {name: "Miejsce A-01 – Wolne"});
        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.departmentMap.toolbar.edit)}));
        const widthField = screen.getByLabelText(pl.departmentMap.create.fields.width);
        fireEvent.change(widthField, {target: {value: ""}});
        expect(widthField).toHaveValue(null);
        fireEvent.change(widthField, {target: {value: "60"}});
        expect(widthField).toHaveValue(60);
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.toolbar.save}));

        await waitFor(() => expect(service.saveLayout).toHaveBeenCalledTimes(1));
        expect(service.saveLayout.mock.calls[0][1].width).toBe(60);
    });

    it("blocks saving duplicated location codes", async () => {
        renderWorkspace();

        await screen.findByRole("button", {name: "Miejsce A-01 – Wolne"});
        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.departmentMap.toolbar.edit)}));
        fireEvent.click(screen.getByRole("button", {name: "Miejsce A-02 – Zajęte"}));
        fireEvent.change(screen.getByLabelText(new RegExp(`^${pl.departmentMap.editor.fields.locationCode}`)),
            {target: {value: "a-01"}});
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.toolbar.save}));

        expect(await screen.findByText(pl.departmentMap.validation.duplicateCode.replace("{value}", "A-01"))).toBeInTheDocument();
        expect(service.saveLayout).not.toHaveBeenCalled();
    });

    it("offers reloading when another user saved the map first", async () => {
        service.saveLayout.mockRejectedValue(problem("MAP_VERSION_CONFLICT"));
        renderWorkspace();

        await screen.findByRole("button", {name: "Miejsce A-01 – Wolne"});
        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.departmentMap.toolbar.edit)}));
        fireEvent.click(screen.getByRole("button", {name: `${pl.departmentMap.elementTypes.RACK} R1`}));
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.editor.rotate90}));
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.toolbar.save}));

        expect(await screen.findByText(pl.departmentMap.errors.MAP_VERSION_CONFLICT)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.editor.reload}));
        await waitFor(() => expect(service.getMap).toHaveBeenCalledTimes(2));
    });

    it("does not leave layout mode with unsaved changes", async () => {
        renderWorkspace();

        await screen.findByRole("button", {name: "Miejsce A-01 – Wolne"});
        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.departmentMap.toolbar.edit)}));
        fireEvent.click(screen.getByRole("button", {name: `${pl.departmentMap.elementTypes.RACK} R1`}));
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.editor.rotate90}));
        fireEvent.click(screen.getByRole("button", {name: new RegExp(pl.departmentMap.toolbar.operate)}));

        expect(screen.getByText(pl.departmentMap.editor.unsavedBeforeSwitch)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", {name: pl.departmentMap.toolbar.undo}));
        expect(screen.queryByText(pl.departmentMap.editor.unsaved)).not.toBeInTheDocument();
    });
});
