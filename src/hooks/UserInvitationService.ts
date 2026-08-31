import BackendClient from "../api/BackendClient";
import http from "../http-public";
import {AcceptUserInvitationRequest, UserInvitation} from "../components/SetPassword/dto/UserInvitation";

const client = new BackendClient(http);

const verify = (token: string) => (
    client.post<{token: string}, UserInvitation>("/auth/invitations/verify", {token})
);

const accept = (request: AcceptUserInvitationRequest) => (
    client.post<AcceptUserInvitationRequest, undefined>("/auth/invitations/accept", request)
);

const UserInvitationService = {
    verify,
    accept,
};

export default UserInvitationService;
