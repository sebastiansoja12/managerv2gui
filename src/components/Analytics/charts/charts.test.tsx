import React from "react";
import {render, screen, within} from "@testing-library/react";
import pl from "../../../i18n/translate";
import {performance} from "../analyticsFixture";
import {linearScale, project} from "./chartScale";
import CostStructureChart from "./CostStructureChart";
import DepartmentFinanceChart from "./DepartmentFinanceChart";

describe("chartScale", () => {
    it("includes zero and rounds to readable ticks", () => {
        expect(linearScale([120, 870])).toEqual({minimum: 0, maximum: 1000, ticks: [0, 250, 500, 750, 1000]});
    });

    it("extends below zero for negative values", () => {
        const scale = linearScale([-150, 400]);

        expect(scale.minimum).toBeLessThan(0);
        expect(scale.ticks).toContain(0);
        expect(project(0, scale, 0, 100)).toBeGreaterThan(0);
        expect(project(0, scale, 0, 100)).toBeLessThan(100);
    });

    it("falls back to a unit scale without data", () => {
        expect(linearScale([0, 0])).toEqual({minimum: 0, maximum: 1, ticks: [0, 1]});
    });
});

describe("analytics charts", () => {
    it("draws revenue, costs and result for each department and marks a negative result", () => {
        const {container} = render(<DepartmentFinanceChart currency="PLN" departments={[
            performance(),
            performance({departmentCode: "GLI", revenue: 100, costs: {fuel: 250, shipmentDamage: 0, claims: 0, total: 250}, financialResult: -150}),
        ]} />);

        expect(screen.getAllByTestId("analytics-finance-group")).toHaveLength(2);
        expect(container.querySelectorAll("rect.analytics-chart-bar")).toHaveLength(6);
        expect(container.querySelectorAll("rect.is-negative")).toHaveLength(1);
        expect(within(screen.getAllByTestId("analytics-finance-group")[1]).getByText("GLI")).toBeInTheDocument();
    });

    it("stacks only cost categories that have amounts", () => {
        const {container} = render(<CostStructureChart currency="PLN" departments={[
            performance(),
            performance({departmentCode: "GLI", costs: {fuel: 90, shipmentDamage: 0, claims: 0, total: 90}}),
        ]} />);

        expect(screen.getByRole("img", {name: pl.analytics.charts.costStructure.ariaLabel.replace("{currency}", "PLN")})).toBeInTheDocument();
        expect(screen.getAllByTestId("analytics-cost-row")).toHaveLength(2);
        expect(container.querySelectorAll("rect.analytics-chart-bar")).toHaveLength(4);
    });
});
