import BackendClient from "../api/BackendClient";
import {GenerateMcpKeyRequest, GeneratedMcpKey, McpAccessPolicy, McpKey} from "../components/Mcp/model/McpAccess";
import http from "../http-common";

const client = new BackendClient(http);
const ownKeysPath = "/auth/me/mcp-keys";
const userPath = (userId: string | number) => `/users/${encodeURIComponent(String(userId))}`;

const McpService = {
    listKeys: () => client.get<McpKey[]>(ownKeysPath),
    ownAccess: () => client.get<McpAccessPolicy>(`${ownKeysPath}/access`),
    generateKey: (request: GenerateMcpKeyRequest) =>
        client.post<GenerateMcpKeyRequest, GeneratedMcpKey>(ownKeysPath, request),
    revealKey: (keyId: string) => client.post<undefined, {key: string}>(`${ownKeysPath}/${encodeURIComponent(keyId)}/reveal`, undefined),
    revokeKey: (keyId: string) => client.delete<undefined, void>(`${ownKeysPath}/${encodeURIComponent(keyId)}`, undefined),
    getAccess: (userId: string | number) => client.get<McpAccessPolicy>(`${userPath(userId)}/mcp-access`),
    updateAccess: (userId: string | number, policy: McpAccessPolicy) =>
        client.put<McpAccessPolicy, void>(`${userPath(userId)}/mcp-access`, policy),
    revokeUserKeys: (userId: string | number) => client.delete<undefined, void>(`${userPath(userId)}/mcp-keys`, undefined),
};

export default McpService;
