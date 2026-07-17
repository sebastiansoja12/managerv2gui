import React, {useEffect, useMemo, useRef} from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Hub, Map as MapIcon} from "components/ui/icons";
import Department from "../../class/depots/Department";
import pl from "../../i18n/translate";
import {DepartmentRelation} from "../Departments/model/DepartmentRelation";

type DepartmentNetworkMapProps = {
    departmentCode: string;
    departments: Department[];
    loading: boolean;
    relations: DepartmentRelation[];
};

type DepartmentNetwork = {
    currentDepartment: Department | null;
    linkedDepartments: Department[];
    relations: DepartmentRelation[];
};

const DEFAULT_CENTER: L.LatLngExpression = [52.0693, 19.4803];
const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const getDepartmentCode = (department: Department) => department.departmentCode?.value || "";
const getDepartmentId = (department: Department) => String(department.departmentId);
const getDepartmentPosition = (department: Department): [number, number] | null => {
    const latitude = department.coordinates?.latitude;
    const longitude = department.coordinates?.longitude;
    return Number.isFinite(latitude) && Number.isFinite(longitude)
        ? [latitude as number, longitude as number]
        : null;
};

export const getDepartmentNetwork = (
    departmentCode: string,
    departments: Department[],
    relations: DepartmentRelation[],
): DepartmentNetwork => {
    const currentDepartment = departments.find(
        (department) => getDepartmentCode(department) === departmentCode,
    ) || null;
    if (!currentDepartment) {
        return {currentDepartment: null, linkedDepartments: [], relations: []};
    }

    const currentDepartmentId = getDepartmentId(currentDepartment);
    const directRelations = relations.filter((relation) => (
        relation.sourceDepartmentId === currentDepartmentId
        || relation.targetDepartmentId === currentDepartmentId
    ));
    const linkedDepartmentIds = new Set(directRelations.map((relation) => (
        relation.sourceDepartmentId === currentDepartmentId
            ? relation.targetDepartmentId
            : relation.sourceDepartmentId
    )));

    return {
        currentDepartment,
        linkedDepartments: departments.filter(
            (department) => linkedDepartmentIds.has(getDepartmentId(department)),
        ),
        relations: directRelations,
    };
};

const createPopup = (department: Department, current: boolean) => {
    const popup = document.createElement("div");
    popup.className = "home-network-popup";

    const role = document.createElement("span");
    role.textContent = current
        ? pl.home.dashboard.network.currentDepartment
        : pl.home.dashboard.network.connectedDepartment;
    popup.appendChild(role);

    const code = document.createElement("strong");
    code.textContent = getDepartmentCode(department);
    popup.appendChild(code);

    const city = document.createElement("small");
    city.textContent = department.address?.city || pl.common.dash;
    popup.appendChild(city);

    return popup;
};

