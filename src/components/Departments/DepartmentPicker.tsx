import React, {useEffect, useId, useMemo, useRef, useState} from "react";
import {TextField} from "components/ui";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import "./styles/department-picker.css";

type DepartmentPickerProps = {
    label: string;
    departments: Department[];
    value: string;
    onChange: (departmentId: string) => void;
    disabledDepartmentIds?: Set<string>;
    disabled?: boolean;
};

const MAX_VISIBLE_OPTIONS = 50;

const departmentId = (department: Department) => String(department.departmentId);

const departmentCode = (department: Department) => department.departmentCode?.value || departmentId(department);

const departmentTypeLabel = (department: Department) => (
    pl.departments.type[department.departmentType as keyof typeof pl.departments.type] || department.departmentType
);

const departmentLabel = (department: Department) => (
    `${departmentCode(department)} · ${department.address?.city || pl.common.dash}`
);

const normalize = (value: string) => value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toLowerCase()
    .trim();

const searchableText = (department: Department) => normalize([
    departmentCode(department),
    department.address?.city,
    department.address?.street,
    department.address?.postalCode,
    departmentTypeLabel(department),
].filter(Boolean).join(" "));

const matchRank = (department: Department, query: string) => {
    const code = normalize(departmentCode(department));
    if (code === query) {
        return 0;
    }
    if (code.startsWith(query)) {
        return 1;
    }
    return normalize(department.address?.city || "").startsWith(query) ? 2 : 3;
};

const DepartmentPicker: React.FC<DepartmentPickerProps> = ({
    label,
    departments,
    value,
    onChange,
    disabledDepartmentIds,
    disabled,
}) => {
    const listboxId = `department-picker-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const selectedDepartment = departments.find((department) => departmentId(department) === value);
    const [query, setQuery] = useState(selectedDepartment ? departmentLabel(selectedDepartment) : "");
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const clearedByTypingRef = useRef(false);

    useEffect(() => {
        if (clearedByTypingRef.current) {
            clearedByTypingRef.current = false;
            return;
        }
        setQuery(selectedDepartment ? departmentLabel(selectedDepartment) : "");
    }, [selectedDepartment]);

    const options = useMemo(() => {
        const normalizedQuery = normalize(query);
        const showAll = !normalizedQuery || (selectedDepartment && query === departmentLabel(selectedDepartment));
        return departments
            .filter((department) => showAll || searchableText(department).includes(normalizedQuery))
            .sort((first, second) => showAll
                ? departmentCode(first).localeCompare(departmentCode(second))
                : matchRank(first, normalizedQuery) - matchRank(second, normalizedQuery)
                    || departmentCode(first).localeCompare(departmentCode(second)))
            .slice(0, MAX_VISIBLE_OPTIONS);
    }, [departments, query, selectedDepartment]);

    const isDisabledOption = (department: Department) => Boolean(disabledDepartmentIds?.has(departmentId(department)));

    const choose = (department: Department) => {
        if (isDisabledOption(department)) {
            return;
        }
        onChange(departmentId(department));
        setQuery(departmentLabel(department));
        setOpen(false);
    };

    const moveHighlight = (direction: 1 | -1) => {
        if (!options.length) {
            return;
        }
        setOpen(true);
        setHighlightedIndex((current) => (current + direction + options.length) % options.length);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveHighlight(1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveHighlight(-1);
        } else if (event.key === "Enter" && open && options[highlightedIndex]) {
            event.preventDefault();
            choose(options[highlightedIndex]);
        } else if (event.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div className="department-picker">
            <TextField
                aria-activedescendant={open && options[highlightedIndex]
                    ? `${listboxId}-${departmentId(options[highlightedIndex])}`
                    : undefined}
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-expanded={open}
                autoComplete="off"
                disabled={disabled}
                label={label}
                placeholder={pl.departments.picker.placeholder}
                role="combobox"
                size="small"
                value={query}
                onBlur={() => {
                    setOpen(false);
                    setQuery(selectedDepartment ? departmentLabel(selectedDepartment) : "");
                }}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setQuery(event.target.value);
                    setHighlightedIndex(0);
                    setOpen(true);
                    if (value) {
                        clearedByTypingRef.current = true;
                        onChange("");
                    }
                }}
                onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
                    event.target.select();
                    setOpen(true);
                }}
                onKeyDown={handleKeyDown}
            />
            {open ? (
                <ul className="department-picker-options" id={listboxId} role="listbox" aria-label={label}>
                    {options.length ? options.map((department, index) => (
                        <li
                            aria-disabled={isDisabledOption(department)}
                            aria-selected={departmentId(department) === value}
                            className={[
                                "department-picker-option",
                                index === highlightedIndex ? "is-highlighted" : "",
                                isDisabledOption(department) ? "is-disabled" : "",
                            ].filter(Boolean).join(" ")}
                            id={`${listboxId}-${departmentId(department)}`}
                            key={departmentId(department)}
                            role="option"
                            onMouseDown={(event) => {
                                event.preventDefault();
                                choose(department);
                            }}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            <strong>{departmentCode(department)}</strong>
                            <span>{department.address?.city || pl.common.dash}</span>
                            <small className={department.departmentType === "SORTING_FACILITY" ? "is-sorting" : ""}>
                                {departmentTypeLabel(department)}
                            </small>
                        </li>
                    )) : (
                        <li className="department-picker-empty" role="presentation">{pl.departments.picker.noResults}</li>
                    )}
                </ul>
            ) : null}
        </div>
    );
};

export default DepartmentPicker;
