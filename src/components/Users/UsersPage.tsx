import React, {useEffect, useMemo, useState} from "react";
import {Add, AdminPanelSettings, Edit, ManageAccounts, PeopleAlt, Refresh, Search, VpnKey} from "@mui/icons-material";
import {Alert, CircularProgress, Typography} from "@mui/material";
import pl from "../../i18n/translate";
import UserManagementService from "../../hooks/UserManagementService";
import {
    CreateUserRequest,
    permissionDefinitions,
    UpdateUserRequest,
    User,
    UserPermission,
    UserRole,
} from "./model/User";
import UserCreateDialog from "./UserCreateDialog";
import UserEditDialog from "./UserEditDialog";
import UserPermissionsDialog from "./UserPermissionsDialog";
import UserRoleDialog from "./UserRoleDialog";
import "./styles/users.css";

const userIdValue = (user: User) => user.userId.value;

function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editedUser, setEditedUser] = useState<User>();
    const [roleUser, setRoleUser] = useState<User>();
    const [permissionsUser, setPermissionsUser] = useState<User>();

    const loadUsers = (clearNotice = true) => {
        setLoading(true);
        setError("");
        if (clearNotice) {
            setSuccess("");
        }
        UserManagementService.getAll()
            .then((response) => setUsers(Array.isArray(response.data) ? response.data : []))
            .catch(() => setError(pl.usersManagement.messages.loadError))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return users;
        }
        return users.filter((user) => [
            user.firstName,
            user.lastName,
            user.username,
            user.email,
            user.departmentCode,
            user.role,
        ].some((value) => value?.toLowerCase().includes(normalizedQuery)));
    }, [query, users]);

    const saveUser = (request: UpdateUserRequest) => {
        if (!editedUser) {
            return;
        }
        setSaving(true);
        setError("");
        UserManagementService.update(userIdValue(editedUser), request)
            .then((response) => {
                const updatedUser = response.data;
                setUsers((currentUsers) => currentUsers.map((user) => (
                    String(userIdValue(user)) === String(userIdValue(updatedUser)) ? updatedUser : user
                )));
                setEditedUser(undefined);
                setSuccess(pl.usersManagement.messages.updateSuccess);
            })
            .catch(() => setError(pl.usersManagement.messages.updateError))
            .finally(() => setSaving(false));
    };

    const createUser = (request: CreateUserRequest) => {
        setSaving(true);
        setError("");
        UserManagementService.create(request)
            .then(() => {
                setCreateDialogOpen(false);
                setSuccess(pl.usersManagement.messages.createSuccess);
                loadUsers(false);
            })
            .catch(() => setError(pl.usersManagement.messages.createError))
            .finally(() => setSaving(false));
    };

    const saveRole = (role: UserRole) => {
        if (!roleUser) {
            return;
        }
        setSaving(true);
        setError("");
        UserManagementService.changeRole(userIdValue(roleUser), role)
            .then(() => {
                setRoleUser(undefined);
                setSuccess(pl.usersManagement.messages.roleSuccess);
                loadUsers(false);
            })
            .catch(() => setError(pl.usersManagement.messages.roleError))
            .finally(() => setSaving(false));
    };

    const savePermissions = (permissions: UserPermission[]) => {
        if (!permissionsUser) {
            return;
        }
        const assignedValues = new Set(permissionsUser.rolePermissions?.map((permission) => permission.role) || []);
        const assignedPermissions = permissionDefinitions
            .filter((permission) => assignedValues.has(permission.apiValue))
            .map((permission) => permission.key);
        const permissionsToAdd = permissions.filter((permission) => !assignedPermissions.includes(permission));
        const permissionsToRemove = assignedPermissions.filter((permission) => !permissions.includes(permission));
        const userId = userIdValue(permissionsUser);

        setSaving(true);
        setError("");
        Promise.all([
            ...permissionsToAdd.map((permission) => UserManagementService.addPermission(userId, permission)),
            ...permissionsToRemove.map((permission) => UserManagementService.removePermission(userId, permission)),
        ])
            .then(() => {
                setPermissionsUser(undefined);
                setSuccess(pl.usersManagement.messages.permissionsSuccess);
                loadUsers(false);
            })
            .catch(() => setError(pl.usersManagement.messages.permissionsError))
            .finally(() => setSaving(false));
    };

    const adminCount = users.filter((user) => user.role === "ADMIN").length;
    const managerCount = users.filter((user) => user.role === "MANAGER").length;

    return (
        <main className="users-page">
            <section className="users-header">
                <div className="users-heading">
                    <span>{pl.usersManagement.page.kicker}</span>
                    <Typography variant="h4">{pl.usersManagement.page.title}</Typography>
                    <p>{pl.usersManagement.page.subtitle}</p>
                </div>
                <div className="users-stats">
                    <div><PeopleAlt fontSize="small"/><span>{pl.usersManagement.stats.users}</span><strong>{users.length}</strong></div>
                    <div><AdminPanelSettings fontSize="small"/><span>{pl.usersManagement.stats.admins}</span><strong>{adminCount}</strong></div>
                    <div><ManageAccounts fontSize="small"/><span>{pl.usersManagement.stats.managers}</span><strong>{managerCount}</strong></div>
                </div>
            </section>

            {success ? <Alert severity="success">{success}</Alert> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}

            <section className="users-panel">
                <div className="users-toolbar">
                    <Typography variant="h5">{pl.usersManagement.page.listTitle}</Typography>
                    <div className="users-toolbar-actions">
                        <button className="users-primary-button" onClick={() => { setError(""); setCreateDialogOpen(true); }} type="button">
                            <Add fontSize="small"/>
                            {pl.usersManagement.actions.add}
                        </button>
                        <label className="users-search">
                            <Search fontSize="small"/>
                            <input
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={pl.usersManagement.page.search}
                                type="search"
                                value={query}
                            />
                        </label>
                        <button className="users-secondary-button" disabled={loading} onClick={() => loadUsers()} type="button">
                            <Refresh fontSize="small"/>
                            {pl.common.refresh}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="users-loader"><CircularProgress size={28}/><span>{pl.usersManagement.page.loading}</span></div>
                ) : (
                    <div className="users-table-wrap">
                        <table className="users-table">
                            <thead>
                            <tr>
                                <th>{pl.usersManagement.columns.user}</th>
                                <th>{pl.usersManagement.columns.username}</th>
                                <th>{pl.usersManagement.columns.email}</th>
                                <th>{pl.usersManagement.columns.department}</th>
                                <th>{pl.usersManagement.columns.language}</th>
                                <th>{pl.usersManagement.columns.role}</th>
                                <th>{pl.common.actions}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={String(userIdValue(user))}>
                                    <td>
                                        <span className="users-person-cell">
                                            <span className="users-avatar">{`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()}</span>
                                            <span><strong>{user.firstName} {user.lastName}</strong><small>#{String(userIdValue(user))}</small></span>
                                        </span>
                                    </td>
                                    <td>@{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{user.departmentCode}</td>
                                    <td>{pl.usersManagement.languages[user.language as keyof typeof pl.usersManagement.languages] || user.language}</td>
                                    <td><span className={`users-role users-role-${user.role.toLowerCase()}`}>{pl.usersManagement.roles[user.role]}</span></td>
                                    <td>
                                        <span className="users-actions">
                                            <button onClick={() => { setError(""); setEditedUser(user); }} type="button"><Edit fontSize="small"/>{pl.usersManagement.actions.edit}</button>
                                            <button onClick={() => { setError(""); setRoleUser(user); }} type="button"><ManageAccounts fontSize="small"/>{pl.usersManagement.actions.role}</button>
                                            <button onClick={() => { setError(""); setPermissionsUser(user); }} type="button"><VpnKey fontSize="small"/>{pl.usersManagement.actions.permissions}</button>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!filteredUsers.length ? (
                                <tr><td className="users-empty" colSpan={7}>{pl.usersManagement.page.empty}</td></tr>
                            ) : null}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <UserCreateDialog
                error={createDialogOpen ? error : ""}
                onClose={() => setCreateDialogOpen(false)}
                onSave={createUser}
                open={createDialogOpen}
                saving={saving}
            />
            <UserEditDialog
                error={editedUser ? error : ""}
                onClose={() => setEditedUser(undefined)}
                onSave={saveUser}
                open={Boolean(editedUser)}
                saving={saving}
                user={editedUser}
            />
            <UserRoleDialog
                error={roleUser ? error : ""}
                onClose={() => setRoleUser(undefined)}
                onSave={saveRole}
                open={Boolean(roleUser)}
                saving={saving}
                user={roleUser}
            />
            <UserPermissionsDialog
                error={permissionsUser ? error : ""}
                onClose={() => setPermissionsUser(undefined)}
                onSave={savePermissions}
                open={Boolean(permissionsUser)}
                saving={saving}
                user={permissionsUser}
            />
        </main>
    );
}

export default UsersPage;
