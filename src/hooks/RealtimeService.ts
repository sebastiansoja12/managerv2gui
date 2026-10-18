import {Client, IMessage, StompSubscription} from "@stomp/stompjs";

type RealtimeListener = {
    onMessage: (message: IMessage) => void;
    onConnected?: () => void;
};

type DestinationState = {
    listeners: Set<RealtimeListener>;
    subscription?: StompSubscription;
};

export const realtimeWebSocketUrl = () => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || window.location.origin;
    const url = new URL(serverUrl, window.location.origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/chat/ws`;
    url.search = "";
    url.hash = "";
    return url.toString();
};

class RealtimeConnection {
    private client?: Client;
    private readonly destinations = new Map<string, DestinationState>();

    subscribe(destination: string, onMessage: (message: IMessage) => void, onConnected?: () => void) {
        const listener: RealtimeListener = {onMessage, onConnected};
        const state = this.destinations.get(destination) || {listeners: new Set<RealtimeListener>()};
        state.listeners.add(listener);
        this.destinations.set(destination, state);
        this.connect();
        if (this.client?.connected) {
            this.subscribeDestination(destination, state);
        }

        return () => {
            state.listeners.delete(listener);
            if (!state.listeners.size) {
                state.subscription?.unsubscribe();
                this.destinations.delete(destination);
            }
            this.releaseWhenUnused();
        };
    }

    private connect() {
        if (this.client?.active) {
            return;
        }
        const client = new Client({
            brokerURL: realtimeWebSocketUrl(),
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: () => undefined,
        });
        client.onConnect = () => {
            this.destinations.forEach((state, destination) => {
                state.subscription = undefined;
                this.subscribeDestination(destination, state);
                state.listeners.forEach((listener) => listener.onConnected?.());
            });
        };
        client.onWebSocketClose = () => {
            this.destinations.forEach((state) => {
                state.subscription = undefined;
            });
        };
        this.client = client;
        client.activate();
    }

    private subscribeDestination(destination: string, state: DestinationState) {
        if (state.subscription || !this.client?.connected) {
            return;
        }
        state.subscription = this.client.subscribe(destination, (message) => {
            state.listeners.forEach((listener) => listener.onMessage(message));
        });
    }

    private releaseWhenUnused() {
        if (this.destinations.size) {
            return;
        }
        const client = this.client;
        this.client = undefined;
        void client?.deactivate();
    }
}

const RealtimeService = new RealtimeConnection();

export default RealtimeService;
