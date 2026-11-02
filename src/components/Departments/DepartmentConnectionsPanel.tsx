import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Alert, Button, CircularProgress, Typography} from "components/ui";
import {AccountTree, Add, Close} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import Department from "../../class/depots/Department";
import DeliveryNetworkService from "../../hooks/DeliveryNetworkService";
import departmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import {AppTabDefinition} from "../AppShell/types";
import DepartmentPicker from "./DepartmentPicker";
import {departmentDetailsPath, departmentDetailsTab} from "./departmentNavigation";
import {DepartmentRelation, departmentRelationPairKey} from "./model/DepartmentRelation";
import "./styles/department-connections.css";

type DepartmentConnectionsPanelProps = {
    department: Department;
    canEdit: boolean;
    onOpenTab?: (tab: AppTabDefinition) => void;
};

const SORTING_FACILITY = "SORTING_FACILITY";

const departmentId = (department: Department) => String(department.departmentId);

const departmentCode = (department: Department) => department.departmentCode?.value || departmentId(department);

const isRelationCandidate = (department: Department) => (
    department.status !== "ARCHIVED" && department.status !== "DELETED"
);

const departmentTypeLabel = (department: Department) => (
    pl.departments.type[department.departmentType as keyof typeof pl.departments.type] || department.departmentType
);

