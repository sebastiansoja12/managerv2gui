import React, {useMemo, useState} from "react";
import {
    AddBusiness,
    AdminPanelSettings,
    Business,
    CheckCircle,
    DevicesOther,
    EditOutlined,
    LocalShipping,
    LockOpen,
    PersonAddAlt,
    Refresh,
    Save,
    Search,
    SupportAgent,
    SecurityOutlined,
    SettingsSuggest,
    SyncAlt,
    Tune,
    WorkspacePremium,
} from "components/ui/icons";
import {CourierDto} from "../../Couriers/dto/CourierDto";
import Department from "../../../class/depots/Department";
import {User} from "../../Users/model/User";
import {Operator, OperatorDraft, ShippingCapabilities} from "../../Operators/model/Operator";
import pl from "../../../i18n/translate";
import {getOperatorIdValue} from "./operatorPanelUtils";
import OperatorAccessPanel from "./OperatorAccessPanel";
import OperatorDataPanel from "./OperatorDataPanel";
import OperatorDevicesPanel from "./OperatorDevicesPanel";
import OperatorOnboardingCard from "./OperatorOnboardingCard";
import OperatorPrivacyPanel from "./OperatorPrivacyPanel";
import OperatorLimitsFields from "./OperatorLimitsFields";
import OperatorReadModelPanel from "./OperatorReadModelPanel";
import OperatorSettingsPanel from "./OperatorSettingsPanel";
import OperatorSubscriptionPanel from "./OperatorSubscriptionPanel";

type OperatorWorkspaceTab = "users"
    | "departments"
    | "couriers"
    | "data"
    | "configuration"
    | "settings"
    | "access"
    | "subscription"
    | "devices"
    | "readModels"
    | "privacy";

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
    onImpersonate: () => void;
    onSaveConfiguration: () => void;
    onToggleCapability: (key: keyof ShippingCapabilities) => void;
    onUpdateDraft: <K extends keyof OperatorDraft>(key: K, value: OperatorDraft[K]) => void;
    onResetDraft: () => void;
    onChangeStatus: (status: "ACTIVE" | "INACTIVE") => Promise<void>;
    onDataErased?: () => void;
    saveError?: string;
};

const userRoleOrder: User["role"][] = ["SUPERADMIN", "ADMIN", "MANAGER", "USER", "SUPPLIER"];

const initials = (firstName?: string, lastName?: string, fallback = "U") => (
    `${firstName?.trim()[0] || ""}${lastName?.trim()[0] || ""}`.toUpperCase() || fallback
);

