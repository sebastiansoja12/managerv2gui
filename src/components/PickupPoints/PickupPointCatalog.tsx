import React, {FormEvent, useCallback, useEffect, useRef, useState} from "react";
import {
    Alert,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from "components/ui";
import {Add, Edit, LocationOn, Refresh, Search} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import Department from "../../class/depots/Department";
import DepartmentService from "../../hooks/DepartmentService";
import PickupPointService from "../../hooks/PickupPointService";
import pl from "../../i18n/translate";
import {
    PickupPointCapability,
    PickupPointConfiguration,
    PickupPointDetails,
    PickupPointStatus,
    PickupPointSummary,
    PickupPointShipmentSize,
    PickupPointType,
} from "./model/PickupPoint";
import PickupPointMap from "./PickupPointMap";
import "./styles/pickup-point-catalog.css";

type Filters = {
    query: string;
    type: "" | PickupPointType;
    status: "" | PickupPointStatus;
    capability: "" | PickupPointCapability;
};

const initialFilters: Filters = {
    query: "",
    type: "",
    status: "",
    capability: "",
};

type CreateForm = {
    code: string;
    name: string;
    type: PickupPointType;
    capabilities: PickupPointCapability[];
    countryCode: string;
    postalCode: string;
    city: string;
    street: string;
    buildingNumber: string;
    unitNumber: string;
    departmentId: string;
    acceptsDangerousGoods: boolean;
};

const shipmentSizes: PickupPointShipmentSize[] = ["TINY", "SMALL", "MEDIUM", "AVERAGE", "BIG"];
const mapPageSize = 100;

const initialCreateForm: CreateForm = {
    code: "",
    name: "",
    type: "SERVICE_POINT",
    capabilities: ["DROP_OFF", "COLLECTION"],
    countryCode: "PL",
    postalCode: "",
    city: "",
    street: "",
    buildingNumber: "",
    unitNumber: "",
    departmentId: "",
    acceptsDangerousGoods: false,
};

const createFormFromPoint = (point: PickupPointDetails): CreateForm => ({
    code: point.code,
    name: point.name,
    type: point.type,
    capabilities: point.capabilities,
    countryCode: point.address?.countryCode || "PL",
    postalCode: point.address?.postalCode || "",
    city: point.address?.city || "",
    street: point.address?.street || "",
    buildingNumber: point.address?.buildingNumber || "",
    unitNumber: point.address?.unitNumber || "",
    departmentId: point.department?.departmentId.value || "",
    acceptsDangerousGoods: point.servicePolicy?.acceptsDangerousGoods || false,
});

const addressLabel = (point: PickupPointSummary) => {
    if (!point.address) {
        return pl.common.dash;
    }
    return `${point.address.street} ${point.address.buildingNumber}, ${point.address.postalCode} ${point.address.city}`;
};

const statusTone = (status: PickupPointStatus) => {
    if (status === "ACTIVE") {
        return "success";
    }
    if (status === "SUSPENDED") {
        return "warning";
    }
    if (status === "CLOSED") {
        return "error";
    }
    return "default";
};

function PickupPointCatalog() {
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);
    const [items, setItems] = useState<PickupPointSummary[]>([]);
    const [mapItems, setMapItems] = useState<PickupPointSummary[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(true);
    const [mapLoading, setMapLoading] = useState(true);
    const [error, setError] = useState("");
    const [mapError, setMapError] = useState("");
    const [notice, setNotice] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateForm>(initialCreateForm);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [createError, setCreateError] = useState("");
    const [saving, setSaving] = useState(false);
    const [editingPoint, setEditingPoint] = useState<PickupPointDetails | null>(null);
    const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
    const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
    const mapRequestIdRef = useRef(0);

    const load = useCallback(async (
        nextPage: number,
        nextRowsPerPage: number,
        nextFilters: Filters,
    ) => {
        setLoading(true);
        setError("");
        try {
            const response = await PickupPointService.search({
                query: nextFilters.query.trim() || undefined,
                type: nextFilters.type || undefined,
                status: nextFilters.status || undefined,
                capability: nextFilters.capability || undefined,
                page: nextPage,
                size: nextRowsPerPage,
            });
            setItems(response.data.items || []);
            setPage(response.data.page ?? nextPage);
            setRowsPerPage(response.data.size || nextRowsPerPage);
            setTotalElements(response.data.totalElements || 0);
        } catch (loadError) {
            setItems([]);
            setTotalElements(0);
            setError(getBackendErrorMessage(loadError, pl.pickupPoints.messages.loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMap = useCallback(async (nextFilters: Filters) => {
        const requestId = ++mapRequestIdRef.current;
        setMapLoading(true);
        setMapError("");
        try {
            const query = {
                query: nextFilters.query.trim() || undefined,
                type: nextFilters.type || undefined,
                status: nextFilters.status || undefined,
                capability: nextFilters.capability || undefined,
                size: mapPageSize,
            };
            const firstPage = await PickupPointService.search({...query, page: 0});
            const totalPages = Math.max(firstPage.data.totalPages || 1, 1);
            const remainingPages = await Promise.all(Array.from(
                {length: totalPages - 1},
                (_, index) => PickupPointService.search({...query, page: index + 1}),
            ));
            if (requestId !== mapRequestIdRef.current) {
                return;
            }
            const points = [firstPage, ...remainingPages].flatMap((response) => response.data.items || []);
            setMapItems(Array.from(new Map(points.map((point) => [
                point.pickupPointId.value,
                point,
            ])).values()));
        } catch (loadError) {
            if (requestId === mapRequestIdRef.current) {
                setMapItems([]);
                setMapError(getBackendErrorMessage(loadError, pl.pickupPoints.map.loadError));
            }
        } finally {
            if (requestId === mapRequestIdRef.current) {
                setMapLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        load(0, 20, initialFilters);
        loadMap(initialFilters);
    }, [load, loadMap]);

    useEffect(() => {
        DepartmentService.getAll()
            .then((response) => setDepartments((response.data || []).filter(
                (department: Department) => department.status === "ACTIVE")))
            .catch(() => setDepartments([]));
    }, []);

    const submitFilters = (event: FormEvent) => {
        event.preventDefault();
        setAppliedFilters(filters);
        load(0, rowsPerPage, filters);
        loadMap(filters);
    };

    const toggleCapability = (capability: PickupPointCapability) => {
        setCreateForm((current) => ({
            ...current,
            capabilities: current.capabilities.includes(capability)
                ? current.capabilities.filter((value) => value !== capability)
                : [...current.capabilities, capability],
        }));
    };

    const openCreateDialog = () => {
        setEditingPoint(null);
        setCreateForm(initialCreateForm);
        setCreateError("");
        setCreateOpen(true);
    };

    const openEditDialog = async (point: PickupPointSummary) => {
        const pickupPointId = point.pickupPointId.value;
        setLoadingDetailsId(pickupPointId);
        setError("");
        try {
            const response = await PickupPointService.getById(pickupPointId);
            setEditingPoint(response.data);
            setCreateForm(createFormFromPoint(response.data));
            setCreateError("");
            setCreateOpen(true);
        } catch (loadError) {
            setError(getBackendErrorMessage(loadError, pl.pickupPoints.edit.loadError));
        } finally {
            setLoadingDetailsId(null);
        }
    };

    const createPickupPoint = async (event: FormEvent) => {
        event.preventDefault();
        if (!createForm.capabilities.length) {
            setCreateError(pl.pickupPoints.create.capabilityRequired);
            return;
        }
        setSaving(true);
        setCreateError("");
        try {
            const configuration: PickupPointConfiguration = {
                name: createForm.name,
                type: createForm.type,
                capabilities: createForm.capabilities,
                address: {
                    countryCode: createForm.countryCode,
                    postalCode: createForm.postalCode,
                    city: createForm.city,
                    street: createForm.street,
                    buildingNumber: createForm.buildingNumber,
                    unitNumber: createForm.unitNumber || null,
                },
                departmentId: {value: createForm.departmentId},
                contact: editingPoint?.contact || null,
                accessInstructions: editingPoint?.accessInstructions || null,
                openingSchedule: editingPoint?.openingSchedule || {
                    timeZone: "Europe/Warsaw",
                    mode: "ALWAYS_OPEN",
                    days: [],
                    exceptions: [],
                },
                servicePolicy: {
                    allowedShipmentSizes: editingPoint?.servicePolicy?.allowedShipmentSizes || shipmentSizes,
                    acceptsDangerousGoods: createForm.acceptsDangerousGoods,
                },
                externalReference: editingPoint?.externalReference || null,
            };
            const response = editingPoint
                ? await PickupPointService.update(editingPoint.pickupPointId.value, {
                    ...configuration,
                })
                : await PickupPointService.create({code: createForm.code, ...configuration});
            setCreateForm(initialCreateForm);
            setCreateOpen(false);
            setEditingPoint(null);
            setNotice(editingPoint ? pl.pickupPoints.edit.success : pl.pickupPoints.create.success);
            if (editingPoint) {
                setItems((current) => current.map((point) => (
                    point.pickupPointId.value === response.data.pickupPointId.value ? response.data : point
                )));
                setMapItems((current) => current.map((point) => (
                    point.pickupPointId.value === response.data.pickupPointId.value ? response.data : point
                )));
            } else {
                setFilters(initialFilters);
                setAppliedFilters(initialFilters);
                setPage(0);
                setItems((current) => [
                    response.data,
                    ...current.filter((point) => point.pickupPointId.value !== response.data.pickupPointId.value),
                ].slice(0, rowsPerPage));
                setTotalElements((current) => current + 1);
                setMapItems((current) => [
                    response.data,
                    ...current.filter((point) => point.pickupPointId.value !== response.data.pickupPointId.value),
                ]);
            }
            setSelectedPointId(response.data.pickupPointId.value);
        } catch (saveError) {
            setCreateError(getBackendErrorMessage(
                saveError,
                editingPoint ? pl.pickupPoints.edit.error : pl.pickupPoints.create.error,
            ));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pickup-point-page">
            <div className="pickup-point-shell">
                <header className="pickup-point-header">
                    <div className="pickup-point-title">
                        <span className="pickup-point-title-icon"><LocationOn/></span>
                        <div>
                            <Typography variant="h4">{pl.pickupPoints.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {pl.pickupPoints.subtitle}
                            </Typography>
                        </div>
                    </div>
                    <div className="pickup-point-header-actions">
                        <Button
                            disabled={loading}
                            onClick={() => {
                                load(page, rowsPerPage, appliedFilters);
                                loadMap(appliedFilters);
                            }}
                            startIcon={<Refresh/>}
                            variant="outlined"
                        >
                            {pl.common.refresh}
                        </Button>
                        <Button
                            onClick={openCreateDialog}
                            startIcon={<Add/>}
                        >
                            {pl.pickupPoints.create.action}
                        </Button>
                    </div>
                </header>

                <section className="pickup-point-panel">
                    <form className="pickup-point-filters" onSubmit={submitFilters}>
                        <TextField
                            label={pl.pickupPoints.filters.query}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                setFilters((current) => ({...current, query: event.target.value}))}
                            value={filters.query}
                        />
                        <TextField
                            label={pl.pickupPoints.filters.status}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                                setFilters((current) => ({
                                    ...current,
                                    status: event.target.value as Filters["status"],
                                }))}
                            select
                            value={filters.status}
                        >
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {(["ACTIVE", "SUSPENDED", "CLOSED"] as PickupPointStatus[]).map((status) => (
                                <MenuItem key={status} value={status}>{pl.pickupPoints.status[status]}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label={pl.pickupPoints.filters.type}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                                setFilters((current) => ({
                                    ...current,
                                    type: event.target.value as Filters["type"],
                                }))}
                            select
                            value={filters.type}
                        >
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {(["SERVICE_POINT", "PARCEL_LOCKER"] as PickupPointType[]).map((type) => (
                                <MenuItem key={type} value={type}>{pl.pickupPoints.type[type]}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label={pl.pickupPoints.filters.capability}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                                setFilters((current) => ({
                                    ...current,
                                    capability: event.target.value as Filters["capability"],
                                }))}
                            select
                            value={filters.capability}
                        >
                            <MenuItem value="">{pl.common.all}</MenuItem>
                            {(["DROP_OFF", "COLLECTION"] as PickupPointCapability[]).map((capability) => (
                                <MenuItem key={capability} value={capability}>
                                    {pl.pickupPoints.capability[capability]}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Button disabled={loading} startIcon={<Search/>} type="submit">
                            {pl.pickupPoints.filters.search}
                        </Button>
                    </form>

                    {error ? <Alert severity="error">{error}</Alert> : null}
                    {notice ? <Alert onClose={() => setNotice("")} severity="success">{notice}</Alert> : null}

                    {mapError ? <Alert severity="error">{mapError}</Alert> : null}
                    <PickupPointMap
                        loading={mapLoading}
                        onSelect={setSelectedPointId}
                        points={mapItems}
                        selectedPointId={selectedPointId}
                    />

                    {loading ? (
                        <div className="pickup-point-empty">
                            <CircularProgress size={28}/>
                            <span>{pl.common.loading}</span>
                        </div>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell component="th">{pl.pickupPoints.columns.code}</TableCell>
                                        <TableCell component="th">{pl.pickupPoints.columns.name}</TableCell>
                                        <TableCell component="th">{pl.pickupPoints.columns.type}</TableCell>
                                        <TableCell component="th">{pl.pickupPoints.columns.capabilities}</TableCell>
                                        <TableCell component="th">{pl.pickupPoints.columns.address}</TableCell>
                                        <TableCell component="th">{pl.pickupPoints.columns.department}</TableCell>
                                        <TableCell component="th">{pl.pickupPoints.columns.status}</TableCell>
                                        <TableCell component="th">{pl.pickupPoints.columns.actions}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.length ? items.map((point) => (
                                        <TableRow
                                            className={selectedPointId === point.pickupPointId.value
                                                ? "pickup-point-row-selected"
                                                : undefined}
                                            key={point.pickupPointId.value}
                                            hover
                                            onClick={() => setSelectedPointId(point.pickupPointId.value)}
                                        >
                                            <TableCell><strong>{point.code}</strong></TableCell>
                                            <TableCell>{point.name}</TableCell>
                                            <TableCell>{pl.pickupPoints.type[point.type]}</TableCell>
                                            <TableCell>
                                                <div className="pickup-point-capabilities">
                                                    {point.capabilities.map((capability) => (
                                                        <Chip
                                                            key={capability}
                                                            label={pl.pickupPoints.capability[capability]}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>{addressLabel(point)}</TableCell>
                                            <TableCell>{point.department?.code || pl.common.dash}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    color={statusTone(point.status)}
                                                    label={pl.pickupPoints.status[point.status]}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    disabled={loadingDetailsId === point.pickupPointId.value}
                                                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                                        event.stopPropagation();
                                                        openEditDialog(point);
                                                    }}
                                                    startIcon={<Edit/>}
                                                    variant="text"
                                                >
                                                    {pl.pickupPoints.edit.action}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={8}>
                                                <div className="pickup-point-empty">{pl.pickupPoints.messages.empty}</div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            <TablePagination
                                count={totalElements}
                                onPageChange={(_, nextPage) => load(nextPage, rowsPerPage, appliedFilters)}
                                onRowsPerPageChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                                    load(0, Number(event.target.value), appliedFilters)}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                rowsPerPageOptions={[10, 20, 50]}
                            />
                        </TableContainer>
                    )}
                </section>
            </div>
            <Dialog
                fullWidth
                maxWidth="sm"
                onClose={() => {
                    if (!saving) {
                        setCreateOpen(false);
                        setEditingPoint(null);
                    }
                }}
                open={createOpen}
            >
                <form onSubmit={createPickupPoint}>
                    <DialogTitle>
                        {editingPoint ? pl.pickupPoints.edit.title : pl.pickupPoints.create.title}
                    </DialogTitle>
                    <DialogContent className="pickup-point-create-form">
                        {createError ? <Alert severity="error">{createError}</Alert> : null}
                        <TextField
                            autoFocus
                            disabled={Boolean(editingPoint)}
                            fullWidth
                            label={pl.pickupPoints.create.code}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                setCreateForm((current) => ({...current, code: event.target.value}))}
                            required
                            value={createForm.code}
                        />
                        <TextField
                            fullWidth
                            label={pl.pickupPoints.create.name}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                setCreateForm((current) => ({...current, name: event.target.value}))}
                            required
                            value={createForm.name}
                        />
                        <TextField
                            fullWidth
                            label={pl.pickupPoints.filters.type}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                                setCreateForm((current) => ({
                                    ...current,
                                    type: event.target.value as PickupPointType,
                                }))}
                            select
                            value={createForm.type}
                        >
                            {(["SERVICE_POINT", "PARCEL_LOCKER"] as PickupPointType[]).map((type) => (
                                <MenuItem key={type} value={type}>{pl.pickupPoints.type[type]}</MenuItem>
                            ))}
                        </TextField>
                        <div className="pickup-point-create-grid">
                            <TextField
                                label={pl.pickupPoints.create.countryCode}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setCreateForm((current) => ({...current, countryCode: event.target.value}))}
                                required
                                value={createForm.countryCode}
                            />
                            <TextField
                                label={pl.pickupPoints.create.postalCode}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setCreateForm((current) => ({...current, postalCode: event.target.value}))}
                                required
                                value={createForm.postalCode}
                            />
                            <TextField
                                label={pl.pickupPoints.create.city}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setCreateForm((current) => ({...current, city: event.target.value}))}
                                required
                                value={createForm.city}
                            />
                            <TextField
                                label={pl.pickupPoints.create.street}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setCreateForm((current) => ({...current, street: event.target.value}))}
                                required
                                value={createForm.street}
                            />
                            <TextField
                                label={pl.pickupPoints.create.buildingNumber}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setCreateForm((current) => ({...current, buildingNumber: event.target.value}))}
                                required
                                value={createForm.buildingNumber}
                            />
                            <TextField
                                label={pl.pickupPoints.create.unitNumber}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setCreateForm((current) => ({...current, unitNumber: event.target.value}))}
                                value={createForm.unitNumber}
                            />
                        </div>
                        <TextField
                            fullWidth
                            label={pl.pickupPoints.create.department}
                            onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                                setCreateForm((current) => ({...current, departmentId: event.target.value}))}
                            required
                            select
                            value={createForm.departmentId}
                        >
                            <MenuItem disabled value="">{pl.pickupPoints.create.selectDepartment}</MenuItem>
                            {departments.map((department) => (
                                <MenuItem key={String(department.departmentId)} value={String(department.departmentId)}>
                                    {department.departmentCode?.value || String(department.departmentId)}
                                </MenuItem>
                            ))}
                        </TextField>
                        <div>
                            <Typography className="pickup-point-field-label" variant="body2">
                                {pl.pickupPoints.create.capabilities}
                            </Typography>
                            <div className="pickup-point-create-capabilities">
                                {(["DROP_OFF", "COLLECTION"] as PickupPointCapability[]).map((capability) => (
                                    <FormControlLabel
                                        control={(
                                            <Checkbox
                                                checked={createForm.capabilities.includes(capability)}
                                                onChange={() => toggleCapability(capability)}
                                            />
                                        )}
                                        key={capability}
                                        label={pl.pickupPoints.capability[capability]}
                                    />
                                ))}
                            </div>
                        </div>
                        <FormControlLabel
                            control={(
                                <Checkbox
                                    checked={createForm.acceptsDangerousGoods}
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            acceptsDangerousGoods: event.target.checked,
                                        }))}
                                />
                            )}
                            label={pl.pickupPoints.create.acceptsDangerousGoods}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            disabled={saving}
                            onClick={() => {
                                setCreateOpen(false);
                                setEditingPoint(null);
                            }}
                            variant="outlined"
                        >
                            {pl.common.cancel}
                        </Button>
                        <Button disabled={saving} type="submit">
                            {editingPoint
                                ? saving ? pl.pickupPoints.edit.saving : pl.pickupPoints.edit.submit
                                : saving ? pl.pickupPoints.create.saving : pl.pickupPoints.create.submit}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </div>
    );
}

export default PickupPointCatalog;
