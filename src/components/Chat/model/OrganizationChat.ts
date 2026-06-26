import {UserRole} from "../../Users/model/User";

export type ChatAvailability = "ONLINE" | "OFFLINE";

export type OrganizationChatUser = {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    departmentCode: string;
    departmentName: string;
    organizationId?: string;
    role: UserRole;
    active: boolean;
    availability: ChatAvailability;
    unreadCount: number;
    lastMessage?: string;
    lastMessageAt?: string;
};

export type OrganizationChatMessage = {
    id: string;
    participantId: string;
    direction: "INCOMING" | "OUTGOING";
    body: string;
    sentAt: string;
    deliveryStatus: "SENT" | "DELIVERED" | "READ";
};

export type OrganizationChatMessageNotification = {
    participantId: string;
    message: OrganizationChatMessage;
};

/**
 * Boundary used by the UI. A backend adapter can implement this interface
 * without changing the chat component.
 */
export interface OrganizationChatGateway {
    listActiveUsers(): Promise<OrganizationChatUser[]>;
    getConversation(participantId: string): Promise<OrganizationChatMessage[]>;
    sendMessage(participantId: string, body: string): Promise<OrganizationChatMessage>;
    subscribeToMessages?(
        listener: (notification: OrganizationChatMessageNotification) => void,
    ): () => void;
    subscribeToPresence?(listener: (onlineUserIds: string[]) => void): () => void;
}
