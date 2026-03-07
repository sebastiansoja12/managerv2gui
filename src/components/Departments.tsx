import React, {useEffect, useMemo, useState} from "react";
import {Alert, Button, CircularProgress, Typography} from "@mui/material";
import {
    Business,
    LocationCity,
    Phone,
    Public,
    Refresh,
    Schedule,
    Tag,
} from "@mui/icons-material";
import Department from "../class/depots/Department";
import departmentService from "../hooks/DepartmentService";
import pl from "../i18n/translate";
import "./Departments/styles/departments.css";

const valueOrDash = (value?: string | null) => value || pl.common.dash;

const translateDepartmentType = (value?: string | null) => value
    ? pl.departments.type[value as keyof typeof pl.departments.type] || value
    : pl.common.dash;

const translateDepartmentStatus = (value?: string | null) => value
    ? pl.departments.status[value as keyof typeof pl.departments.status] || value
    : pl.common.dash;

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(pl.common.locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const Departments: React.FC = () => {
    const [departments, setDepartments] = useState<Array<Department>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const cityCount = useMemo(() => new Set(departments.map((department) => department.address?.city).filter(Boolean)).size, [departments]);
    const countryCount = useMemo(() => new Set(departments.map((department) => department.address?.countryCode).filter(Boolean)).size, [departments]);

    const retrieveDepartments = () => {
        setLoading(true);
        setError("");
        departmentService.getAll()
            .then((response) => {
                setDepartments(response.data);
            })
            .catch((exception: Error) => {
                setError(exception.message || pl.departments.page.loadError);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        retrieveDepartments();
    }, []);

    return (
        <main className="departments-page">
            <section className="departments-header">
                <div className="departments-heading">
                    <span className="departments-kicker">{pl.departments.page.kicker}</span>
                    <Typography variant="h4">{pl.departments.page.title}</Typography>
                    <p>{pl.departments.page.subtitle}</p>
                </div>

                <div className="departments-stats">
                    <div>
                        <Business fontSize="small" />
                        <span>{pl.departments.stats.departments}</span>
                        <strong>{departments.length}</strong>
                    </div>
                    <div>
                        <LocationCity fontSize="small" />
                        <span>{pl.departments.stats.cities}</span>
                        <strong>{cityCount}</strong>
                    </div>
                    <div>
                        <Public fontSize="small" />
                        <span>{pl.departments.stats.countries}</span>
                        <strong>{countryCount}</strong>
                    </div>
                </div>
            </section>

            <section className="departments-table-panel">
                <div className="departments-table-header">
                    <Typography variant="h5">{pl.departments.page.listTitle}</Typography>
                    <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={retrieveDepartments}>
                        {pl.departments.page.refresh}
                    </Button>
                </div>

                {error ? <Alert severity="error">{error}</Alert> : undefined}

                {loading ? (
                    <div className="departments-loader">
                        <CircularProgress size={28} />
                        <span>{pl.departments.page.loading}</span>
                    </div>
                ) : (
                    <div className="departments-table-wrap">
                        <table className="departments-table">
                            <thead>
                            <tr>
                                <th><Tag fontSize="small" /> {pl.departments.columns.code}</th>
                                <th><LocationCity fontSize="small" /> {pl.departments.columns.city}</th>
                                <th>{pl.departments.columns.street}</th>
                                <th><Public fontSize="small" /> {pl.departments.columns.country}</th>
                                <th>{pl.departments.columns.postalCode}</th>
                                <th>{pl.departments.columns.taxId}</th>
                                <th><Phone fontSize="small" /> {pl.departments.columns.telephoneNumber}</th>
                                <th>{pl.departments.columns.email}</th>
                                <th>{pl.departments.columns.departmentType}</th>
                                <th>{pl.departments.columns.status}</th>
                                <th><Schedule fontSize="small" /> {pl.departments.columns.openingHours}</th>
                                <th>{pl.departments.columns.createdAt}</th>
                                <th>{pl.departments.columns.updatedAt}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {departments.map((department) => (
                                <tr key={department.departmentCode.value}>
                                    <td><strong>{department.departmentCode.value}</strong></td>
                                    <td>{valueOrDash(department.address?.city)}</td>
                                    <td>{valueOrDash(department.address?.street)}</td>
                                    <td>{valueOrDash(department.address?.countryCode)}</td>
                                    <td>{valueOrDash(department.address?.postalCode)}</td>
                                    <td>{valueOrDash(department.taxId)}</td>
                                    <td>{valueOrDash(department.telephoneNumber)}</td>
                                    <td>{valueOrDash(department.email)}</td>
                                    <td>{translateDepartmentType(department.departmentType)}</td>
                                    <td>{translateDepartmentStatus(department.status)}</td>
                                    <td>{valueOrDash(department.openingHours)}</td>
                                    <td>{formatDateTime(department.createdAt)}</td>
                                    <td>{formatDateTime(department.updatedAt)}</td>
                                </tr>
                            ))}
                            {!departments.length ? (
                                <tr>
                                    <td className="departments-empty-row" colSpan={13}>{pl.departments.page.empty}</td>
                                </tr>
                            ) : undefined}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
};

export default Departments;
