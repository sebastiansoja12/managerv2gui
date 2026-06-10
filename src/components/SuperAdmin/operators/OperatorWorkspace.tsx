import React, {useState} from "react";
import {
    AddBusiness,
    AdminPanelSettings,
    Business,
    CheckCircle,
    LocalShipping,
    PersonAddAlt,
    Refresh,
    Save,
    SettingsSuggest,
} from "components/ui/icons";
import {CourierDto} from "../../Couriers/dto/CourierDto";
import Department from "../../../class/depots/Department";
import {User} from "../../Users/model/User";
import {Operator, OperatorDraft, ShippingCapabilities} from "../../Operators/model/Operator";
import pl from "../../../i18n/translate";
import {getOperatorIdValue} from "./operatorPanelUtils";

type OperatorWorkspaceTab = "users" | "departments" | "couriers" | "configuration";

type CapabilityLabel = {
    key: keyof ShippingCapabilities;
    label: string;
    hint: string;
};

type OperatorWorkspaceProps = {
    operator: Operator;
    draft: OperatorDraft;
    users: User[];
    departments: Department[];
    couriers: CourierDto[];
    loading: boolean;
    saving: boolean;
    capabilityLabels: CapabilityLabel[];
    onAddUser: () => void;
    onAddDepartment: () => void;
    onAddCourier: () => void;
    onRefresh: () => void;
    onSaveConfiguration: () => void;
    onToggleCapability: (key: keyof ShippingCapabilities) => void;
};

const departmentCode = (department: Department) => department.departmentCode?.value || pl.common.dash;
const courierCode = (courier: CourierDto) => courier.supplierCode?.value || pl.common.dash;
const courierDepartment = (courier: CourierDto) => courier.departmentCode?.value || pl.common.dash;

