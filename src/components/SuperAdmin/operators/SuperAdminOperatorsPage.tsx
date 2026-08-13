import React, {useEffect, useMemo, useState} from "react";
import OperatorService from "../../../hooks/OperatorService";
import OperatorDirectoryService from "../../../hooks/OperatorDirectoryService";
import pl from "../../../i18n/translate";
import {createEmptyOperatorDraft, Operator, OperatorDraft, operatorToDraft, ShippingCapabilities} from "../../Operators/model/Operator";
import {CourierDto} from "../../Couriers/dto/CourierDto";
import Department from "../../../class/depots/Department";
import {User} from "../../Users/model/User";
import SuperAdminLayout from "../layout/SuperAdminLayout";
import {getCapabilityLabels} from "./capabilityLabels";
import OperatorDirectoryDialog from "./OperatorDirectoryDialog";
import OperatorEditor from "./OperatorEditor";
import OperatorList from "./OperatorList";
import OperatorMetrics from "./OperatorMetrics";
import OperatorWorkspace from "./OperatorWorkspace";
import OperatorUserDialog from "./OperatorUserDialog";
import {getOperatorIdValue, toCreateRequest, toUpdateRequest} from "./operatorPanelUtils";

function SuperAdminOperatorsPage() {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");
    const [draft, setDraft] = useState<OperatorDraft>(createEmptyOperatorDraft());
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [createMode, setCreateMode] = useState(false);
    const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
    const [directoryDepartments, setDirectoryDepartments] = useState<Department[]>([]);
    const [directoryCouriers, setDirectoryCouriers] = useState<CourierDto[]>([]);
    const [directoryLoading, setDirectoryLoading] = useState(false);
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [directoryDialogMode, setDirectoryDialogMode] = useState<"department" | "courier" | null>(null);
    const capabilityLabels = getCapabilityLabels();

    useEffect(() => {
        let active = true;
        OperatorService.getAll()
            .then((response) => {
                if (!active || !Array.isArray(response.data)) {
                    return;
                }

                const loadedOperators = response.data;
                setOperators(loadedOperators);
                if (loadedOperators.length) {
                    setSelectedOperatorId(getOperatorIdValue(loadedOperators[0]));
                    setDraft(operatorToDraft(loadedOperators[0]));
                    setCreateMode(false);
                } else {
                    setSelectedOperatorId("");
                    setDraft(createEmptyOperatorDraft());
                    setCreateMode(true);
                }
                setError("");
            })
            .catch(() => {
                if (active) {
                    setError(pl.superAdmin.list.loadError);
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    const selectedOperator = operators.find((operator) => getOperatorIdValue(operator) === selectedOperatorId);

    const loadDirectory = (operatorId: string) => {
        setDirectoryLoading(true);
        Promise.all([
            OperatorDirectoryService.getUsers(operatorId),
            OperatorDirectoryService.getDepartments(operatorId),
            OperatorDirectoryService.getCouriers(operatorId),
        ]).then(([users, departments, couriers]) => {
            setDirectoryUsers(users);
            setDirectoryDepartments(departments);
            setDirectoryCouriers(couriers);
        }).catch(() => {
            setDirectoryUsers([]);
            setDirectoryDepartments([]);
            setDirectoryCouriers([]);
        }).finally(() => setDirectoryLoading(false));
    };

    useEffect(() => {
        if (!createMode && selectedOperatorId) {
            loadDirectory(selectedOperatorId);
        }
    }, [createMode, selectedOperatorId]);

    const filteredOperators = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return operators;
        }

        return operators.filter((operator) => (
            operator.companyName.toLowerCase().includes(normalizedQuery)
            || getOperatorIdValue(operator).includes(normalizedQuery)
            || String(operator.taxId?.value ?? "").toLowerCase().includes(normalizedQuery)
        ));
    }, [operators, query]);

    const activeOperators = operators.filter((operator) => operator.status === "ACTIVE").length;
    const lockerOperators = operators.filter((operator) => operator.supportsLockers).length;
    const internationalOperators = operators.filter((operator) => operator.supportsInternationalShipping).length;
    const enabledFeatures = capabilityLabels.reduce((total, capability) => (
        total + operators.filter((operator) => operator.configuration?.shippingCapabilities?.[capability.key]).length
    ), 0);

    const selectOperator = (operator: Operator) => {
        setCreateMode(false);
        setSelectedOperatorId(getOperatorIdValue(operator));
        setDraft(operatorToDraft(operator));
        setError("");
    };

    const startCreate = () => {
        setCreateMode(true);
        setSelectedOperatorId("");
        setDraft(createEmptyOperatorDraft());
        setUserDialogOpen(false);
        setDirectoryDialogMode(null);
    };

    const updateDraft = <K extends keyof OperatorDraft>(key: K, value: OperatorDraft[K]) => {
        setDraft((currentDraft) => ({
            ...currentDraft,
            [key]: value,
        }));
    };

    const toggleCapability = (key: keyof ShippingCapabilities) => {
        setDraft((currentDraft) => {
            const nextValue = !currentDraft.configuration.shippingCapabilities[key];
            const nextCapabilities = {
                ...currentDraft.configuration.shippingCapabilities,
                [key]: nextValue,
            };

            return {
                ...currentDraft,
                supportsLockers: key === "supportsParcelLockers" ? nextValue : currentDraft.supportsLockers,
                supportsInternationalShipping: key === "supportsInternationalShipping" ? nextValue : currentDraft.supportsInternationalShipping,
                supportsCashOnDelivery: key === "supportsCashOnDelivery" ? nextValue : currentDraft.supportsCashOnDelivery,
                configuration: {
                    ...currentDraft.configuration,
                    shippingCapabilities: nextCapabilities,
                },
            };
        });
    };

    const toggleStatus = () => {
        updateDraft("status", draft.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
    };

    const refreshDirectory = () => {
        if (selectedOperatorId) {
            loadDirectory(selectedOperatorId);
        }
    };

    const saveDraft = () => {
        setSaving(true);

        const saveOperation = createMode || !draft.operatorId
            ? OperatorService.create(toCreateRequest(draft))
                .then((response) => OperatorService.getById(response.data.value))
            : OperatorService.update(draft.operatorId, toUpdateRequest(draft));

        saveOperation
            .then((response) => {
                const savedOperator = response.data;
                setOperators((currentOperators) => {
                    const operatorId = getOperatorIdValue(savedOperator);
                    const exists = currentOperators.some((currentOperator) => getOperatorIdValue(currentOperator) === operatorId);
                    return exists
                        ? currentOperators.map((currentOperator) => getOperatorIdValue(currentOperator) === operatorId ? savedOperator : currentOperator)
                        : currentOperators.concat(savedOperator);
                });
                setCreateMode(false);
                setSelectedOperatorId(getOperatorIdValue(savedOperator));
                setDraft(operatorToDraft(savedOperator));
                setError("");
            })
            .catch(() => {
                setError(pl.superAdmin.list.saveError);
            })
            .finally(() => setSaving(false));
    };

    return (
        <SuperAdminLayout error={error} onCreate={startCreate}>
            <OperatorMetrics
                activeOperators={activeOperators}
                enabledFeatures={enabledFeatures}
                internationalOperators={internationalOperators}
                lockerOperators={lockerOperators}
            />

            <section className="super-admin-grid">
                <OperatorList
                    error={error}
                    filteredOperators={filteredOperators}
                    loading={loading}
                    onCreate={startCreate}
                    onQueryChange={setQuery}
                    onSelect={selectOperator}
                    query={query}
                    selectedOperatorId={selectedOperatorId}
                />
                {createMode || !selectedOperator ? (
                    <OperatorEditor
                        createMode={createMode}
                        draft={draft}
                        onCreate={startCreate}
                        onSave={saveDraft}
                        onToggleCapability={toggleCapability}
                        onToggleStatus={toggleStatus}
                        onUpdateDraft={updateDraft}
                        saving={saving}
                        selectedOperator={selectedOperator}
                    />
                ) : (
                    <OperatorWorkspace
                        capabilityLabels={capabilityLabels}
                        couriers={directoryCouriers}
                        departments={directoryDepartments}
                        draft={draft}
                        loading={directoryLoading}
                        onAddCourier={() => setDirectoryDialogMode("courier")}
                        onAddDepartment={() => setDirectoryDialogMode("department")}
                        onAddUser={() => setUserDialogOpen(true)}
                        onRefresh={refreshDirectory}
                        onSaveConfiguration={saveDraft}
                        onToggleCapability={toggleCapability}
                        operator={selectedOperator}
                        saving={saving}
                        users={directoryUsers}
                    />
                )}
            </section>

            {!createMode && selectedOperator ? (
                <>
                    <OperatorUserDialog onClose={() => setUserDialogOpen(false)} onCreated={refreshDirectory} open={userDialogOpen} operatorId={selectedOperatorId} operatorName={selectedOperator.companyName} />
                    <OperatorDirectoryDialog mode={directoryDialogMode} onClose={() => setDirectoryDialogMode(null)} onCreated={refreshDirectory} operatorId={selectedOperatorId} operatorName={selectedOperator.companyName} />
                </>
            ) : null}
        </SuperAdminLayout>
    );
}

export default SuperAdminOperatorsPage;
