import {useCallback, useEffect, useRef, useState} from "react";
import {copyText} from "../utils/copyText";

export const MASKED_SECRET = "********************************";

export default function useTemporarySecret() {
    const [secret, setSecret] = useState("");
    const [busy, setBusy] = useState(false);
    const requestVersion = useRef(0);
    const hideSecret = useCallback(() => {
        requestVersion.current += 1;
        setSecret("");
    }, []);

    useEffect(() => {
        const onVisibilityChange = () => { if (document.hidden) { hideSecret(); } };
        window.addEventListener("blur", hideSecret);
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => {
            requestVersion.current += 1;
            window.removeEventListener("blur", hideSecret);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [hideSecret]);

    useEffect(() => {
        if (!secret) { return; }
        const timeout = window.setTimeout(hideSecret, 5000);
        return () => window.clearTimeout(timeout);
    }, [secret, hideSecret]);

    const readSecret = async (fetchSecret: () => Promise<string>, copy = false): Promise<boolean> => {
        const request = ++requestVersion.current;
        setBusy(true);
        try {
            const value = secret || await fetchSecret();
            if (request !== requestVersion.current || document.hidden) { return false; }
            if (copy) {
                await copyText(value);
            } else {
                setSecret(value);
            }
            return request === requestVersion.current;
        } catch (error) {
            if (request !== requestVersion.current) { return false; }
            throw error;
        } finally {
            setBusy(false);
        }
    };

    return {secret, busy, hideSecret, readSecret};
}
