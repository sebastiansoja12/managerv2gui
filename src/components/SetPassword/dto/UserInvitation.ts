export interface UserInvitation {
    username: string;
    expiresAt: string;
}

export interface AcceptUserInvitationRequest {
    token: string;
    password: string;
}

export type UserInvitationErrorCode = "INVITATION_NOT_FOUND" | "EXPIRED" | "ALREADY_ACCEPTED" | "WEAK_PASSWORD";
