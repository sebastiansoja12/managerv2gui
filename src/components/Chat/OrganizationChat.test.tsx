import React from "react";
import {act, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import pl from "../../i18n/translate";
import {
    OrganizationChatGateway,
    OrganizationChatMessage,
    OrganizationChatMessageNotification,
    OrganizationChatUser,
} from "./model/OrganizationChat";
import {OrganizationChatDockProvider} from "./ChatDockContext";
import OrganizationChat from "./OrganizationChat";
import OrganizationChatDock from "./OrganizationChatDock";

let mockOnlineUserIds = new Set(["user-1"]);
jest.mock("./useChatPresence", () => ({useChatPresence: () => mockOnlineUserIds}));

const activeUser: OrganizationChatUser = {
    id: "user-1",
    username: "marta.nowak",
    firstName: "Marta",
    lastName: "Nowak",
    departmentCode: "KRK-01",
    departmentName: "Kraków Południe",
    role: "MANAGER",
    active: true,
    availability: "ONLINE",
    unreadCount: 1,
};

const inactiveUser: OrganizationChatUser = {
    ...activeUser,
    id: "user-2",
    username: "jan.nieaktywny",
    firstName: "Jan",
    lastName: "Nieaktywny",
    active: false,
};

const secondActiveUser: OrganizationChatUser = {
    ...activeUser,
    id: "user-3",
    username: "piotr.zielinski",
    firstName: "Piotr",
    lastName: "Zieliński",
    departmentCode: "WAW-01",
    departmentName: "Warszawa Centralna",
    unreadCount: 0,
};

test("searches active organization users, opens a conversation and sends a message", async () => {
    const sentMessage: OrganizationChatMessage = {
        id: "message-1",
        participantId: activeUser.id,
        direction: "OUTGOING",
        body: "Czy transport jest gotowy?",
        sentAt: new Date().toISOString(),
        deliveryStatus: "SENT",
    };
    const service: OrganizationChatGateway = {
        listActiveUsers: jest.fn().mockResolvedValue([activeUser, secondActiveUser, inactiveUser]),
        getConversation: jest.fn().mockResolvedValue([]),
        sendMessage: jest.fn().mockResolvedValue(sentMessage),
    };

    render(
        <OrganizationChatDockProvider>
            <OrganizationChat service={service} />
            <OrganizationChatDock service={service} />
        </OrganizationChatDockProvider>,
    );

    expect(await screen.findByText("Marta Nowak")).toBeInTheDocument();
    expect(screen.queryByText("Jan Nieaktywny")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(pl.chat.search.label), {target: {value: "KRK-01"}});
    fireEvent.click(screen.getByRole("button", {name: /Marta Nowak/}));

    expect(await screen.findByText(pl.chat.conversation.emptyTitle)).toBeInTheDocument();
    expect(service.getConversation).toHaveBeenCalledWith(activeUser.id);

    fireEvent.change(screen.getByLabelText(`${pl.chat.conversation.messageLabel}: Marta Nowak`), {
        target: {value: sentMessage.body},
    });
    await act(async () => {
        fireEvent.click(screen.getByRole("button", {name: `${pl.chat.conversation.send}: Marta Nowak`}));
    });

    expect(service.sendMessage).toHaveBeenCalledWith(activeUser.id, sentMessage.body);
    expect(screen.getByText(sentMessage.body)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(pl.chat.search.label), {target: {value: ""}});
    fireEvent.click(screen.getByRole("button", {name: /Piotr Zieliński/}));

    expect(await screen.findByText(
        pl.chat.conversation.emptyDescription.replace("{name}", secondActiveUser.firstName),
    )).toBeInTheDocument();
    expect(service.getConversation).toHaveBeenCalledWith(secondActiveUser.id);
    expect(screen.getByLabelText(pl.chat.conversation.openChats)
        .querySelectorAll(".chat-dock-window")).toHaveLength(2);
});

test("shows an incoming notification and opens its chat on click", async () => {
    let socketListener: ((notification: OrganizationChatMessageNotification) => void) | undefined;
    const incomingMessage: OrganizationChatMessage = {
        id: "message-live-1",
        participantId: activeUser.id,
        direction: "INCOMING",
        body: "Wiadomość na żywo",
        sentAt: new Date().toISOString(),
        deliveryStatus: "SENT",
    };
    const service: OrganizationChatGateway = {
        listActiveUsers: jest.fn().mockResolvedValue([activeUser]),
        getConversation: jest.fn().mockResolvedValue([]),
        sendMessage: jest.fn(),
        subscribeToMessages: jest.fn().mockImplementation((listener) => {
            socketListener = listener;
            return jest.fn();
        }),
    };

    render(
        <OrganizationChatDockProvider>
            <OrganizationChatDock service={service} />
        </OrganizationChatDockProvider>,
    );

    await act(async () => {
        socketListener?.({participantId: activeUser.id, message: incomingMessage});
    });

    expect(await screen.findByText(pl.chat.notification.title)).toBeInTheDocument();
    expect(screen.getByText(incomingMessage.body)).toBeInTheDocument();
    expect(service.getConversation).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", {
        name: pl.chat.notification.open.replace("{name}", "Marta Nowak"),
    }));

    expect(await screen.findByText("Marta Nowak")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(pl.chat.conversation.loading)).not.toBeInTheDocument());
    expect(screen.queryByText(pl.chat.notification.title)).not.toBeInTheDocument();
    expect(service.getConversation).toHaveBeenCalledTimes(1);
});