function OperatorWorkspace({
    operator,
    draft,
    users,
    departments,
    couriers,
    loading,
    saving,
    capabilityLabels,
    onAddUser,
    onAddDepartment,
    onAddCourier,
    onRefresh,
    onSaveConfiguration,
    onToggleCapability,
}: OperatorWorkspaceProps) {
    const [tab, setTab] = useState<OperatorWorkspaceTab>("users");
    const operatorId = getOperatorIdValue(operator);

    const renderUsers = () => (
        <div className="super-admin-directory-list">
            <div className="super-admin-directory-list-header">
                <div><strong>{pl.usersManagement.page.listTitle}</strong><span>{users.length} · {pl.superAdmin.workspace.records}</span></div>
                <button className="super-admin-primary-button super-admin-compact-button" onClick={onAddUser} type="button">
                    <PersonAddAlt fontSize="small" /><span>{pl.superAdmin.workspace.addUser}</span>
                </button>
            </div>
            <div className="super-admin-directory-table">
                <div className="super-admin-directory-row super-admin-directory-head">
                    <span>{pl.usersManagement.columns.user}</span><span>{pl.usersManagement.columns.role}</span><span>{pl.usersManagement.columns.department}</span><span>{pl.usersManagement.columns.email}</span>
                </div>
                {users.map((user) => (
                    <div className="super-admin-directory-row" key={String(user.userId?.value)}>
                        <span className="super-admin-directory-person"><span className="super-admin-avatar">{`${user.firstName || ""}${user.lastName || ""}`.slice(0, 2).toUpperCase() || "U"}</span><strong>{`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username}</strong><small>{user.username}</small></span>
                        <span className="super-admin-directory-tag">{pl.usersManagement.roles[user.role] || user.role}</span>
                        <span>{user.departmentCode || pl.common.dash}</span>
                        <span className="super-admin-directory-muted">{user.email || pl.common.dash}</span>
                    </div>
                ))}
                {!loading && !users.length ? <div className="super-admin-directory-empty">{pl.usersManagement.page.empty}</div> : null}
            </div>
        </div>
    );

    const renderDepartments = () => (
        <div className="super-admin-directory-list">
            <div className="super-admin-directory-list-header">
                <div><strong>{pl.departments.page.listTitle}</strong><span>{departments.length} · {pl.superAdmin.workspace.records}</span></div>
                <button className="super-admin-primary-button super-admin-compact-button" onClick={onAddDepartment} type="button">
                    <AddBusiness fontSize="small" /><span>{pl.superAdmin.workspace.addDepartment}</span>
                </button>
            </div>
            <div className="super-admin-directory-table">
                <div className="super-admin-directory-row super-admin-directory-head">
                    <span>{pl.departments.columns.code}</span><span>{pl.departments.columns.city}</span><span>{pl.departments.columns.departmentType}</span><span>{pl.departments.columns.status}</span>
                </div>
                {departments.map((department) => (
                    <div className="super-admin-directory-row" key={String(department.departmentId)}>
                        <span className="super-admin-directory-code"><Business fontSize="small" />{departmentCode(department)}</span>
                        <span>{department.address?.city || pl.common.dash}</span>
                        <span>{pl.departments.type[department.departmentType as keyof typeof pl.departments.type] || department.departmentType || pl.common.dash}</span>
                        <span className="super-admin-directory-status"><CheckCircle fontSize="small" />{pl.departments.status[department.status as keyof typeof pl.departments.status] || department.status || pl.common.dash}</span>
                    </div>
                ))}
                {!loading && !departments.length ? <div className="super-admin-directory-empty">{pl.departments.page.empty}</div> : null}
            </div>
        </div>
    );

    const renderCouriers = () => (
        <div className="super-admin-directory-list">
            <div className="super-admin-directory-list-header">
                <div><strong>{pl.couriers.page.listTitle}</strong><span>{couriers.length} · {pl.superAdmin.workspace.records}</span></div>
                <button className="super-admin-primary-button super-admin-compact-button" onClick={onAddCourier} type="button">
                    <LocalShipping fontSize="small" /><span>{pl.superAdmin.workspace.addCourier}</span>
                </button>
            </div>
            <div className="super-admin-directory-table">
                <div className="super-admin-directory-row super-admin-directory-head">
                    <span>{pl.couriers.fields.firstName}</span><span>{pl.couriers.create.fields.supplierCode}</span><span>{pl.couriers.fields.department}</span><span>{pl.couriers.columns.status}</span>
                </div>
                {couriers.map((courier) => (
                    <div className="super-admin-directory-row" key={courierCode(courier)}>
                        <span className="super-admin-directory-person"><span className="super-admin-avatar super-admin-avatar-accent">{`${courier.firstName || ""}${courier.lastName || ""}`.slice(0, 2).toUpperCase() || "K"}</span><strong>{`${courier.firstName || ""} ${courier.lastName || ""}`.trim() || pl.common.dash}</strong><small>{courier.telephoneNumber || pl.common.dash}</small></span>
                        <span className="super-admin-directory-tag">{courierCode(courier)}</span>
                        <span>{courierDepartment(courier)}</span>
                        <span className="super-admin-directory-status"><CheckCircle fontSize="small" />{pl.couriers.status[courier.status as keyof typeof pl.couriers.status] || courier.status || pl.common.dash}</span>
                    </div>
                ))}
                {!loading && !couriers.length ? <div className="super-admin-directory-empty">{pl.couriers.page.empty}</div> : null}
            </div>
        </div>
    );

    const renderConfiguration = () => (
        <div className="super-admin-configuration-workspace">
            <div className="super-admin-directory-list-header">
                <div><strong>{pl.superAdmin.editor.featuresTitle}</strong><span>{pl.superAdmin.editor.featuresSubtitle}</span></div>
                <button className="super-admin-primary-button super-admin-compact-button" disabled={saving} onClick={onSaveConfiguration} type="button">
                    <Save fontSize="small" /><span>{saving ? pl.superAdmin.editor.saving : pl.superAdmin.workspace.saveConfiguration}</span>
                </button>
            </div>
            <div className="super-admin-feature-grid">
                {capabilityLabels.map((capability) => {
                    const enabled = Boolean(draft.configuration.shippingCapabilities[capability.key]);
                    return (
                        <button className={`super-admin-feature${enabled ? " super-admin-feature-enabled" : ""}`} key={capability.key} onClick={() => onToggleCapability(capability.key)} type="button">
                            <span><strong>{capability.label}</strong><small>{capability.hint}</small></span>
                            <span className="super-admin-feature-state">{enabled ? pl.superAdmin.workspace.enabled : pl.superAdmin.workspace.disabled}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <article className="super-admin-panel super-admin-operator-workspace">
            <div className="super-admin-workspace-heading">
                <div className="super-admin-workspace-identity">
                    <span className="super-admin-workspace-avatar">{operator.companyName.slice(0, 2).toUpperCase()}</span>
                    <div><span className="super-admin-kicker">{pl.superAdmin.workspace.operatorDetails}</span><h2>{operator.companyName}</h2><p>#{operatorId} · {operator.contactEmail || pl.common.dash}</p></div>
                </div>
                <span className={`super-admin-status ${operator.status === "ACTIVE" ? "is-active" : "is-inactive"}`}>{operator.status === "ACTIVE" ? pl.superAdmin.editor.active : pl.superAdmin.editor.inactive}</span>
            </div>

            <div className="super-admin-workspace-actions">
                <button className="super-admin-primary-button" onClick={onAddUser} type="button"><PersonAddAlt fontSize="small" /><span>{pl.superAdmin.workspace.addUser}</span></button>
                <button className="super-admin-secondary-button" onClick={onAddDepartment} type="button"><AddBusiness fontSize="small" /><span>{pl.superAdmin.workspace.addDepartment}</span></button>
                <button className="super-admin-secondary-button" onClick={onAddCourier} type="button"><LocalShipping fontSize="small" /><span>{pl.superAdmin.workspace.addCourier}</span></button>
                <button className="super-admin-secondary-button" onClick={() => setTab("configuration")} type="button"><SettingsSuggest fontSize="small" /><span>{pl.superAdmin.workspace.configuration}</span></button>
                <button aria-label={pl.superAdmin.workspace.refresh} className="super-admin-icon-button" onClick={onRefresh} type="button"><Refresh fontSize="small" /></button>
            </div>

            <div className="super-admin-workspace-tabs" role="tablist">
                {([
                    ["users", pl.superAdmin.workspace.usersTab, AdminPanelSettings],
                    ["departments", pl.superAdmin.workspace.departmentsTab, Business],
                    ["couriers", pl.superAdmin.workspace.couriersTab, LocalShipping],
                    ["configuration", pl.superAdmin.workspace.configurationTab, SettingsSuggest],
                ] as const).map(([value, label, Icon]) => (
                    <button aria-selected={tab === value} className={tab === value ? "super-admin-workspace-tab-active" : ""} key={value} onClick={() => setTab(value)} role="tab" type="button"><Icon fontSize="small" /><span>{label}</span></button>
                ))}
            </div>

            {loading ? <div className="super-admin-directory-loading"><Refresh fontSize="small" />{pl.superAdmin.workspace.loading}</div> : null}
            {!loading && tab === "users" ? renderUsers() : null}
            {!loading && tab === "departments" ? renderDepartments() : null}
            {!loading && tab === "couriers" ? renderCouriers() : null}
            {!loading && tab === "configuration" ? renderConfiguration() : null}
        </article>
    );
}

export default OperatorWorkspace;
