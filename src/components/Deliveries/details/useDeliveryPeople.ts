import {useEffect, useState} from "react";
import CourierService from "../../../hooks/CourierService";
import UserManagementService from "../../../hooks/UserManagementService";
import {CourierDto} from "../../Couriers/dto/CourierDto";
import {User} from "../../Users/model/User";
import {courierCodeLabel, userLabel} from "./deliveryDetails";

type DeliveryPeople = {users: User[]; couriers: CourierDto[]};

// Users and couriers change rarely; every delivery view shares one load per page session.
let peopleRequest: Promise<DeliveryPeople> | null = null;

// Labels are a convenience: any failure leaves the raw ids on screen instead of breaking the view.
const safeList = <T, >(load: () => Promise<{data: T[]}> | undefined): Promise<T[]> => Promise.resolve()
    .then(load)
    .then((response) => (response && Array.isArray(response.data) ? response.data : []))
    .catch(() => []);

const loadPeople = () => {
    if (!peopleRequest) {
        peopleRequest = Promise.all([
            safeList<User>(() => UserManagementService.getAll()),
            safeList<CourierDto>(() => CourierService.getAll()),
        ]).then(([users, couriers]) => ({users, couriers}));
    }
    return peopleRequest;
};

export const useDeliveryPeople = () => {
    const [people, setPeople] = useState<DeliveryPeople>({users: [], couriers: []});

    useEffect(() => {
        let active = true;
        loadPeople().then((loaded) => {
            if (active) {
                setPeople(loaded);
            }
        });
        return () => {active = false;};
    }, []);

    return {
        userName: (userId?: string | null) => userLabel(people.users, userId),
        courierCode: (supplierId?: string | null) => courierCodeLabel(people.couriers, supplierId),
    };
};
