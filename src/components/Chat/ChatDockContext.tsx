import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {useAuthState} from "../../auth/AuthState";
import OrganizationChatService from "../../hooks/OrganizationChatService";
import {OrganizationChatGateway, OrganizationChatMessageNotification, OrganizationChatUser} from "./model/OrganizationChat";
import {useChatPresence} from "./useChatPresence";

export type OpenOrganizationChat = {
    user: OrganizationChatUser;
    minimized: boolean;
};

type ChatSummary = {
    unreadCount: number;
    lastMessage?: string;
    lastMessageAt?: string;
};

type ChatDockContextValue = {
    openChats: OpenOrganizationChat[];
    summaries: Record<string, ChatSummary>;
    onlineUserIds: Set<string>;
    recordMessage: (notification: OrganizationChatMessageNotification) => boolean;
    markRead: (userId: string) => void;
    openChat: (user: OrganizationChatUser) => void;
    closeChat: (userId: string) => void;
    toggleChat: (userId: string) => void;
};

const ChatDockContext = createContext<ChatDockContextValue | null>(null);

export function OrganizationChatDockProvider({children, service = OrganizationChatService}: {
    children: ReactNode;
    service?: OrganizationChatGateway;
}) {
    const {user, status} = useAuthState();
    const identity = status === "authenticated" && user
        ? `${user.operatorId?.value}:${user.userId.value}` : "";
    const onlineUserIds = useChatPresence(service, identity);
    const [openChats, setOpenChats] = useState<OpenOrganizationChat[]>([]);
    const [summaries, setSummaries] = useState<Record<string, ChatSummary>>({});
    const seenMessageIds = useRef(new Set<string>());

    useEffect(() => {
        setOpenChats([]);
        setSummaries({});
        seenMessageIds.current.clear();
    }, [identity]);

    const recordMessage = useCallback((notification: OrganizationChatMessageNotification) => {
        const {message, participantId} = notification;
        if (seenMessageIds.current.has(message.id)) {
            return false;
        }
        seenMessageIds.current.add(message.id);
        setSummaries((current) => ({
            ...current,
            [participantId]: {
                unreadCount: (current[participantId]?.unreadCount || 0) + (message.direction === "INCOMING" ? 1 : 0),
                lastMessage: message.body,
                lastMessageAt: message.sentAt,
            },
        }));
        return true;
    }, []);

    const markRead = useCallback((userId: string) => {
        setSummaries((current) => current[userId]?.unreadCount === 0 ? current : {
            ...current,
            [userId]: {...current[userId], unreadCount: 0},
        });
    }, []);

    const value = useMemo<ChatDockContextValue>(() => ({
        openChats,
        summaries,
        onlineUserIds,
        recordMessage,
        markRead,
        openChat: (chatUser) => {
            setOpenChats((currentChats) => {
                const remainingChats = currentChats.filter((chat) => chat.user.id !== chatUser.id);
                return [...remainingChats, {user: chatUser, minimized: false}];
            });
        },
        closeChat: (userId) => {
            setOpenChats((currentChats) => currentChats.filter((chat) => chat.user.id !== userId));
        },
        toggleChat: (userId) => {
            setOpenChats((currentChats) => currentChats.map((chat) => chat.user.id === userId
                ? {...chat, minimized: !chat.minimized}
                : chat));
        },
    }), [openChats, summaries, onlineUserIds, recordMessage, markRead]);

    return <ChatDockContext.Provider value={value}>{children}</ChatDockContext.Provider>;
}

export const useOrganizationChatDock = () => {
    const context = useContext(ChatDockContext);
    if (!context) {
        throw new Error("useOrganizationChatDock must be used inside OrganizationChatDockProvider");
    }
    return context;
};