const DepartmentConnectionsPanel: React.FC<DepartmentConnectionsPanelProps> = ({department, canEdit, onOpenTab}) => {
    const translations = pl.departments.connections;
    const navigate = useNavigate();
    const currentDepartmentId = departmentId(department);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [relations, setRelations] = useState<DepartmentRelation[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [departmentsResponse, networkResponse] = await Promise.all([
                departmentService.getAll(),
                DeliveryNetworkService.getCurrentNetwork(),
            ]);
            setDepartments(departmentsResponse.data || []);
            setRelations(networkResponse.data);
        } catch (loadError) {
            setError(getBackendErrorMessage(loadError, translations.loadError));
        } finally {
            setLoading(false);
        }
    }, [translations.loadError]);

    useEffect(() => {
        load();
    }, [load]);

    const departmentsById = useMemo(
        () => new Map(departments.map((candidate) => [departmentId(candidate), candidate])),
        [departments],
    );

    const connectedDepartments = useMemo(() => relations
        .filter((relation) => relation.sourceDepartmentId === currentDepartmentId
            || relation.targetDepartmentId === currentDepartmentId)
        .map((relation) => relation.sourceDepartmentId === currentDepartmentId
            ? relation.targetDepartmentId
            : relation.sourceDepartmentId)
        .map((connectedDepartmentId) => departmentsById.get(connectedDepartmentId))
        .filter((connectedDepartment): connectedDepartment is Department => Boolean(connectedDepartment))
        .sort((first, second) => Number(second.departmentType === SORTING_FACILITY)
            - Number(first.departmentType === SORTING_FACILITY)
            || departmentCode(first).localeCompare(departmentCode(second))), [currentDepartmentId, departmentsById, relations]);

    const connectedDepartmentIds = useMemo(
        () => new Set(connectedDepartments.map(departmentId)),
        [connectedDepartments],
    );
    const candidates = useMemo(
        () => departments.filter((candidate) => isRelationCandidate(candidate)
            && departmentId(candidate) !== currentDepartmentId),
        [currentDepartmentId, departments],
    );
    const missingSortingConnection = isRelationCandidate(department)
        && department.departmentType !== SORTING_FACILITY
        && !connectedDepartments.some((connectedDepartment) => connectedDepartment.departmentType === SORTING_FACILITY
            && isRelationCandidate(connectedDepartment));

    const saveRelations = async (nextRelations: DepartmentRelation[], successMessage: string) => {
        setSaving(true);
        setError(null);
        setNotice(null);
        try {
            const response = await DeliveryNetworkService.replaceCurrentNetwork(nextRelations);
            setRelations(response.data);
            setNotice(successMessage);
            return true;
        } catch (saveError) {
            setError(getBackendErrorMessage(saveError, translations.saveError));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const connect = async () => {
        const target = departmentsById.get(selectedDepartmentId);
        if (!target || connectedDepartmentIds.has(selectedDepartmentId)) {
            return;
        }
        const saved = await saveRelations(
            [...relations, {sourceDepartmentId: currentDepartmentId, targetDepartmentId: selectedDepartmentId}],
            translations.connected.replace("{code}", departmentCode(target)),
        );
        if (saved) {
            setSelectedDepartmentId("");
        }
    };

    const disconnect = (connectedDepartment: Department) => {
        const relationKey = departmentRelationPairKey({
            sourceDepartmentId: currentDepartmentId,
            targetDepartmentId: departmentId(connectedDepartment),
        });
        saveRelations(
            relations.filter((relation) => departmentRelationPairKey(relation) !== relationKey),
            translations.disconnected.replace("{code}", departmentCode(connectedDepartment)),
        );
    };

    const openDepartment = (connectedDepartment: Department) => {
        if (onOpenTab) {
            onOpenTab(departmentDetailsTab(connectedDepartment));
        } else {
            navigate(departmentDetailsPath(connectedDepartment.departmentId));
        }
    };

    return (
        <section className="department-details-panel department-connections" aria-label={translations.title}>
            <div className="department-details-panel-header">
                <Typography variant="h5"><AccountTree fontSize="small" /> {translations.title}</Typography>
                <span className="department-details-hint">
                    {loading ? pl.common.loading : translations.count.replace("{count}", String(connectedDepartments.length))}
                </span>
            </div>
            <p className="department-details-hint">{translations.description}</p>
            {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}
            {notice ? <Alert severity="success" onClose={() => setNotice(null)}>{notice}</Alert> : null}
            {!loading && missingSortingConnection ? (
                <Alert severity="warning">{translations.missingSortingFacility}</Alert>
            ) : null}

            {loading ? (
                <p className="department-details-loading"><CircularProgress size={18} /> {translations.loading}</p>
            ) : connectedDepartments.length ? (
                <ul className="department-connections-list">
                    {connectedDepartments.map((connectedDepartment) => (
                        <li key={departmentId(connectedDepartment)}
                            className={connectedDepartment.departmentType === SORTING_FACILITY ? "is-sorting" : ""}>
                            <button
                                className="department-connections-open"
                                title={translations.openDepartment.replace("{code}", departmentCode(connectedDepartment))}
                                type="button"
                                onClick={() => openDepartment(connectedDepartment)}
                            >
                                <strong>{departmentCode(connectedDepartment)}</strong>
                                <span>{connectedDepartment.address?.city || pl.common.dash}</span>
                                <small>{departmentTypeLabel(connectedDepartment)}</small>
                            </button>
                            {canEdit ? (
                                <button
                                    aria-label={translations.disconnect.replace("{code}", departmentCode(connectedDepartment))}
                                    className="department-connections-remove"
                                    disabled={saving}
                                    title={translations.disconnect.replace("{code}", departmentCode(connectedDepartment))}
                                    type="button"
                                    onClick={() => disconnect(connectedDepartment)}
                                >
                                    <Close fontSize="small" />
                                </button>
                            ) : null}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="department-connections-empty">{translations.empty}</p>
            )}

            {canEdit && !loading && isRelationCandidate(department) ? (
                <form
                    className="department-connections-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        connect();
                    }}
                >
                    <DepartmentPicker
                        departments={candidates}
                        disabled={saving}
                        disabledDepartmentIds={connectedDepartmentIds}
                        label={translations.addLabel}
                        value={selectedDepartmentId}
                        onChange={setSelectedDepartmentId}
                    />
                    <Button
                        disabled={saving || !selectedDepartmentId}
                        startIcon={saving ? <CircularProgress size={16} /> : <Add />}
                        type="submit"
                        variant="contained"
                    >
                        {saving ? translations.saving : translations.connect}
                    </Button>
                </form>
            ) : null}
        </section>
    );
};

export default DepartmentConnectionsPanel;