function DepartmentNetworkMap({
    departmentCode,
    departments,
    loading,
    relations,
}: DepartmentNetworkMapProps) {
    const mapElementRef = useRef<HTMLDivElement | null>(null);
    const network = useMemo(
        () => getDepartmentNetwork(departmentCode, departments, relations),
        [departmentCode, departments, relations],
    );
    const mappedCurrentDepartment = useMemo(
        () => network.currentDepartment
            ? getDepartmentPosition(network.currentDepartment)
            : null,
        [network.currentDepartment],
    );
    const mappedLinkedDepartments = useMemo(
        () => network.linkedDepartments.filter(getDepartmentPosition),
        [network.linkedDepartments],
    );
    const tileUrl = process.env.REACT_APP_MAP_TILE_URL || DEFAULT_TILE_URL;
    const tileAttribution = process.env.REACT_APP_MAP_TILE_ATTRIBUTION || DEFAULT_ATTRIBUTION;

    useEffect(() => {
        if (!mapElementRef.current || !network.currentDepartment || !mappedCurrentDepartment) {
            return undefined;
        }

        const map = L.map(mapElementRef.current, {
            attributionControl: true,
            scrollWheelZoom: false,
            zoomAnimation: false,
            fadeAnimation: false,
            markerZoomAnimation: false,
        }).setView(DEFAULT_CENTER, 6);
        L.tileLayer(tileUrl, {attribution: tileAttribution}).addTo(map);

        const departmentsById = new Map(departments.map((department) => [getDepartmentId(department), department]));
        network.relations.forEach((relation) => {
            const source = departmentsById.get(relation.sourceDepartmentId);
            const target = departmentsById.get(relation.targetDepartmentId);
            const sourcePosition = source ? getDepartmentPosition(source) : null;
            const targetPosition = target ? getDepartmentPosition(target) : null;
            if (!sourcePosition || !targetPosition) {
                return;
            }

            L.polyline([sourcePosition, targetPosition], {
                className: "home-network-line",
                color: "#1b8fe0",
                dashArray: "7 8",
                opacity: 0.82,
                weight: 3,
            }).addTo(map);
        });

        const visibleDepartments = [network.currentDepartment, ...mappedLinkedDepartments];
        const visiblePositions: [number, number][] = [];
        visibleDepartments.forEach((department) => {
            const position = getDepartmentPosition(department);
            if (!position) {
                return;
            }
            visiblePositions.push(position);
            const current = getDepartmentId(department) === getDepartmentId(network.currentDepartment as Department);
            L.circleMarker(position, {
                className: current ? "home-network-marker-current" : "home-network-marker-linked",
                color: current ? "#ffffff" : "#dbeafe",
                fillColor: current ? "#f59e0b" : "#146cc3",
                fillOpacity: 1,
                radius: current ? 11 : 8,
                weight: current ? 4 : 3,
            })
                .bindPopup(createPopup(department, current))
                .bindTooltip(getDepartmentCode(department), {
                    className: "home-network-tooltip",
                    direction: "top",
                    offset: [0, -8],
                    permanent: current,
                })
                .addTo(map);
        });

        if (visiblePositions.length > 1) {
            map.fitBounds(L.latLngBounds(visiblePositions), {padding: [34, 34], maxZoom: 8});
        } else {
            map.setView(mappedCurrentDepartment, 8);
        }

        let mapActive = true;
        const invalidateSizeTimer = window.setTimeout(() => {
            const mapContainer = mapElementRef.current;
            if (mapActive && mapContainer?.isConnected && map.getContainer() === mapContainer) {
                map.invalidateSize({pan: false});
            }
        }, 0);

        return () => {
            mapActive = false;
            window.clearTimeout(invalidateSizeTimer);
            map.stop();
            map.off();
            map.remove();
        };
    }, [departments, mappedCurrentDepartment, mappedLinkedDepartments, network, tileAttribution, tileUrl]);

    const emptyMessage = !network.currentDepartment
        ? pl.home.dashboard.network.departmentUnavailable
        : !mappedCurrentDepartment
            ? pl.home.dashboard.network.coordinatesUnavailable
            : pl.home.dashboard.network.empty;

    return (
        <section className="home-panel home-network-panel" aria-label={pl.home.dashboard.network.title}>
            <header className="home-panel-header">
                <div>
                    <span className="home-panel-kicker"><Hub fontSize="small" />{pl.home.dashboard.network.kicker}</span>
                    <h2>{pl.home.dashboard.network.title}</h2>
                </div>
                <span className="home-network-count">
                    <strong>{network.linkedDepartments.length}</strong>
                    {pl.home.dashboard.network.connections}
                </span>
            </header>
            <div className="home-network-map-shell">
                {loading ? <div className="home-dashboard-skeleton home-network-skeleton" /> : undefined}
                {!loading && (!network.currentDepartment || !mappedCurrentDepartment) ? (
                    <div className="home-network-empty">
                        <MapIcon fontSize="large" />
                        <strong>{emptyMessage}</strong>
                    </div>
                ) : undefined}
                <div
                    aria-hidden={!network.currentDepartment || !mappedCurrentDepartment}
                    className="home-network-map"
                    ref={mapElementRef}
                />
                {!loading && network.currentDepartment && mappedCurrentDepartment && !network.relations.length ? (
                    <span className="home-network-map-note">{emptyMessage}</span>
                ) : undefined}
            </div>
            <footer className="home-network-legend">
                <span><i className="is-current" />{pl.home.dashboard.network.currentDepartment}</span>
                <span><i />{pl.home.dashboard.network.connectedDepartment}</span>
            </footer>
        </section>
    );
}

export default DepartmentNetworkMap;
