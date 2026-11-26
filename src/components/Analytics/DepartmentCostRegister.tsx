import React, {useCallback, useEffect, useState} from "react";
import {Alert, Button, IconButton, MenuItem, TextField, Typography} from "components/ui";
import {Add, DeleteOutline} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import AnalyticsService from "../../hooks/AnalyticsService";
import pl from "../../i18n/translate";
import {formatDate, formatMoney, toIsoDate} from "./analyticsPresentation";
import {
    ANALYTICS_CURRENCIES,
    AnalyticsDepartmentOption,
    AnalyticsFilters,
    DEPARTMENT_COST_CATEGORIES,
    DepartmentCostCategory,
    DepartmentCostDto,
} from "./model/Analytics";

type DepartmentCostRegisterProps = {
    filters: AnalyticsFilters;
    departments: AnalyticsDepartmentOption[];
    defaultCurrency: string | null;
    onChanged: () => void;
};

type CostForm = {
    departmentCode: string;
    category: DepartmentCostCategory;
    amount: string;
    currency: string;
    incurredOn: string;
    description: string;
};

const AMOUNT_PATTERN = /^\d+([.,]\d{1,2})?$/;

export const validateCostForm = (form: CostForm, today: string) => {
    const validation = pl.analytics.costs.validation;
    if (!form.departmentCode) {
        return validation.department;
    }
    if (!AMOUNT_PATTERN.test(form.amount.trim()) || Number(form.amount.replace(",", ".")) <= 0) {
        return validation.amount;
    }
    if (!form.incurredOn || form.incurredOn > today) {
        return validation.incurredOn;
    }
    return null;
};

function DepartmentCostRegister({filters, departments, defaultCurrency, onChanged}: DepartmentCostRegisterProps) {
    const translations = pl.analytics.costs;
    const today = toIsoDate(new Date());
    const [costs, setCosts] = useState<DepartmentCostDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<CostForm>({
        departmentCode: filters.departmentCode,
        category: "FUEL",
        amount: "",
        currency: defaultCurrency || "PLN",
        incurredOn: today,
        description: "",
    });

    useEffect(() => {
        setForm((current) => ({
            ...current,
            departmentCode: filters.departmentCode || current.departmentCode,
            currency: defaultCurrency || current.currency,
        }));
    }, [defaultCurrency, filters.departmentCode]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await AnalyticsService.costs(filters);
            setCosts(response.data);
        } catch (loadError) {
            setCosts([]);
            setError(getBackendErrorMessage(loadError, translations.loadError));
        } finally {
            setLoading(false);
        }
    }, [filters, translations.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    const changeForm = <K extends keyof CostForm>(key: K, value: CostForm[K]) => {
        setSuccess(null);
        setForm((current) => ({...current, [key]: value}));
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSuccess(null);
        const validationError = validateCostForm(form, today);
        if (validationError) {
            setError(validationError);
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await AnalyticsService.recordCost({
                departmentCode: form.departmentCode,
                category: form.category,
                amount: form.amount.trim().replace(",", "."),
                currency: form.currency,
                incurredOn: form.incurredOn,
                description: form.description.trim() || null,
            });
            setForm((current) => ({...current, amount: "", description: ""}));
            setSuccess(translations.saved);
            await load();
            onChanged();
        } catch (saveError) {
            setError(getBackendErrorMessage(saveError, translations.saveError));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (cost: DepartmentCostDto) => {
        if (!window.confirm(translations.deleteConfirm)) {
            return;
        }
        setError(null);
        setSuccess(null);
        try {
            await AnalyticsService.deleteCost(cost.costId.value);
            await load();
            onChanged();
        } catch (deleteError) {
            setError(getBackendErrorMessage(deleteError, translations.deleteError));
        }
    };

    const fields = translations.fields;

    return (
        <section className="analytics-costs-layout" aria-labelledby="analytics-costs-title">
            <div className="pallet-panel">
                <div>
                    <Typography variant="h5">{translations.add}</Typography>
                    <p className="analytics-panel-subtitle">{translations.formHint}</p>
                </div>
                <form className="analytics-cost-form" onSubmit={submit} noValidate>
                    <TextField select size="small" label={fields.department} value={form.departmentCode}
                               onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeForm("departmentCode", event.target.value)}>
                        <MenuItem value="">{pl.common.dash}</MenuItem>
                        {departments.map((department) => (
                            <MenuItem key={department.departmentCode} value={department.departmentCode}>
                                {department.departmentCode} · {department.city}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField select size="small" label={fields.category} value={form.category}
                               onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeForm("category", event.target.value as DepartmentCostCategory)}>
                        {DEPARTMENT_COST_CATEGORIES.map((category) => (
                            <MenuItem key={category} value={category}>{translations.categories[category]}</MenuItem>
                        ))}
                    </TextField>
                    <TextField size="small" label={fields.amount} value={form.amount} inputMode="decimal"
                               onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeForm("amount", event.target.value)} />
                    <TextField select size="small" label={fields.currency} value={form.currency}
                               onChange={(event: React.ChangeEvent<HTMLSelectElement>) => changeForm("currency", event.target.value)}>
                        {ANALYTICS_CURRENCIES.map((currency) => <MenuItem key={currency} value={currency}>{currency}</MenuItem>)}
                    </TextField>
                    <TextField size="small" type="date" label={fields.incurredOn}
                               value={form.incurredOn} inputProps={{max: today}}
                               onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeForm("incurredOn", event.target.value)} />
                    <TextField size="small" label={fields.description} value={form.description} inputProps={{maxLength: 500}}
                               onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeForm("description", event.target.value)} />
                    <div className="analytics-cost-form-actions">
                        <Button type="submit" startIcon={<Add fontSize="small" />} disabled={saving}>
                            {saving ? translations.saving : translations.add}
                        </Button>
                    </div>
                </form>
                {error ? <Alert severity="error">{error}</Alert> : null}
                {success ? <Alert severity="success">{success}</Alert> : null}
            </div>
            <div className="pallet-panel">
                <div>
                    <Typography variant="h5" id="analytics-costs-title">{translations.title}</Typography>
                    <p className="analytics-panel-subtitle">{translations.subtitle}</p>
                </div>
                <div className="pallet-table-wrap">
                    <table className="pallet-table analytics-table">
                        <thead>
                            <tr>
                                <th>{fields.incurredOn}</th>
                                <th>{fields.department}</th>
                                <th>{fields.category}</th>
                                <th className="analytics-number">{fields.amount}</th>
                                <th>{fields.description}</th>
                                <th>{pl.common.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td className="pallet-empty" colSpan={6}>{pl.common.loading}</td></tr>
                            ) : costs.length ? costs.map((cost) => (
                                <tr key={cost.costId.value}>
                                    <td className="analytics-nowrap">{formatDate(cost.incurredOn)}</td>
                                    <td>{cost.departmentCode}</td>
                                    <td>{translations.categories[cost.category]}</td>
                                    <td className="analytics-number">{formatMoney(cost.amount, cost.currency)}</td>
                                    <td>{cost.description || pl.common.dash}</td>
                                    <td className="pallet-actions-cell">
                                        <IconButton aria-label={translations.delete} title={translations.delete}
                                                    onClick={() => remove(cost)}>
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td className="pallet-empty" colSpan={6}>{translations.empty}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

export default DepartmentCostRegister;