test("shows real online status and counts only users reported present", async () => {
    const service: OrganizationChatGateway = {
        listActiveUsers: jest.fn().mockResolvedValue([activeUser, secondActiveUser]),
        getConversation: jest.fn(), sendMessage: jest.fn(),
    };
    const {rerender} = render(
        <OrganizationChatDockProvider><OrganizationChat service={service}/></OrganizationChatDockProvider>,
    );
    const first = await screen.findByRole("button", {name: /Marta Nowak/});
    const second = screen.getByRole("button", {name: /Piotr Zieliński/});

    expect(within(first).getByRole("img", {name: pl.chat.availability.ONLINE}))
        .toHaveClass("chat-directory-presence-online");
    expect(within(second).getByRole("img", {name: pl.chat.availability.OFFLINE}))
        .toHaveClass("chat-directory-presence-offline");
    expect(document.querySelector(".chat-active-users-summary strong")).toHaveTextContent("1");

    mockOnlineUserIds = new Set();
    rerender(<OrganizationChatDockProvider><OrganizationChat service={service}/></OrganizationChatDockProvider>);

    expect(within(first).getByRole("img", {name: pl.chat.availability.OFFLINE}))
        .toHaveClass("chat-directory-presence-offline");
    expect(document.querySelector(".chat-active-users-summary strong")).toHaveTextContent("0");
});

test("highlights unread tiles, deduplicates notifications and clears them when read", async () => {
    let receive: ((notification: OrganizationChatMessageNotification) => void) | undefined;
    const service: OrganizationChatGateway = {
        listActiveUsers: jest.fn().mockResolvedValue([{...activeUser, unreadCount: 0}]),
        getConversation: jest.fn().mockResolvedValue([]), sendMessage: jest.fn(),
        subscribeToMessages: (listener) => { receive = listener; return () => undefined; },
    };
    render(<OrganizationChatDockProvider>
        <OrganizationChat service={service}/><OrganizationChatDock service={service}/>
    </OrganizationChatDockProvider>);
    const tile = await screen.findByRole("button", {name: /Marta Nowak/});
    const notification: OrganizationChatMessageNotification = {
        participantId: activeUser.id,
        message: {id: "incoming-1", participantId: activeUser.id, direction: "INCOMING", body: "New message",
            sentAt: new Date().toISOString(), deliveryStatus: "SENT"},
    };

    await act(async () => { receive?.(notification); receive?.(notification); });

    expect(tile).toHaveClass("chat-directory-user-unread");
    expect(within(tile).getByLabelText(pl.chat.notification.unread.replace("{count}", "1"))).toBeInTheDocument();
    expect(within(tile).getByText("New message")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name: pl.chat.notification.dismiss.replace("{name}", "Marta Nowak")}));
    expect(tile).toHaveClass("chat-directory-user-unread");

    await act(async () => { fireEvent.click(tile); });
    await waitFor(() => expect(screen.queryByText(pl.chat.conversation.loading)).not.toBeInTheDocument());
    expect(tile).not.toHaveClass("chat-directory-user-unread");

    fireEvent.click(screen.getAllByRole("button", {name: pl.chat.conversation.minimize.replace("{name}", "Marta Nowak")})[0]);
    await act(async () => { receive?.({...notification, message: {...notification.message, id: "incoming-2"}}); });
    expect(tile).toHaveClass("chat-directory-user-unread");
});
