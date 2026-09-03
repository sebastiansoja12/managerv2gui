import {useEffect, useState} from "react";
import PickupPointService from "../../../hooks/PickupPointService";
import ShipmentService from "../../../hooks/ShipmentService";
import DeliveryService from "../../../hooks/DeliveryService";
import {PickupPointDetails} from "../../PickupPoints/model/PickupPoint";
import {ShipmentDto} from "../../Shipment/dto/ShipmentDto";
import {Delivery, DeliveryHistoryEntry, DeliveryRelation, DeliverySignature} from "../model/Delivery";

export type DeliveryContext = {
    shipment: ShipmentDto | null;
    signature: DeliverySignature | null;
    relations: DeliveryRelation[];
    history: DeliveryHistoryEntry[];
    pickupPoints: Record<string, PickupPointDetails>;
};

const emptyContext: DeliveryContext = {shipment: null, signature: null, relations: [], history: [], pickupPoints: {}};

const settle = <T, >(promise: Promise<{data: T}>, fallback: T): Promise<T> =>
    promise.then((response) => response.data ?? fallback).catch(() => fallback);

export const useDeliveryContext = (delivery: Delivery | null): DeliveryContext => {
    const [context, setContext] = useState<DeliveryContext>(emptyContext);

    useEffect(() => {
        let active = true;
        if (!delivery) {
            setContext(emptyContext);
            return () => {active = false;};
        }
        const pickupPointIds = Array.from(new Set([delivery.pickupPointId, delivery.deliveryPickupPointId]
            .filter((value): value is string => Boolean(value))));
        Promise.all([
            delivery.shipmentId
                ? settle<ShipmentDto | null>(ShipmentService.get(delivery.shipmentId), null)
                : Promise.resolve(null),
            delivery.steps.some((step) => step.signatureId)
                ? settle<DeliverySignature | null>(DeliveryService.getSignature(delivery.id), null)
                : Promise.resolve(null),
            settle<DeliveryRelation[]>(DeliveryService.getRelated(delivery.id), []),
            settle<DeliveryHistoryEntry[]>(DeliveryService.getHistory(delivery.id), []),
            Promise.all(pickupPointIds.map((id) => settle<PickupPointDetails | null>(PickupPointService.getById(id), null))),
        ]).then(([shipment, signature, relations, history, points]) => {
            if (!active) {
                return;
            }
            const pickupPoints = points.reduce<Record<string, PickupPointDetails>>((result, point) => {
                if (point) {
                    result[point.pickupPointId.value] = point;
                }
                return result;
            }, {});
            setContext({
                shipment,
                signature,
                relations: Array.isArray(relations) ? relations : [],
                history: Array.isArray(history) ? history : [],
                pickupPoints,
            });
        });
        return () => {active = false;};
    }, [delivery]);

    return context;
};
