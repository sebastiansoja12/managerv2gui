export interface PostalCodeDto {
    countryCode: string;
    postalCode: string;
    city: string;
    regionCode: string | null;
    latitude: number | null;
    longitude: number | null;
}
