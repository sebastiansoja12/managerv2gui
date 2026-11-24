import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {useAuthState} from "../../auth/AuthState";
import OperatorConfigurationService from "../../hooks/OperatorConfigurationService";

export const CAPABILITIES_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

type ReturnsStatus = "loading" | "available" | "unavailable";

type OperatorCapabilitiesContextValue = {
    returnsStatus: ReturnsStatus;
};

export const OperatorCapabilitiesContext = createContext<OperatorCapabilitiesContextValue>({
    returnsStatus: "unavailable",
});

export const useOperatorCapabilities = () => useContext(OperatorCapabilitiesContext);

export function OperatorCapabilitiesProvider({children}: {children: ReactNode}) {
    const {status, user} = useAuthState();
    const identity = status === "authenticated" && user?.operatorId
        ? `${user.operatorId.value}:${user.userId.value}` : "";
    const [capabilities, setCapabilities] = useState<{identity: string; returnsAvailable: boolean} | null>(null);

    useEffect(() => {
        if (!identity) {
            return undefined;
        }

        let active = true;
        let latestRequest = 0;
        let lastRequestedAt = 0;
        const loadCapabilities = () => {
            const request = ++latestRequest;
            lastRequestedAt = Date.now();
            OperatorConfigurationService.getCurrent()
                .then((response) => {
                    if (active && request === latestRequest) {
                        setCapabilities({
                            identity,
                            returnsAvailable: response.data?.shippingCapabilities?.supportsReturnShipments === true,
                        });
                    }
                })
                .catch(() => {
                    if (active && request === latestRequest) {
                        setCapabilities({identity, returnsAvailable: false});
                    }
                });
        };
        const refreshWhenStale = () => {
            if (document.visibilityState === "visible"
                && Date.now() - lastRequestedAt >= CAPABILITIES_REFRESH_INTERVAL_MS) {
                loadCapabilities();
            }
        };
        loadCapabilities();
        window.addEventListener("focus", refreshWhenStale);
        document.addEventListener("visibilitychange", refreshWhenStale);

        return () => {
            active = false;
            window.removeEventListener("focus", refreshWhenStale);
            document.removeEventListener("visibilitychange", refreshWhenStale);
        };
    }, [identity]);

    const returnsStatus: ReturnsStatus = !identity ? "unavailable"
        : capabilities?.identity !== identity ? "loading"
            : capabilities.returnsAvailable ? "available" : "unavailable";

    return (
        <OperatorCapabilitiesContext.Provider value={{returnsStatus}}>
            {children}
        </OperatorCapabilitiesContext.Provider>
    );
}
