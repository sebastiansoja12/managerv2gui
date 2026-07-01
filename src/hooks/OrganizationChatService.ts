import {
    OrganizationChatGateway,
    OrganizationChatMessage,
    OrganizationChatMessageNotification,
    OrganizationChatUser,
} from "../components/Chat/model/OrganizationChat";
import {Client, IMessage, StompSubscription} from "@stomp/stompjs";
import JSONBig from "json-bigint";
import {User} from "../components/Users/model/User";
import {getAuthState} from "../auth/AuthState";
import http from "../http-common";
import {createChatClientId} from "../components/Chat/model/chatClientId";
import UserManagementService from "./UserManagementService";

type ApiIdentifier = number | string | {value: number | string};

type ChatConversationApi = {
    id: ApiIdentifier;
    participantUserId: ApiIdentifier;
    createdAt: string;
    lastMessageAt?: string;
};

type ChatMessageApi = {
    id: ApiIdentifier;
    conversationId: ApiIdentifier;
    senderUserId: ApiIdentifier;
    clientMessageId: string;
    body: string;
    sentAt: string;
};

type ChatMessageNotificationApi = {
    participantUserId: ApiIdentifier;
    message: ChatMessageApi;
};

type ChatPresenceNotificationApi = {
    onlineUserIds: ApiIdentifier[];
};

const websocketJson = JSONBig({storeAsString: true});

const identifierValue = (identifier: ApiIdentifier): number | string =>
    typeof identifier === "object" ? identifier.value : identifier;

const mapUser = (user: User): OrganizationChatUser => ({
    id: String(user.userId.value),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    departmentCode: user.departmentCode || "",
    departmentName: user.departmentCode || "",
    organizationId: user.operatorId?.value === undefined ? undefined : String(user.operatorId.value),
    role: user.role,
    active: !user.deleted,
    availability: "OFFLINE",
    unreadCount: 0,
});