const fullName = (firstName?: string, lastName?: string) => `${firstName || ""} ${lastName || ""}`.trim();

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
    onImpersonate,
    onSaveConfiguration,
    onToggleCapability,
    onUpdateDraft,
    onResetDraft,
    onChangeStatus,
    onDataErased,
    saveError,
}: OperatorWorkspaceProps) {
    const [tab, setTab] = useState<OperatorWorkspaceTab>("users");
    const [userQuery, setUserQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<User["role"] | "ALL">("ALL");

    const roleCounts = useMemo(() => userRoleOrder
        .map((role) => ({role, count: users.filter((user) => user.role === role).length}))
        .filter((roleCount) => roleCount.count > 0), [users]);

    const visibleUsers = useMemo(() => {
        const normalizedQuery = userQuery.trim().toLowerCase();
        return users
            .filter((user) => roleFilter === "ALL" || user.role === roleFilter)
            .filter((user) => !normalizedQuery || [user.firstName, user.lastName, user.username, user.email, user.departmentCode]
                .some((value) => value?.toLowerCase().includes(normalizedQuery)))
            .sort((left, right) => userRoleOrder.indexOf(left.role) - userRoleOrder.indexOf(right.role)
                || (left.departmentCode || "").localeCompare(right.departmentCode || "")
                || fullName(left.firstName, left.lastName).localeCompare(fullName(right.firstName, right.lastName)));
    }, [roleFilter, userQuery, users]);
    const operatorId = getOperatorIdValue(operator);

    const renderUsers = () => (
        <div className="super-admin-directory-list">
            <div className="super-admin-directory-list-header">
                <div><strong>{pl.usersManagement.page.listTitle}</strong><span>{visibleUsers.length} / {users.length} · {pl.superAdmin.workspace.records}</span></div>
                <button className="super-admin-primary-button super-admin-compact-button" onClick={onAddUser} type="button">
                    <PersonAddAlt fontSize="small" /><span>{pl.superAdmin.workspace.addUser}</span>
                </button>
            </div>
            <div className="super-admin-member-toolbar">
                <label className="super-admin-member-search">
                    <Search fontSize="small" />
                    <input
                        aria-label={pl.usersManagement.page.search}
                        onChange={(event) => setUserQuery(event.target.value)}
                        placeholder={pl.usersManagement.page.search}
                        type="search"
                        value={userQuery}
                    />
                </label>
                <div className="super-admin-member-filters" role="group" aria-label={pl.usersManagement.columns.role}>
                    <button
                        aria-pressed={roleFilter === "ALL"}
                        className={roleFilter === "ALL" ? "is-active" : ""}
                        onClick={() => setRoleFilter("ALL")}
                        type="button"
                    >
                        {pl.common.all}<span>{users.length}</span>
                    </button>
                    {roleCounts.map(({role, count}) => (
                        <button
                            aria-pressed={roleFilter === role}
                            className={`super-admin-member-filter-${role.toLowerCase()}${roleFilter === role ? " is-active" : ""}`}
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            type="button"
                        >
                            {pl.usersManagement.roles[role] || role}<span>{count}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="super-admin-directory-table super-admin-member-table">
                <div className="super-admin-directory-row super-admin-directory-head">
                    <span>{pl.usersManagement.columns.user}</span><span>{pl.usersManagement.columns.role}</span><span>{pl.usersManagement.columns.department}</span><span>{pl.usersManagement.columns.email}</span>
                </div>
                {visibleUsers.map((user) => (
                    <div className="super-admin-directory-row" key={String(user.userId?.value)}>
                        <span className="super-admin-member-person">
                            <span className={`super-admin-member-avatar super-admin-member-avatar-${user.role.toLowerCase()}`}>{initials(user.firstName, user.lastName)}</span>
                            <span className="super-admin-member-name">
                                <strong>{fullName(user.firstName, user.lastName) || user.username}</strong>
                                <small>@{user.username}</small>
                            </span>
                        </span>
                        <span className={`super-admin-member-role super-admin-member-role-${user.role.toLowerCase()}`}>{pl.usersManagement.roles[user.role] || user.role}</span>
                        <span className="super-admin-member-department"><Business fontSize="small" />{user.departmentCode || pl.common.dash}</span>
                        <span className="super-admin-member-email" title={user.email}>{user.email || pl.common.dash}</span>
                    </div>
                ))}
                {!loading && !visibleUsers.length ? <div className="super-admin-directory-empty">{pl.usersManagement.page.empty}</div> : null}
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
                        <span className="super-admin-member-person"><span className="super-admin-member-avatar super-admin-member-avatar-supplier">{initials(courier.firstName, courier.lastName, "K")}</span><span className="super-admin-member-name"><strong>{fullName(courier.firstName, courier.lastName) || pl.common.dash}</strong><small>{courier.telephoneNumber || pl.common.dash}</small></span></span>
                        <span className="super-admin-directory-tag">{courierCode(courier)}</span>
                        <span className="super-admin-member-department"><Business fontSize="small" />{courierDepartment(courier)}</span>
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
            <OperatorLimitsFields draft={draft} onUpdateDraft={onUpdateDraft} />
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
                <button className="super-admin-secondary-button" onClick={() => setTab("data")} type="button"><EditOutlined fontSize="small" /><span>{pl.superAdmin.workspace.editData}</span></button>
                <button className="super-admin-secondary-button" onClick={() => setTab("configuration")} type="button"><SettingsSuggest fontSize="small" /><span>{pl.superAdmin.workspace.configuration}</span></button>
                <button className="super-admin-secondary-button super-admin-impersonate-button" onClick={onImpersonate} type="button"><SupportAgent fontSize="small" /><span>{pl.superAdmin.impersonation.action}</span></button>
                <button aria-label={pl.superAdmin.workspace.refresh} className="super-admin-icon-button" onClick={onRefresh} type="button"><Refresh fontSize="small" /></button>
            </div>

            <OperatorOnboardingCard
                key={operatorId}
                onAddCourier={onAddCourier}
                onAddDepartment={onAddDepartment}
                onAddUser={onAddUser}
                onImpersonate={onImpersonate}
                operatorId={operatorId}
                refreshKey={users.length + departments.length + couriers.length}
            />

            <div className="super-admin-workspace-tabs" role="tablist">
                {([
                    ["users", pl.superAdmin.workspace.usersTab, AdminPanelSettings],
                    ["departments", pl.superAdmin.workspace.departmentsTab, Business],
                    ["couriers", pl.superAdmin.workspace.couriersTab, LocalShipping],
                    ["data", pl.superAdmin.workspace.dataTab, EditOutlined],
                    ["configuration", pl.superAdmin.workspace.configurationTab, SettingsSuggest],
                    ["settings", pl.superAdmin.workspace.settingsTab, Tune],
                    ["access", pl.superAdmin.workspace.accessTab, LockOpen],
                    ["subscription", pl.superAdmin.workspace.subscriptionTab, WorkspacePremium],
                    ["devices", pl.superAdmin.workspace.devicesTab, DevicesOther],
                    ["readModels", pl.superAdmin.workspace.readModelsTab, SyncAlt],
                    ["privacy", pl.superAdmin.workspace.privacyTab, SecurityOutlined],
                ] as const).map(([value, label, Icon]) => (
                    <button aria-selected={tab === value} className={tab === value ? "super-admin-workspace-tab-active" : ""} key={value} onClick={() => setTab(value)} role="tab" type="button"><Icon fontSize="small" /><span>{label}</span></button>
                ))}
            </div>

            {loading ? <div className="super-admin-directory-loading"><Refresh fontSize="small" />{pl.superAdmin.workspace.loading}</div> : null}
            {!loading && tab === "users" ? renderUsers() : null}
            {!loading && tab === "departments" ? renderDepartments() : null}
            {!loading && tab === "couriers" ? renderCouriers() : null}
            {!loading && tab === "configuration" ? renderConfiguration() : null}
            {tab === "data" ? (
                <OperatorDataPanel
                    draft={draft}
                    error={saveError}
                    onReset={onResetDraft}
                    onSave={onSaveConfiguration}
                    onUpdateDraft={onUpdateDraft}
                    operator={operator}
                    saving={saving}
                />
            ) : null}
            {tab === "settings" ? <OperatorSettingsPanel operatorId={operatorId} /> : null}
            {tab === "access" ? (
                <OperatorAccessPanel onChangeStatus={onChangeStatus} onImpersonate={onImpersonate} operator={operator} users={users} />
            ) : null}
            {tab === "subscription" ? <OperatorSubscriptionPanel key={operatorId} operatorId={operatorId} /> : null}
            {tab === "devices" ? <OperatorDevicesPanel operatorId={operatorId} users={users} /> : null}
            {tab === "readModels" ? <OperatorReadModelPanel operatorId={operatorId} /> : null}
            {tab === "privacy" ? <OperatorPrivacyPanel onErased={onDataErased} operator={operator} /> : null}
        </article>
    );
}

export default OperatorWorkspace;
