import OrganizationChatService from "./OrganizationChatService";
import UserManagementService from "./UserManagementService";
import {User} from "../components/Users/model/User";
import http from "../http-common";

jest.mock("../http-common", () => ({
    __esModule: true,
    default: {
        request: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
    },
}));

jest.mock("../auth/AuthState", () => ({
    getAuthState: () => ({user: {userId: {value: 1}}}),
}));

jest.mock("./UserManagementService", () => ({
    __esModule: true,
    default: {
        getAll: jest.fn(),
    },
}));

const user = (id: number, deleted = false): User => ({
    userId: {value: id},
    username: `user.${id}`,
    firstName: "Jan",
    lastName: `Testowy ${id}`,
    email: `user.${id}@example.com`,
    role: "USER",
    departmentCode: "WAW-01",
    language: "pl",
    deleted,
    operatorId: {value: 42},
    rolePermissions: [],
});
test("loads real active users from the organization user API", async () => {
    (UserManagementService.getAll as jest.Mock).mockResolvedValue({
        data: [user(1), user(2, true)],
    });

    const result = await OrganizationChatService.listActiveUsers();

    expect(UserManagementService.getAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
        expect.objectContaining({
            id: "1",
            username: "user.1",
            organizationId: "42",
            departmentCode: "WAW-01",
            active: true,
            availability: "OFFLINE",
        }),
    ]);
});

test("opens a persistent conversation and maps its REST message history", async () => {
    (http.post as jest.Mock).mockResolvedValueOnce({
        data: {id: 71, participantUserId: 8, createdAt: "2026-09-07T18:00:00Z"},
    });
    (http.get as jest.Mock).mockResolvedValueOnce({
        data: [{
            id: 91,
            conversationId: 71,
            senderUserId: {value: 8},
            clientMessageId: "e83086ad-8492-4750-96e7-62b397c85f61",
            body: "Wiadomość z backendu",
            sentAt: "2026-09-07T18:01:00Z",
        }],
    });

    const messages = await OrganizationChatService.getConversation("8");

    expect(http.post).toHaveBeenCalledWith("/chat/conversations/direct/8");
    expect(http.get).toHaveBeenCalledWith("/chat/conversations/71/messages", {params: {limit: 100}});
    expect(messages).toEqual([
        expect.objectContaining({
            id: "91",
            participantId: "8",
            direction: "INCOMING",
            body: "Wiadomość z backendu",
        }),
    ]);
});

test("sends a message through the persistent conversation REST API", async () => {
    (http.post as jest.Mock)
        .mockResolvedValueOnce({
            data: {id: 72, participantUserId: 9, createdAt: "2026-09-07T18:00:00Z"},
        })
        .mockResolvedValueOnce({
            data: {
                id: 92,
                conversationId: 72,
                senderUserId: {value: 1},
                clientMessageId: "a74a899c-e906-4839-b736-8eaa7669f88c",
                body: "Wiadomość do zapisania",
                sentAt: "2026-09-07T18:02:00Z",
            },
        });

    const message = await OrganizationChatService.sendMessage("9", "Wiadomość do zapisania");

    expect(http.post).toHaveBeenCalledWith("/chat/conversations/direct/9");
    expect(http.post).toHaveBeenCalledWith(
        "/chat/conversations/72/messages",
        expect.objectContaining({
            clientMessageId: expect.stringMatching(/^[0-9a-f-]{36}$/),
            body: "Wiadomość do zapisania",
        }),
    );
    expect(message).toEqual(expect.objectContaining({
        id: "92",
        direction: "OUTGOING",
        body: "Wiadomość do zapisania",
    }));
});
