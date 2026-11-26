import pl from "../../i18n/translate";
import {defaultAnalyticsPeriod, nextDay, performanceNotices, sortDepartments} from "./analyticsPresentation";
import {performance, report} from "./analyticsFixture";
import {validateCostForm} from "./DepartmentCostRegister";

describe("analyticsPresentation", () => {
    it("defaults the period to the current month up to today", () => {
        expect(defaultAnalyticsPeriod(new Date(2026, 10, 17))).toEqual({dateFrom: "2026-11-01", dateTo: "2026-11-17"});
        expect(nextDay(new Date(2026, 10, 30))).toBe("2026-12-01");
    });

    it("reports no data instead of other notices for an empty period", () => {
        const empty = performance({departmentCode: null, registeredShipments: 0, canceledShipments: 0,
            deliveredShipments: 0, costEntries: 0, damagedShipments: 0, damageClaims: 0, revenue: 0});

        expect(performanceNotices(report({organization: empty, currency: null, availableCurrencies: []})))
            .toEqual([{key: "noData", severity: "info", message: pl.analytics.notices.noData}]);
    });

    it("warns about excluded currencies, unpriced shipments, missing costs and unassigned data", () => {
        const notices = performanceNotices(report({
            availableCurrencies: ["EUR", "PLN"],
            organization: performance({departmentCode: null, unpricedShipments: 2}),
            unassigned: performance({departmentCode: null}),
            departments: [performance(), performance({departmentCode: "GLI", costEntries: 0, revenue: 300})],
        }));

        expect(notices.map((notice) => notice.key)).toEqual(["otherCurrencies", "unpriced", "missingCosts", "unassigned"]);
        expect(notices[0].message).toContain("EUR");
        expect(notices[2].message).toContain("GLI");
        expect(notices[2].message).not.toContain("KAT");
    });

    it("sorts departments by the selected metric", () => {
        const departments = [
            performance({departmentCode: "A", financialResult: 10, profitabilityPercent: null}),
            performance({departmentCode: "B", financialResult: -5, profitabilityPercent: 20}),
            performance({departmentCode: "C", financialResult: 30, profitabilityPercent: 5}),
        ];

        expect(sortDepartments(departments, "financialResult").map((department) => department.departmentCode))
            .toEqual(["C", "A", "B"]);
        expect(sortDepartments(departments, "profitabilityPercent").map((department) => department.departmentCode))
            .toEqual(["B", "C", "A"]);
    });

    it("validates the cost form before sending", () => {
        const form = {departmentCode: "KAT", category: "FUEL" as const, amount: "120,50", currency: "PLN",
            incurredOn: "2026-11-16", description: ""};

        expect(validateCostForm(form, "2026-11-17")).toBeNull();
        expect(validateCostForm({...form, departmentCode: ""}, "2026-11-17")).toBe(pl.analytics.costs.validation.department);
        expect(validateCostForm({...form, amount: "0"}, "2026-11-17")).toBe(pl.analytics.costs.validation.amount);
        expect(validateCostForm({...form, amount: "1.005"}, "2026-11-17")).toBe(pl.analytics.costs.validation.amount);
        expect(validateCostForm({...form, incurredOn: "2026-11-18"}, "2026-11-17")).toBe(pl.analytics.costs.validation.incurredOn);
    });
});