const chatWebSocketUrl = () => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || window.location.origin;
    const url = new URL(serverUrl, window.location.origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/chat/ws`;
    url.search = "";
    url.hash = "";
    return url.toString();
};

class OrganizationChatServiceAdapter implements OrganizationChatGateway {
    private readonly conversationIds = new Map<string, string>();
    private readonly messageListeners = new Set<(
        notification: OrganizationChatMessageNotification,
    ) => void>();
    private readonly presenceListeners = new Set<(onlineUserIds: string[]) => void>();
    private socketClient?: Client;
    private messageSubscription?: StompSubscription;
    private presenceSubscription?: StompSubscription;

    async listActiveUsers(): Promise<OrganizationChatUser[]> {
        const response = await UserManagementService.getAll();
        const users = Array.isArray(response.data) ? response.data : [];
        return users.filter((user) => !user.deleted).map(mapUser);
    }

    async getConversation(participantId: string): Promise<OrganizationChatMessage[]> {
        const conversationId = await this.getOrCreateConversationId(participantId);
        const response = await http.get<ChatMessageApi[]>(
            `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
            {params: {limit: 100}},
        );
        return (Array.isArray(response.data) ? response.data : [])
            .map((message) => this.mapMessage(participantId, message));
    }

    async sendMessage(participantId: string, body: string): Promise<OrganizationChatMessage> {
        const conversationId = await this.getOrCreateConversationId(participantId);
        const response = await http.post<ChatMessageApi>(
            `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
            {
                clientMessageId: createChatClientId(),
                body: body.trim(),
            },
        );
        return this.mapMessage(participantId, response.data);
    }

    subscribeToMessages(listener: (notification: OrganizationChatMessageNotification) => void) {
        this.messageListeners.add(listener);
        this.connectSocket();
        this.subscribeSocketDestinations();

        return () => {
            this.messageListeners.delete(listener);
            if (!this.messageListeners.size) {
                this.messageSubscription?.unsubscribe();
                this.messageSubscription = undefined;
            }
            this.releaseSocketWhenUnused();
        };
    }

    subscribeToPresence(listener: (onlineUserIds: string[]) => void) {
        this.presenceListeners.add(listener);
        this.connectSocket();
        this.subscribeSocketDestinations();
        this.announcePresence();

        return () => {
            if (this.presenceListeners.size === 1) {
                this.publishPresence(false);
            }
            this.presenceListeners.delete(listener);
            if (!this.presenceListeners.size) {
                this.presenceSubscription?.unsubscribe();
                this.presenceSubscription = undefined;
            }
            this.releaseSocketWhenUnused();
        };
    }

    private connectSocket() {
        if (this.socketClient?.active) {
            return;
        }

        const client = new Client({
            brokerURL: chatWebSocketUrl(),
            reconnectDelay: 3000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: () => undefined,
        });
        client.onConnect = () => {
            this.subscribeSocketDestinations();
            this.announcePresence();
        };
        client.onDisconnect = () => this.clearSocketSubscriptions();
        client.onWebSocketClose = () => {
            this.clearSocketSubscriptions();
            this.emitPresence([]);
        };
        this.socketClient = client;
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
        window.addEventListener("online", this.handleOnline);
        window.addEventListener("offline", this.handleOffline);
        window.addEventListener("pagehide", this.handlePageHide);
        client.activate();
    }

    private subscribeSocketDestinations() {
        const client = this.socketClient;
        if (!client?.connected) {
            return;
        }
        if (this.messageListeners.size && !this.messageSubscription) {
            this.messageSubscription = client.subscribe(
                "/user/queue/chat/messages",
                (frame) => this.receiveSocketMessage(frame),
            );
        }
        if (this.presenceListeners.size && !this.presenceSubscription) {
            this.presenceSubscription = client.subscribe(
                "/user/queue/chat/presence",
                (frame) => this.receivePresence(frame),
            );
        }
    }

    private announcePresence() {
        this.publishPresence(document.visibilityState === "visible" && navigator.onLine);
    }

    private publishPresence(online: boolean) {
        if (!this.socketClient?.connected || !this.presenceListeners.size) {
            return;
        }
        this.socketClient.publish({destination: `/app/chat/presence/${online ? "online" : "offline"}`});
    }

    private readonly handleVisibilityChange = () => this.announcePresence();

    private readonly handleOnline = () => this.announcePresence();

    private readonly handleOffline = () => {
        this.publishPresence(false);
        this.emitPresence([]);
    };

    private readonly handlePageHide = () => this.publishPresence(false);

    private releaseSocketWhenUnused() {
        if (this.messageListeners.size || this.presenceListeners.size) {
            return;
        }
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        window.removeEventListener("online", this.handleOnline);
        window.removeEventListener("offline", this.handleOffline);
        window.removeEventListener("pagehide", this.handlePageHide);
        const client = this.socketClient;
        this.socketClient = undefined;
        this.clearSocketSubscriptions();
        void client?.deactivate();
    }

    private clearSocketSubscriptions() {
        this.messageSubscription = undefined;
        this.presenceSubscription = undefined;
    }

    private receiveSocketMessage(frame: IMessage) {
        const notification = websocketJson.parse(frame.body) as ChatMessageNotificationApi;
        const participantId = String(identifierValue(notification.participantUserId));
        const mappedNotification: OrganizationChatMessageNotification = {
            participantId,
            message: this.mapMessage(participantId, notification.message),
        };
        this.messageListeners.forEach((listener) => listener(mappedNotification));
    }

    private receivePresence(frame: IMessage) {
        const notification = websocketJson.parse(frame.body) as ChatPresenceNotificationApi;
        this.emitPresence(notification.onlineUserIds.map((userId) => String(identifierValue(userId))));
    }

    private emitPresence(onlineUserIds: string[]) {
        this.presenceListeners.forEach((listener) => listener(onlineUserIds));
    }

    private async getOrCreateConversationId(participantId: string): Promise<string> {
        const cachedId = this.conversationIds.get(participantId);
        if (cachedId) {
            return cachedId;
        }

        const response = await http.post<ChatConversationApi>(
            `/chat/conversations/direct/${encodeURIComponent(participantId)}`,
        );
        const conversationId = String(identifierValue(response.data.id));
        this.conversationIds.set(participantId, conversationId);
        return conversationId;
    }

    private mapMessage(participantId: string, message: ChatMessageApi): OrganizationChatMessage {
        const currentUserId = getAuthState().user?.userId?.value;
        return {
            id: String(identifierValue(message.id)),
            participantId,
            direction: String(identifierValue(message.senderUserId)) === String(currentUserId)
                ? "OUTGOING"
                : "INCOMING",
            body: message.body,
            sentAt: message.sentAt,
            deliveryStatus: "SENT",
        };
    }
}

const OrganizationChatService: OrganizationChatGateway = new OrganizationChatServiceAdapter();

export default OrganizationChatService;
