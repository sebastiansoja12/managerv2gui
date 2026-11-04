import React, {useState} from "react";
import {Business} from "components/ui/icons";
import {switchActingDepartment} from "../../auth/AuthSession";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";

type ActingDepartmentSwitcherProps = {
    departmentCode: string;
    homeDepartmentCode: string;
    departments: Department[];
};

function ActingDepartmentSwitcher({departmentCode, homeDepartmentCode, departments}: ActingDepartmentSwitcherProps) {
    const [switching, setSwitching] = useState(false);
    const [error, setError] = useState("");
    const translations = pl.home.dashboard.actingDepartment;
    const departmentCodes = Array.from(new Set([
        homeDepartmentCode,
        departmentCode,
        ...departments.map((department) => department.departmentCode?.value || ""),
    ].filter(Boolean))).sort((first, second) => first.localeCompare(second));

    const changeDepartment = (nextDepartmentCode: string) => {
        setSwitching(true);
        setError("");
        switchActingDepartment(nextDepartmentCode === homeDepartmentCode ? null : nextDepartmentCode)
            .catch(() => setError(translations.error))
            .finally(() => setSwitching(false));
    };

    return (
        <>
            <strong className="home-dashboard-department-switch">
                <Business fontSize="small" />
                <select
                    aria-label={translations.label}
                    disabled={switching}
                    onChange={(event) => changeDepartment(event.target.value)}
                    value={departmentCode}
                >
                    {departmentCodes.map((code) => (
                        <option key={code} value={code}>
                            {code === homeDepartmentCode ? translations.home.replace("{code}", code) : code}
                        </option>
                    ))}
                </select>
            </strong>
            {departmentCode !== homeDepartmentCode ? (
                <small className="home-dashboard-acting-note">
                    {translations.note.replace("{code}", departmentCode)}
                    <button disabled={switching} onClick={() => changeDepartment(homeDepartmentCode)} type="button">
                        {translations.reset}
                    </button>
                </small>
            ) : null}
            {error ? <small className="home-dashboard-acting-error" role="alert">{error}</small> : null}
        </>
    );
}

export default ActingDepartmentSwitcher;
