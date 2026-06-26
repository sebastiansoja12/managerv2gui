import {act, renderHook} from "@testing-library/react";
import {useChatPresence} from "./useChatPresence";
import {OrganizationChatGateway} from "./model/OrganizationChat";

let emitPresence: ((onlineUserIds: string[]) => void) | undefined;
let unsubscribe: jest.Mock;
let service: OrganizationChatGateway;

beforeEach(() => {
    unsubscribe = jest.fn();
    emitPresence = undefined;
    service = {
        listActiveUsers: jest.fn(),
        getConversation: jest.fn(),
        sendMessage: jest.fn(),
        subscribeToPresence: jest.fn((listener) => {
            emitPresence = listener;
            return unsubscribe;
        }),
    };
});

test("updates presence only from WebSocket events", () => {
    const {result} = renderHook(() => useChatPresence(service, "organization:user"));

    act(() => emitPresence?.(["1", "2"]));

    expect(result.current).toEqual(new Set(["1", "2"]));
    expect(service.subscribeToPresence).toHaveBeenCalledTimes(1);
});

test("clears and unsubscribes presence after logout", () => {
    const {result, rerender} = renderHook(({identity}) => useChatPresence(service, identity), {
        initialProps: {identity: "organization:user"},
    });
    act(() => emitPresence?.(["2"]));

    rerender({identity: ""});

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(result.current.size).toBe(0);
});

test("does not subscribe without an authenticated identity", () => {
    renderHook(() => useChatPresence(service, ""));

    expect(service.subscribeToPresence).not.toHaveBeenCalled();
});
