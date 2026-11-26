import React from "react";

type DepartmentNameProps = {
    departmentCode: string | null;
    city: string | null;
};

function DepartmentName({departmentCode, city}: DepartmentNameProps) {
    return (
        <span className="analytics-department-name">
            <strong>{departmentCode}</strong>
            {city ? <span>{city}</span> : null}
        </span>
    );
}

export default DepartmentName;
