import {AreaPoint} from "../deliveryAreaGeometry";
import {DeliveryAreaDto, DeliveryAreaRequestDto} from "../dto/DeliveryAreaDto";

export type DeliveryArea = {
    id: string;
    deliveryAreaId: string | null;
    name: string;
    points: AreaPoint[];
};

export const deliveryAreasChangedEvent = "manager:delivery-areas-changed";

export const notifyDeliveryAreasChanged = () => window.dispatchEvent(new Event(deliveryAreasChangedEvent));

export const fromDeliveryAreaDto = (dto: DeliveryAreaDto): DeliveryArea => ({
    id: String(dto.deliveryAreaId),
    deliveryAreaId: String(dto.deliveryAreaId),
    name: dto.name,
    points: dto.points.map(({latitude, longitude}) => ({latitude, longitude})),
});

export const toDeliveryAreaRequest = (area: DeliveryArea): DeliveryAreaRequestDto => ({
    deliveryAreaId: area.deliveryAreaId,
    name: area.name,
    points: area.points,
});
