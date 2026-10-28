import {ShipmentStatusDto} from "../../Shipment/dto/ShipmentDto";

export type ShipmentEditParty = {
    firstName: string;
    lastName: string;
    email: string;
    telephoneNumber: string;
    city: string;
    postalCode: string;
    street: string;
    countryCode?: string;
};

export type ShipmentEditSummary = {
    trackingNumber: string;
    status: ShipmentStatusDto;
    reroutable: boolean;
    maskedEmail: string | null;
};

export type ShipmentEditTokenIssued = {
    maskedEmail: string | null;
    expiresAt: string;
};

export type ShipmentEditDetails = {
    trackingNumber: string;
    status: ShipmentStatusDto;
    reroutable: boolean;
    sender: ShipmentEditParty;
    recipient: ShipmentEditParty;
    tokenExpiresAt: string | null;
};

export type ShipmentEditAccepted = {
    trackingNumber: string;
    requestedAt: string;
};

export type ShipmentEditRequest = {
    token: string;
    sender: ShipmentEditParty;
    recipient: ShipmentEditParty;
};

export const shipmentEditPartyFields: Array<keyof ShipmentEditParty> = [
    "firstName",
    "lastName",
    "email",
    "telephoneNumber",
    "street",
    "postalCode",
    "city",
];
