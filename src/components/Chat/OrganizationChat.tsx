import React, {FormEvent, useEffect, useMemo, useState} from "react";
import {ChatBubbleOutline, PeopleAlt, Search} from "components/ui/icons";
import {useAuthState} from "../../auth/AuthState";
import OrganizationChatService from "../../hooks/OrganizationChatService";
import pl from "../../i18n/translate";
import {useOrganizationChatDock} from "./ChatDockContext";
import {OrganizationChatGateway, OrganizationChatUser} from "./model/OrganizationChat";
import "./styles/chat.css";

type ChatFilter = "ALL" | "SAME_DEPARTMENT" | "OTHER_DEPARTMENTS";

type OrganizationChatProps = {
    service?: OrganizationChatGateway;
};

const fullName = (user: OrganizationChatUser) => `${user.firstName} ${user.lastName}`.trim();
const departmentLabel = (user: OrganizationChatUser) => user.departmentName
    && user.departmentName !== user.departmentCode
    ? `${user.departmentCode} · ${user.departmentName}`
    : user.departmentCode;

function OrganizationChat({service = OrganizationChatService}: OrganizationChatProps) {
    const {user: currentUser} = useAuthState();
    const {openChats, openChat, summaries, onlineUserIds} = useOrganizationChatDock();
    const [users, setUsers] = useState<OrganizationChatUser[]>([]);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<ChatFilter>("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const currentDepartmentCode = currentUser?.departmentCode || "";
    const currentUserId = currentUser?.userId?.value === undefined ? "" : String(currentUser.userId.value);
    const currentOrganizationId = currentUser?.operatorId?.value === undefined
        ? ""
        : String(currentUser.operatorId.value);
    const openChatIds = useMemo(() => new Set(openChats.map((chat) => chat.user.id)), [openChats]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");
        service.listActiveUsers()
            .then((activeUsers) => {
                if (active) {
                    setUsers(activeUsers.filter((user) => user.active
                        && user.id !== currentUserId
                        && (!currentOrganizationId || user.organizationId === currentOrganizationId)));
                }
            })
            .catch(() => {
                if (active) {
                    setError(pl.chat.errors.users);
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
    }, [currentOrganizationId, currentUserId, service]);

    const filteredUsers = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase(pl.common.locale);
        return users.filter((user) => {
            const matchesDepartment = filter === "ALL"
                || (filter === "SAME_DEPARTMENT" && user.departmentCode === currentDepartmentCode)
                || (filter === "OTHER_DEPARTMENTS" && user.departmentCode !== currentDepartmentCode);
            if (!matchesDepartment) {
                return false;
            }

            return !normalizedQuery || [
                fullName(user),
                user.username,
                user.departmentCode,
                user.departmentName,
            ].some((value) => value.toLocaleLowerCase(pl.common.locale).includes(normalizedQuery));
        });
    }, [currentDepartmentCode, filter, query, users]);

    const openUserChat = (user: OrganizationChatUser) => {
        openChat(user);
    };

    const openFirstSearchResult = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (filteredUsers[0]) {
            openUserChat(filteredUsers[0]);
        }
    };

    return (
        <main className="organization-chat-page">
            <header className="chat-page-header">
                <div>
                    <span>{pl.chat.page.kicker}</span>
                    <h1>{pl.chat.page.title}</h1>
                    <p>{pl.chat.page.subtitle}</p>
                </div>
                <div className="chat-active-users-summary">
                    <PeopleAlt fontSize="small" />
                    <span>{pl.chat.page.activeUsers}</span>
                    <strong>{users.filter((user) => onlineUserIds.has(user.id)).length}</strong>
                </div>
            </header>

            <section className="chat-directory">
                <div className="chat-directory-toolbar">
                    <div>
                        <span>{pl.chat.contacts.kicker}</span>
                        <strong>{pl.chat.contacts.title}</strong>
                    </div>
                    <form className="chat-search" onSubmit={openFirstSearchResult}>
                        <Search fontSize="small" />
                        <input
                            aria-label={pl.chat.search.label}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={pl.chat.search.placeholder}
                            type="search"
                            value={query}
                        />
                    </form>
                    <div className="chat-filters" role="group" aria-label={pl.chat.filters.ariaLabel}>
                        {([
                            ["ALL", pl.chat.filters.all],
                            ["SAME_DEPARTMENT", pl.chat.filters.sameDepartment],
                            ["OTHER_DEPARTMENTS", pl.chat.filters.otherDepartments],
                        ] as Array<[ChatFilter, string]>).map(([value, label]) => (
                            <button
                                aria-pressed={filter === value}
                                className={filter === value ? "chat-filter-active" : ""}
                                key={value}
                                onClick={() => setFilter(value)}
                                type="button"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="chat-directory-results" aria-live="polite">
                    {loading ? <div className="chat-directory-state">{pl.common.loading}</div> : null}
                    {error ? <div className="chat-directory-state chat-directory-error">{error}</div> : null}
                    {!loading && !error && !filteredUsers.length ? (
                        <div className="chat-directory-state">
                            <Search fontSize="large" />
                            <strong>{pl.chat.contacts.emptyTitle}</strong>
                            <span>{pl.chat.contacts.emptyDescription}</span>
                        </div>
                    ) : null}
                    {!loading && !error ? filteredUsers.map((user) => {
                        const isOpen = openChatIds.has(user.id);
                        const unreadCount = summaries[user.id]?.unreadCount ?? user.unreadCount;
                        const availability = onlineUserIds.has(user.id) ? "ONLINE" : "OFFLINE";
                        return (
                            <button
                                aria-pressed={isOpen}
                                className={`chat-directory-user ${isOpen ? "chat-directory-user-open" : ""} ${unreadCount ? "chat-directory-user-unread" : ""}`}
                                key={user.id}
                                onClick={() => openUserChat(user)}
                                type="button"
                            >
                                <span className="chat-directory-avatar">
                                    {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
                                    <span
                                        role="img"
                                        aria-label={pl.chat.availability[availability]}
                                        title={pl.chat.availability[availability]}
                                        className={`chat-directory-presence chat-directory-presence-${availability.toLowerCase()}`}
                                    />
                                </span>
                                <span className="chat-directory-user-main">
                                    <span className="chat-directory-name-row">
                                        <strong>{fullName(user)}</strong>
                                        {unreadCount ? <span className="chat-unread-count"
                                            aria-label={pl.chat.notification.unread.replace("{count}", String(unreadCount))}>
                                            {unreadCount}
                                        </span> : null}
                                    </span>
                                    <span className="chat-directory-department">{departmentLabel(user)}</span>
                                    <span className="chat-directory-preview">{summaries[user.id]?.lastMessage || user.lastMessage || pl.chat.contacts.noMessages}</span>
                                </span>
                                <span className="chat-directory-action">
                                    <ChatBubbleOutline fontSize="small" />
                                    {isOpen ? pl.chat.conversation.opened : pl.chat.conversation.open}
                                </span>
                            </button>
                        );
                    }) : null}
                </div>
            </section>
        </main>
    );
}

export default OrganizationChat;
