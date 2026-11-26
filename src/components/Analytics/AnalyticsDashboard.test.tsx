import React from "react";
import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import AnalyticsService from "../../hooks/AnalyticsService";
import pl from "../../i18n/translate";
import AnalyticsDashboard from "./AnalyticsDashboard";
import {forecast, performance, report} from "./analyticsFixture";

jest.mock("../../hooks/DepartmentService", () => ({
    __esModule: true,
    default: {getAll: () => Promise.resolve({data: [{departmentCode: {value: "KAT"}, address: {city: "Katowice"}}]})},
}));

jest.mock("../../hooks/AnalyticsService", () => ({
    __esModule: true,
    default: {performance: jest.fn(), forecast: jest.fn(), costs: jest.fn(), recordCost: jest.fn(), deleteCost: jest.fn()},
}));

const analyticsService = AnalyticsService as jest.Mocked<typeof AnalyticsService>;

const selectCostDepartment = async (costs: ReturnType<typeof within>, departmentCode: string) => {
    const departmentSelect = costs.getByLabelText(pl.analytics.costs.fields.department);
    const selectRoot = departmentSelect.closest("[data-ui=select]") as HTMLElement;
    await waitFor(() => expect(selectRoot.querySelector(`option[value="${departmentCode}"]`)).not.toBeNull());
    fireEvent.mouseDown(departmentSelect, {button: 0});
    fireEvent.click(within(await screen.findByRole("listbox")).getByRole("option", {name: `${departmentCode} · Katowice`}));
    await waitFor(() => expect(departmentSelect).toHaveTextContent(`${departmentCode} · Katowice`));
};

const openTab = (name: string) => fireEvent.click(screen.getByRole("tab", {name}));

