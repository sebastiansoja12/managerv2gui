import BackendClient from "../api/BackendClient";
import http from "../http-common";
import {
    CountryRequestApi,
    PersonApi,
    PersonType,
    ShipmentCreateRequestApi,
    ShipmentCreateResponseDto,
    ShipmentDeliveryRequestApiDto,
    ShipmentDto,
    ShipmentResponseInformation,
    ShipmentReturnRequestApi,
    ShipmentSearchRequestApi,
    ShipmentStatusRequestApi,
    ShipmentTypeDto,
    ShipmentUpdateRequestApi,
    SignatureChangeRequestApi,
    SignatureMethod,
} from "../components/Shipment/dto/ShipmentDto";

const client = new BackendClient(http);

const create = (data: ShipmentCreateRequestApi) => {
    return client.post<ShipmentCreateRequestApi, ShipmentCreateResponseDto>(
        "/shipments",
        data
    );
};

const search = (data: ShipmentSearchRequestApi) => {
    return client.post<ShipmentSearchRequestApi, ShipmentDto[]>("/shipments/search", data);
};

const get = async (shipmentId: number) => {
    try {
        return await client.get<ShipmentDto>(`/shipments/${shipmentId}`);
    } catch (error) {
        const apiError = error as { status?: number };
        if (apiError.status !== 404) {
            throw error;
        }

        const response = await search({
            shipmentId,
            page: 0,
            size: 1,
        });
        const shipment = response.data[0];
        if (!shipment) {
            throw error;
        }

        return {
            data: shipment,
            status: response.status,
        };
    }
};

const getByTrackingNumber = (trackingNumber: string) => {
    return client.get<ShipmentDto>(`/shipments/tracking-numbers/${trackingNumber}`);
};

const update = (data: ShipmentUpdateRequestApi) => {
    return client.put<ShipmentUpdateRequestApi, void>("/shipments", data);
};

const returnShipment = (data: ShipmentReturnRequestApi) => {
    return client.put<ShipmentReturnRequestApi, ShipmentResponseInformation>("/shipments/returns", data);
};

const deliverShipment = (data: ShipmentDeliveryRequestApiDto) => {
    return client.put<ShipmentDeliveryRequestApiDto, ShipmentResponseInformation>("/shipments/deliveries", data);
};

const updateStatus = (data: ShipmentStatusRequestApi) => {
    return client.put<ShipmentStatusRequestApi, ShipmentResponseInformation>("/shipments/status", data);
};

const changeSignature = (data: SignatureChangeRequestApi, signatureMethod: SignatureMethod) => {
    return client.put<SignatureChangeRequestApi, ShipmentResponseInformation>("/shipments/signature", data, {
        signatureMethod,
    });
};

const exists = (shipmentId: number) => {
    return client.get<boolean>(`/shipments/exists/${shipmentId}`);
};

const updatePerson = (shipmentId: number, personType: PersonType, data: PersonApi) => {
    return client.put<PersonApi, ShipmentResponseInformation>("/shipments/person", data, {
        shipmentId,
        personType,
    });
};

const updateCountries = (shipmentId: number, data: CountryRequestApi) => {
    return client.put<CountryRequestApi, ShipmentResponseInformation>("/shipments/countries", data, {
        shipmentId,
    });
};

const changeShipmentType = (shipmentId: number, shipmentType: ShipmentTypeDto) => {
    return client.put<undefined, ShipmentResponseInformation>("/shipments/shipment-type", undefined, {
        shipmentId,
        shipmentType,
    });
};

const ShipmentService = {
    create,
    get,
    search,
    getByTrackingNumber,
    update,
    returnShipment,
    deliverShipment,
    updateStatus,
    changeSignature,
    exists,
    updatePerson,
    updateCountries,
    changeShipmentType,
};

export default ShipmentService;
