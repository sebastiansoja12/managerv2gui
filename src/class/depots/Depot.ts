import DepotCode from "./DepotCode";

export default interface Depot {
    depotCode: DepotCode;
    city: string;
    street: string;
    country: string;
    postalCode:string;
    telephoneNumber:string;
    nip:string;
    openingHours:string;
}