describe("AnalyticsDashboard", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        analyticsService.performance.mockResolvedValue({status: 200, data: report()} as never);
        analyticsService.forecast.mockResolvedValue({status: 200, data: forecast()} as never);
        analyticsService.costs.mockResolvedValue({status: 200, data: []} as never);
        analyticsService.recordCost.mockResolvedValue({status: 201, data: {value: "1"}} as never);
    });

    it("opens on the overview tab with totals and charts only", async () => {
        render(<AnalyticsDashboard />);

        const summary = within(await screen.findByRole("region", {name: pl.analytics.summary.title}));
        expect(summary.getByText(pl.analytics.summary.revenue).parentElement).toHaveTextContent("1000");
        expect(screen.getByRole("tab", {name: pl.analytics.tabs.overview})).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("img", {name: pl.analytics.charts.finance.ariaLabel.replace("{currency}", "PLN")})).toBeInTheDocument();
        expect(screen.getByRole("img", {name: pl.analytics.charts.costStructure.ariaLabel.replace("{currency}", "PLN")})).toBeInTheDocument();
        expect(screen.queryByRole("region", {name: pl.analytics.comparison.title})).not.toBeInTheDocument();
        expect(analyticsService.forecast).not.toHaveBeenCalled();
        expect(analyticsService.costs).not.toHaveBeenCalled();
    });

    it("shows the department comparison in its own tab", async () => {
        render(<AnalyticsDashboard />);
        await screen.findByRole("region", {name: pl.analytics.summary.title});

        openTab(pl.analytics.tabs.comparison);

        const comparison = within(screen.getByRole("region", {name: pl.analytics.comparison.title}));
        expect(comparison.getByText("KAT")).toBeInTheDocument();
        expect(comparison.getByText("Katowice")).toBeInTheDocument();
        expect(comparison.getByText(pl.analytics.comparison.organization)).toBeInTheDocument();
        expect(screen.getByRole("tab", {name: pl.analytics.tabs.comparison})).toHaveAttribute("aria-selected", "true");
        expect(screen.queryByRole("region", {name: pl.analytics.summary.title})).not.toBeInTheDocument();
    });

    it("loads the forecast when its tab is opened and keeps it when switching back", async () => {
        render(<AnalyticsDashboard />);
        await screen.findByRole("region", {name: pl.analytics.summary.title});

        openTab(pl.analytics.tabs.forecast);

        const forecastPanel = within(screen.getByRole("region", {name: pl.analytics.forecast.title}));
        expect(await forecastPanel.findAllByText("13", {selector: "strong"})).toHaveLength(2);
        expect(forecastPanel.getAllByTestId("analytics-forecast-observation")).toHaveLength(2);
        expect(forecastPanel.getByTestId("analytics-forecast-expected")).toBeInTheDocument();

        openTab(pl.analytics.tabs.overview);
        openTab(pl.analytics.tabs.forecast);

        expect(analyticsService.forecast).toHaveBeenCalledTimes(1);
    });

    it("lists departments without shipment history in one line instead of zero rows", async () => {
        analyticsService.forecast.mockResolvedValue({status: 200, data: forecast({
            departments: [
                ...forecast().departments,
                {departmentCode: "BIA", city: "Białystok", averageShipments: 0, expectedShipments: 0,
                    minimumObserved: 0, maximumObserved: 0, actualShipments: null,
                    observations: [{day: "2026-11-04", registeredShipments: 0}]},
            ],
        })} as never);

        render(<AnalyticsDashboard />);
        openTab(pl.analytics.tabs.forecast);

        const forecastPanel = within(screen.getByRole("region", {name: pl.analytics.forecast.title}));
        expect(await forecastPanel.findByText(pl.analytics.forecast.withoutHistory
            .replace("{count}", "1").replace("{departments}", "BIA"))).toBeInTheDocument();
        expect(forecastPanel.queryByText("Białystok")).not.toBeInTheDocument();
        expect(forecastPanel.getByText("Katowice")).toBeInTheDocument();
    });

    it("explains insufficient forecast history instead of showing a number", async () => {
        analyticsService.forecast.mockResolvedValue({status: 200, data: forecast({
            status: "INSUFFICIENT_HISTORY",
            observationDays: ["2026-11-11"],
            organization: {departmentCode: null, city: null, averageShipments: null, expectedShipments: null,
                minimumObserved: null, maximumObserved: null, actualShipments: null,
                observations: [{day: "2026-11-11", registeredShipments: 7}]},
            departments: [],
        })} as never);

        render(<AnalyticsDashboard />);
        openTab(pl.analytics.tabs.forecast);

        expect(await screen.findByText(pl.analytics.forecast.insufficient
            .replace("{observations}", "1").replace("{required}", "4"))).toBeInTheDocument();
        expect(screen.getAllByTestId("analytics-forecast-observation")).toHaveLength(1);
        expect(screen.queryByTestId("analytics-forecast-expected")).not.toBeInTheDocument();
    });

    it("shows the empty-period notice", async () => {
        analyticsService.performance.mockResolvedValue({status: 200, data: report({
            currency: null,
            availableCurrencies: [],
            organization: performance({departmentCode: null, registeredShipments: 0, canceledShipments: 0,
                deliveredShipments: 0, costEntries: 0, damagedShipments: 0, damageClaims: 0, revenue: 0}),
            departments: [],
        })} as never);

        render(<AnalyticsDashboard />);

        expect(await screen.findByText(pl.analytics.notices.noData)).toBeInTheDocument();
        expect(screen.getByText(pl.analytics.charts.finance.empty)).toBeInTheDocument();
        expect(screen.getByText(pl.analytics.charts.costStructure.empty)).toBeInTheDocument();
        openTab(pl.analytics.tabs.comparison);
        expect(screen.getByText(pl.analytics.comparison.empty)).toBeInTheDocument();
    });

    it("shows an error when analytics cannot be loaded", async () => {
        analyticsService.performance.mockRejectedValue({});

        render(<AnalyticsDashboard />);

        expect(await screen.findByText(pl.analytics.loadError)).toBeInTheDocument();
    });

    it("does not query performance for an inverted period", async () => {
        render(<AnalyticsDashboard />);
        await screen.findByRole("region", {name: pl.analytics.summary.title});
        analyticsService.performance.mockClear();

        fireEvent.change(screen.getByLabelText(pl.analytics.filters.dateFrom), {target: {value: "2030-01-01"}});

        expect(await screen.findByText(pl.analytics.invalidPeriod)).toBeInTheDocument();
        expect(analyticsService.performance).not.toHaveBeenCalled();
    });

    it("blocks submitting a cost without an amount", async () => {
        render(<AnalyticsDashboard />);
        await screen.findByRole("region", {name: pl.analytics.summary.title});
        openTab(pl.analytics.tabs.costs);
        const costs = within(await screen.findByRole("region", {name: pl.analytics.costs.title}));

        await selectCostDepartment(costs, "KAT");
        fireEvent.click(costs.getByRole("button", {name: pl.analytics.costs.add}));

        expect(await costs.findByText(pl.analytics.costs.validation.amount)).toBeInTheDocument();
        expect(analyticsService.recordCost).not.toHaveBeenCalled();
    });

    it("records a cost and reloads performance", async () => {
        render(<AnalyticsDashboard />);
        await screen.findByRole("region", {name: pl.analytics.summary.title});
        openTab(pl.analytics.tabs.costs);
        const costs = within(await screen.findByRole("region", {name: pl.analytics.costs.title}));

        await selectCostDepartment(costs, "KAT");
        fireEvent.change(costs.getByLabelText(pl.analytics.costs.fields.amount), {target: {value: "99,90"}});
        fireEvent.click(costs.getByRole("button", {name: pl.analytics.costs.add}));

        await waitFor(() => expect(analyticsService.recordCost).toHaveBeenCalledWith(expect.objectContaining({
            departmentCode: "KAT", category: "FUEL", amount: "99.90", currency: "PLN",
        })));
        expect(await costs.findByText(pl.analytics.costs.saved)).toBeInTheDocument();
        await waitFor(() => expect(analyticsService.performance).toHaveBeenCalledTimes(2));
    });
});
