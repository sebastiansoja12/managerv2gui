import {useEffect, useState} from "react";
import {OrganizationChatGateway} from "./model/OrganizationChat";

export function useChatPresence(service: OrganizationChatGateway, identity: string) {
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setOnlineUserIds(new Set());
        if (!identity || !service.subscribeToPresence) {
            return;
        }
        return service.subscribeToPresence((userIds) => setOnlineUserIds(new Set(userIds)));
    }, [identity, service]);

    return onlineUserIds;
}
