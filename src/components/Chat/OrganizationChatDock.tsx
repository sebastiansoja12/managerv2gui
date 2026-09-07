import React, {FormEvent, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {ChatBubbleOutline, Close, ExpandMore, Send} from "components/ui/icons";
import OrganizationChatService from "../../hooks/OrganizationChatService";
import pl from "../../i18n/translate";
import {OrganizationChatGateway, OrganizationChatMessage, OrganizationChatUser} from "./model/OrganizationChat";
import {OpenOrganizationChat, useOrganizationChatDock} from "./ChatDockContext";
import "./styles/chat-dock.css";

type OrganizationChatDockProps = {
    service?: OrganizationChatGateway;
};

type ChatWindowProps = {
    chat: OpenOrganizationChat;
    liveMessages: OrganizationChatMessage[];
    service: OrganizationChatGateway;
    onClose: () => void;
    onToggle: () => void;
};

type IncomingChatNotification = {
    id: string;
    message: OrganizationChatMessage;
    user: OrganizationChatUser;
};

const EMPTY_MESSAGES: OrganizationChatMessage[] = [];

const fullName = (user: OrganizationChatUser) => `${user.firstName} ${user.lastName}`.trim();

const mergeMessages = (
    currentMessages: OrganizationChatMessage[],
    receivedMessages: OrganizationChatMessage[],
) => {
    const messagesById = new Map(currentMessages.map((message) => [message.id, message]));
    receivedMessages.forEach((message) => messagesById.set(message.id, message));
    return Array.from(messagesById.values()).sort((first, second) =>
        new Date(first.sentAt).getTime() - new Date(second.sentAt).getTime());
};

function ChatWindow({chat, liveMessages, service, onClose, onToggle}: ChatWindowProps) {
    const {user, minimized} = chat;
    const {onlineUserIds, markRead} = useOrganizationChatDock();
    const availability = onlineUserIds.has(user.id) ? "ONLINE" : "OFFLINE";
    const [messages, setMessages] = useState<OrganizationChatMessage[]>([]);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");

        service.getConversation(user.id)
            .then((conversation) => {
                if (active) {
                    setMessages((currentMessages) => mergeMessages(currentMessages, conversation));
                    setError("");
                }
            })
            .catch(() => {
                if (active) {
                    setError(pl.chat.errors.messages);
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
    }, [service, user.id]);

    useEffect(() => {
        setMessages((currentMessages) => mergeMessages(currentMessages, liveMessages));
    }, [liveMessages]);

    useEffect(() => {
        if (!minimized) {
            messagesEndRef.current?.scrollIntoView?.({behavior: "smooth", block: "end"});
        }
    }, [messages, minimized]);

    useEffect(() => {
        const readVisibleMessages = () => {
            if (!minimized && !loading && !error && document.visibilityState === "visible") {
                markRead(user.id);
            }
        };
        readVisibleMessages();
        document.addEventListener("visibilitychange", readVisibleMessages);
        return () => document.removeEventListener("visibilitychange", readVisibleMessages);
    }, [error, liveMessages, loading, markRead, minimized, user.id]);

    const formatTime = (value: string) => new Intl.DateTimeFormat(
        pl.common.locale,
        {hour: "2-digit", minute: "2-digit"},
    ).format(new Date(value));

    const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const body = draft.trim();
        if (!body || sending) {
            return;
        }

        setSending(true);
        setError("");
        try {
            const message = await service.sendMessage(user.id, body);
            setMessages((currentMessages) => mergeMessages(currentMessages, [message]));
            setDraft("");
        } catch {
            setError(pl.chat.errors.send);
        } finally {
            setSending(false);
        }
    };

    return (
        <section className={`chat-dock-window ${minimized ? "chat-dock-window-minimized" : ""}`}>
            <header className="chat-dock-window-header">
                <button
                    aria-label={(minimized ? pl.chat.conversation.expand : pl.chat.conversation.minimize)
                        .replace("{name}", fullName(user))}
                    className="chat-dock-person"
                    onClick={onToggle}
                    type="button"
                >
                    <span className="chat-dock-avatar">
                        {`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
                        <span
                            aria-hidden="true"
                            className={`chat-dock-presence chat-dock-presence-${availability.toLowerCase()}`}
                        />
                    </span>
                    <span>
                        <strong>{fullName(user)}</strong>
                        <small>{pl.chat.availability[availability]} · {user.departmentCode}</small>
                    </span>
                </button>
                <div className="chat-dock-controls">
                    <button
                        aria-label={(minimized ? pl.chat.conversation.expand : pl.chat.conversation.minimize)
                            .replace("{name}", fullName(user))}
                        onClick={onToggle}
                        type="button"
                    >
                        <ExpandMore className={minimized ? "chat-dock-expand-icon" : ""} fontSize="small" />
                    </button>
                    <button
                        aria-label={pl.chat.conversation.close.replace("{name}", fullName(user))}
                        onClick={onClose}
                        type="button"
                    >
                        <Close fontSize="small" />
                    </button>
                </div>
            </header>

            {!minimized ? (
                <>
                    <div className="chat-dock-messages" aria-live="polite">
                        {loading ? <div className="chat-dock-state">{pl.chat.conversation.loading}</div> : null}
                        {error ? <div className="chat-dock-error" role="alert">{error}</div> : null}
                        {!loading && !error && !messages.length ? (
                            <div className="chat-dock-state chat-dock-empty">
                                <ChatBubbleOutline fontSize="large" />
                                <strong>{pl.chat.conversation.emptyTitle}</strong>
                                <span>{pl.chat.conversation.emptyDescription.replace("{name}", user.firstName)}</span>
                            </div>
                        ) : null}
                        {!loading ? messages.map((message) => (
                            <div
                                className={`chat-dock-message-row ${message.direction === "OUTGOING" ? "chat-dock-message-outgoing" : ""}`}
                                key={message.id}
                            >
                                <div className="chat-dock-message-bubble">
                                    <p>{message.body}</p>
                                    <span>
                                        {message.direction === "OUTGOING" ? pl.chat.conversation.you : user.firstName}
                                        <time dateTime={message.sentAt}>{formatTime(message.sentAt)}</time>
                                    </span>
                                </div>
                            </div>
                        )) : null}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-dock-composer" onSubmit={sendMessage}>
                        <label>
                            <span>{pl.chat.conversation.messageLabel}</span>
                            <textarea
                                aria-label={`${pl.chat.conversation.messageLabel}: ${fullName(user)}`}
                                maxLength={2000}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && !event.shiftKey) {
                                        event.preventDefault();
                                        event.currentTarget.form?.requestSubmit();
                                    }
                                }}
                                placeholder={pl.chat.conversation.messagePlaceholder.replace("{name}", user.firstName)}
                                rows={1}
                                value={draft}
                            />
                        </label>
                        <button
                            aria-label={`${pl.chat.conversation.send}: ${fullName(user)}`}
                            disabled={!draft.trim() || sending}
                            type="submit"
                        >
                            <Send fontSize="small" />
                        </button>
                    </form>
                </>
            ) : null}
        </section>
    );
}

function OrganizationChatDock({service = OrganizationChatService}: OrganizationChatDockProps) {
    const {openChats, openChat, closeChat, toggleChat, recordMessage} = useOrganizationChatDock();
    const dockRef = useRef<HTMLDivElement>(null);
    const openChatsRef = useRef(openChats);
    const openChatRef = useRef(openChat);
    const [liveMessages, setLiveMessages] = useState<Record<string, OrganizationChatMessage[]>>({});
    const [notifications, setNotifications] = useState<IncomingChatNotification[]>([]);

    openChatsRef.current = openChats;
    openChatRef.current = openChat;

    useEffect(() => {
        let active = true;
        let usersPromise: Promise<OrganizationChatUser[]> | undefined;
        const unsubscribe = service.subscribeToMessages?.((notification) => {
            if (!recordMessage(notification)) {
                return;
            }
            setLiveMessages((currentMessages) => ({
                ...currentMessages,
                [notification.participantId]: mergeMessages(
                    currentMessages[notification.participantId] || [],
                    [notification.message],
                ),
            }));

            if (notification.message.direction !== "INCOMING") {
                return;
            }

            const showNotification = (user: OrganizationChatUser) => {
                setNotifications((currentNotifications) => [
                    ...currentNotifications.filter((item) => item.user.id !== user.id),
                    {id: notification.message.id, message: notification.message, user},
                ].slice(-3));
            };

            const openConversation = openChatsRef.current.find(
                (chat) => chat.user.id === notification.participantId,
            );
            if (openConversation) {
                showNotification(openConversation.user);
                return;
            }

            usersPromise ??= service.listActiveUsers();
            void usersPromise.then((users) => {
                if (!active) {
                    return;
                }
                const participant = users.find((user) => user.id === notification.participantId);
                if (participant) {
                    showNotification(participant);
                }
            }).catch(() => undefined);
        });

        return () => {
            active = false;
            unsubscribe?.();
        };
    }, [recordMessage, service]);

    useEffect(() => {
        dockRef.current?.scrollTo?.({left: dockRef.current.scrollWidth, behavior: "smooth"});
    }, [openChats.length]);

    const dismissNotification = (notificationId: string) => {
        setNotifications((currentNotifications) => currentNotifications.filter(
            (notification) => notification.id !== notificationId,
        ));
    };

    const openNotification = (notification: IncomingChatNotification) => {
        openChatRef.current(notification.user);
        dismissNotification(notification.id);
    };

    if (!openChats.length && !notifications.length) {
        return null;
    }

    const hasExpandedChat = openChats.some((chat) => !chat.minimized);

    return createPortal(
        <div className="chat-overlay">
            {notifications.length ? (
                <div
                    aria-label={pl.chat.notification.list}
                    aria-live="polite"
                    className={`chat-notification-stack ${hasExpandedChat
                        ? "chat-notification-stack-above-chat"
                        : openChats.length ? "chat-notification-stack-above-minimized-chat" : ""}`}
                >
                    {notifications.map((notification) => {
                        const name = fullName(notification.user);
                        return (
                            <article className="chat-notification" key={notification.id} role="status">
                                <button
                                    aria-label={pl.chat.notification.open.replace("{name}", name)}
                                    className="chat-notification-content"
                                    onClick={() => openNotification(notification)}
                                    type="button"
                                >
                                    <span className="chat-notification-avatar" aria-hidden="true">
                                        {`${notification.user.firstName.charAt(0)}${notification.user.lastName.charAt(0)}`.toUpperCase()}
                                    </span>
                                    <span className="chat-notification-copy">
                                        <small>{pl.chat.notification.title}</small>
                                        <strong>{name}</strong>
                                        <span>{notification.message.body}</span>
                                    </span>
                                </button>
                                <button
                                    aria-label={pl.chat.notification.dismiss.replace("{name}", name)}
                                    className="chat-notification-close"
                                    onClick={() => dismissNotification(notification.id)}
                                    type="button"
                                >
                                    <Close fontSize="small" />
                                </button>
                            </article>
                        );
                    })}
                </div>
            ) : null}
            {openChats.length ? (
                <div className="chat-dock" ref={dockRef} aria-label={pl.chat.conversation.openChats}>
                    {openChats.map((chat) => (
                        <ChatWindow
                            chat={chat}
                            key={chat.user.id}
                            liveMessages={liveMessages[chat.user.id] || EMPTY_MESSAGES}
                            onClose={() => closeChat(chat.user.id)}
                            onToggle={() => toggleChat(chat.user.id)}
                            service={service}
                        />
                    ))}
                </div>
            ) : null}
        </div>,
        document.body,
    );
}

export default OrganizationChatDock;
