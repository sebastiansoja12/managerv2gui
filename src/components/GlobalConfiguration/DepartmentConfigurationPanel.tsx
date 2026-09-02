import React, {useEffect, useState} from "react";
import {Alert, Button, CircularProgress, FormControlLabel, Switch} from "components/ui";
import {Save} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {useAuthState} from "../../auth/AuthState";
import departmentService from "../../hooks/DepartmentService";
import pl from "../../i18n/translate";
import {applyDepartmentAutomations} from "./departmentAutomation";
import {DepartmentConfiguration, useDepartmentConfiguration, writeDepartmentConfiguration} from "./model/DepartmentConfiguration";

const settingKeys: Array<keyof DepartmentConfiguration> = [
    "autoAssignDeliveryAreas", "autoConnectDepartments", "preventDepartmentDeletion", "preventDepartmentArchiving",
];

function DepartmentConfigurationPanel() {
    const {user} = useAuthState();
    const operatorId = user?.operatorId?.value;
    const current = useDepartmentConfiguration(operatorId);
    const [draft, setDraft] = useState<DepartmentConfiguration>(current);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const labels = pl.globalConfiguration.departmentConfiguration;

    useEffect(() => setDraft(current), [current]);

    const save = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const departments = draft.autoAssignDeliveryAreas
                ? (await departmentService.getAll()).data || [] : [];
            const result = await applyDepartmentAutomations(draft, departments, operatorId);
            writeDepartmentConfiguration(operatorId, draft);
            setSuccess(labels.saved.replace("{areas}", String(result.assignedAreas))
                .replace("{connections}", String(result.createdConnections)));
        } catch (cause) {
            setError(getBackendErrorMessage(cause, labels.saveError));
        } finally {
            setSaving(false);
        }
    };

    return <section className="global-configuration-section global-configuration-department-panel">
        <div className="global-configuration-panel-header">
            <div>
                <h3>{labels.title}</h3>
                <p>{labels.description}</p>
            </div>
            <Button disabled={saving} startIcon={saving ? <CircularProgress size={18} /> : <Save />}
                    variant="contained" onClick={save}>{saving ? labels.saving : pl.common.saveChanges}</Button>
        </div>
        <Alert severity="info">{labels.localNote}</Alert>
        {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}
        {success ? <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert> : null}
        <div className="global-configuration-department-settings">
            {settingKeys.map((key) => <div className="global-configuration-department-setting" key={key}>
                <FormControlLabel control={<Switch checked={draft[key]} disabled={saving}
                    onChange={(event) => {
                        setDraft((value) => ({...value, [key]: event.target.checked}));
                        setSuccess(null);
                    }} />}
                    label={labels.settings[key].label} />
                <p>{labels.settings[key].hint}</p>
            </div>)}
        </div>
    </section>;
}

export default DepartmentConfigurationPanel;
