import React, {FormEvent, useEffect, useMemo, useState} from "react";
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "components/ui";
import {
    CheckCircleOutline,
    ContentCopy,
    DeleteOutline,
    EditOutlined,
    History,
    Inventory2Outlined,
    Loop,
    Refresh,
    Search,
    Shield,
} from "components/ui/icons";
import {getBackendErrorMessage} from "../../api/errorMessage";
import {useAuthState} from "../../auth/AuthState";
import Department from "../../class/depots/Department";
import DepartmentService from "../../hooks/DepartmentService";
import ReturnService from "../../hooks/ReturnService";
import pl from "../../i18n/translate";
import {
    ReturnPackageDto,
    ReturnReasonCode,
    returnReasonCodes,
} from "./model/ReturnPackage";
import "./styles/returns.css";

type Notice = {
    severity: "success" | "error" | "info";
    message: string;
};

type CreateForm = {
    shipmentId: string;
    departmentCode: string;
    reasonCode: ReturnReasonCode;
    reason: string;
};

const emptyCreateForm = (departmentCode = ""): CreateForm => ({
    shipmentId: "",
    departmentCode,
    reasonCode: "DAMAGED",
    reason: "",
});

const valueOrDash = (value?: string | null) => value || pl.common.dash;

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return pl.common.dash;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(pl.common.locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const returnStatusLabel = (status: ReturnPackageDto["returnStatus"]) =>
    pl.returns.status[status] || status;

const returnReasonLabel = (reasonCode?: string | null) => reasonCode
    ? pl.returns.reasonCodes[reasonCode as ReturnReasonCode] || reasonCode
    : pl.common.dash;

const departmentCode = (department?: Department) => department?.departmentCode?.value || "";

const departmentLabel = (department: Department) => {
    const code = departmentCode(department);
    const city = department.address?.city;
    return city ? `${code} — ${city}` : code;
};

function Returns() {
    const {user} = useAuthState();
    const [lookupId, setLookupId] = useState("");
    const [returnPackage, setReturnPackage] = useState<ReturnPackageDto | null>(null);
    const [returnPackages, setReturnPackages] = useState<ReturnPackageDto[]>([]);
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [listReloadKey, setListReloadKey] = useState(0);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm(user?.departmentCode));
    const [departments, setDepartments] = useState<Department[]>([]);
    const [departmentsLoading, setDepartmentsLoading] = useState(false);
    const [departmentsError, setDepartmentsError] = useState<string | null>(null);
    const [departmentsReloadKey, setDepartmentsReloadKey] = useState(0);
    const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
    const [selectedReasonCode, setSelectedReasonCode] = useState<ReturnReasonCode>("DAMAGED");
    const [confirmation, setConfirmation] = useState<"complete" | "cancel" | null>(null);
    const [tokenShipmentId, setTokenShipmentId] = useState("");
    const [token, setToken] = useState("");
    const [tokenResult, setTokenResult] = useState<boolean | null>(null);

    const availableDepartments = useMemo(() => departments
        .filter((department) => department.status === "ACTIVE")
        .sort((left, right) => departmentCode(left).localeCompare(departmentCode(right), pl.common.locale)), [departments]);
    const availableDepartmentCodes = useMemo(
        () => new Set(availableDepartments.map(departmentCode)),
        [availableDepartments],
    );
    const terminal = returnPackage?.returnStatus === "COMPLETED" || returnPackage?.returnStatus === "CANCELLED";
    const validLookupId = /^\d+$/.test(lookupId.trim());
    const validCreateForm = /^\d+$/.test(createForm.shipmentId.trim())
        && availableDepartmentCodes.has(createForm.departmentCode)
        && Boolean(createForm.reason.trim());
    const validTokenForm = /^\d+$/.test(tokenShipmentId.trim()) && Boolean(token.trim());

    const selectReturnPackage = (selectedReturnPackage: ReturnPackageDto) => {
        setReturnPackage(selectedReturnPackage);
        setLookupId(selectedReturnPackage.returnPackageId.value);
        setSelectedReasonCode(selectedReturnPackage.reasonCode.value as ReturnReasonCode);
        setTokenShipmentId(selectedReturnPackage.shipmentId.value);
        setToken(selectedReturnPackage.returnToken?.value || "");
        setTokenResult(null);
    };

    useEffect(() => {
        let ignore = false;
        setDepartmentsLoading(true);
        setDepartmentsError(null);

        DepartmentService.getAll()
            .then((response) => {
                if (ignore) {
                    return;
                }

                const activeDepartments = response.data
                    .filter((department) => department.status === "ACTIVE")
                    .sort((left, right) => departmentCode(left).localeCompare(departmentCode(right), pl.common.locale));
                const preferredDepartmentCode = user?.departmentCode;
                const selectedDepartmentCode = activeDepartments.some(
                    (department) => departmentCode(department) === preferredDepartmentCode,
                )
                    ? preferredDepartmentCode || ""
                    : departmentCode(activeDepartments[0]);

                setDepartments(activeDepartments);
                setCreateForm((currentForm) => ({
                    ...currentForm,
                    departmentCode: selectedDepartmentCode,
                }));
                setDepartmentFilter(selectedDepartmentCode);
            })
            .catch((error) => {
                if (!ignore) {
                    setDepartments([]);
                    setCreateForm((currentForm) => ({...currentForm, departmentCode: ""}));
                    setDepartmentsError(getBackendErrorMessage(error, pl.returns.messages.departmentsLoadError));
                }
            })
            .finally(() => {
                if (!ignore) {
                    setDepartmentsLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [departmentsReloadKey, user?.departmentCode]);

    useEffect(() => {
        if (!departmentFilter) {
            setReturnPackages([]);
            return;
        }

        let ignore = false;
        setListLoading(true);
        setListError(null);

        ReturnService.getAllByDepartment(departmentFilter)
            .then((packages) => {
                if (!ignore) {
                    setReturnPackages(packages);
                }
            })
            .catch((error) => {
                if (!ignore) {
                    setReturnPackages([]);
                    setListError(getBackendErrorMessage(error, pl.returns.messages.listLoadError));
                }
            })
            .finally(() => {
                if (!ignore) {
                    setListLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [departmentFilter, listReloadKey]);

    const loadReturn = async (requestedId = lookupId) => {
        const normalizedId = requestedId.trim();
        if (!/^\d+$/.test(normalizedId)) {
            setNotice({severity: "error", message: pl.returns.messages.invalidReturnId});
            return;
        }

        setLoading(true);
        setNotice(null);
        try {
            const response = await ReturnService.get(normalizedId);
            if (response.data.assignedDepartmentCode?.value === departmentFilter) {
                setReturnPackages((currentReturnPackages) => [
                    response.data,
                    ...currentReturnPackages.filter(
                        (item) => item.returnPackageId.value !== response.data.returnPackageId.value,
                    ),
                ]);
            }
            selectReturnPackage(response.data);
        } catch (error) {
            setReturnPackage(null);
            setNotice({
                severity: "error",
                message: getBackendErrorMessage(error, pl.returns.messages.loadError),
            });
        } finally {
            setLoading(false);
        }
    };

    const searchReturn = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void loadReturn();
    };

    const openCreateDialog = () => {
        const preferredDepartmentCode = availableDepartmentCodes.has(user?.departmentCode || "")
            ? user?.departmentCode || ""
            : departmentCode(availableDepartments[0]);
        setCreateForm(emptyCreateForm(preferredDepartmentCode));
        setNotice(null);
        setCreateDialogOpen(true);
    };

    const createReturn = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validCreateForm) {
            setNotice({severity: "error", message: pl.returns.messages.requiredFields});
            return;
        }

        setSaving(true);
        setNotice(null);
        try {
            await ReturnService.create({
                shipmentId: {value: createForm.shipmentId.trim()},
                reason: createForm.reason.trim(),
                reasonCode: {value: createForm.reasonCode},
                departmentCode: {value: createForm.departmentCode.trim().toUpperCase()},
                returnStatus: "CREATED",
            });
            setCreateDialogOpen(false);
            setDepartmentFilter(createForm.departmentCode);
            setListReloadKey((key) => key + 1);
            setNotice({severity: "success", message: pl.returns.messages.createSuccess});
        } catch (error) {
            setNotice({
                severity: "error",
                message: getBackendErrorMessage(error, pl.returns.messages.createError),
            });
        } finally {
            setSaving(false);
        }
    };

    const changeReasonCode = async () => {
        if (!returnPackage) {
            return;
        }

        setSaving(true);
        setNotice(null);
        try {
            await ReturnService.changeReasonCode(returnPackage.returnPackageId.value, selectedReasonCode);
            setReasonDialogOpen(false);
            await loadReturn(returnPackage.returnPackageId.value);
            setNotice({severity: "success", message: pl.returns.messages.reasonUpdated});
        } catch (error) {
            setNotice({
                severity: "error",
                message: getBackendErrorMessage(error, pl.returns.messages.reasonUpdateError),
            });
        } finally {
            setSaving(false);
        }
    };

    const applyStatusAction = async () => {
        if (!returnPackage || !confirmation) {
            return;
        }

        setSaving(true);
        setNotice(null);
        try {
            if (confirmation === "complete") {
                await ReturnService.complete(returnPackage.shipmentId.value);
            } else {
                await ReturnService.cancel(returnPackage.returnPackageId.value);
            }
            const successMessage = confirmation === "complete"
                ? pl.returns.messages.completeSuccess
                : pl.returns.messages.cancelSuccess;
            setConfirmation(null);
            await loadReturn(returnPackage.returnPackageId.value);
            setNotice({severity: "success", message: successMessage});
        } catch (error) {
            setNotice({
                severity: "error",
                message: getBackendErrorMessage(error, pl.returns.messages.statusUpdateError),
            });
        } finally {
            setSaving(false);
        }
    };

    const validateToken = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validTokenForm) {
            return;
        }

        setSaving(true);
        setTokenResult(null);
        try {
            const response = await ReturnService.validateToken({
                shipmentId: tokenShipmentId.trim(),
                returnToken: token.trim(),
            });
            setTokenResult(response.data.valid);
        } catch (error) {
            setNotice({
                severity: "error",
                message: getBackendErrorMessage(error, pl.returns.messages.tokenValidationError),
            });
        } finally {
            setSaving(false);
        }
    };

    const copyToken = async () => {
        if (!returnPackage?.returnToken?.value) {
            return;
        }

        try {
            await navigator.clipboard.writeText(returnPackage.returnToken.value);
            setNotice({severity: "success", message: pl.returns.messages.tokenCopied});
        } catch (error) {
            setNotice({severity: "error", message: pl.returns.messages.tokenCopyError});
        }
    };

    return (
        <main className="returns-page">
            <div className="returns-shell">
                <header className="returns-header">
                    <div className="returns-title">
                        <span className="returns-title-icon"><Loop /></span>
                        <div>
                            <Typography variant="h4">{pl.returns.page.title}</Typography>
                            <Typography variant="body2" color="text.secondary">{pl.returns.page.subtitle}</Typography>
                        </div>
                    </div>
                    <Button startIcon={<Inventory2Outlined />} onClick={openCreateDialog}>
                        {pl.returns.actions.create}
                    </Button>
                </header>

                {notice ? <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert> : null}

                <section className="returns-lookup-panel" aria-labelledby="returns-lookup-title">
                    <div>
                        <span className="returns-section-kicker">{pl.returns.lookup.kicker}</span>
                        <Typography id="returns-lookup-title" variant="h6">{pl.returns.lookup.title}</Typography>
                        <p>{pl.returns.lookup.description}</p>
                    </div>
                    <form className="returns-lookup-form" onSubmit={searchReturn}>
                        <TextField
                            label={pl.returns.fields.returnId}
                            inputMode="numeric"
                            placeholder={pl.returns.lookup.placeholder}
                            value={lookupId}
                            onChange={(event) => setLookupId(event.target.value)}
                        />
                        <Button disabled={!validLookupId || loading} startIcon={loading ? <CircularProgress size={18} /> : <Search />} type="submit">
                            {pl.returns.actions.search}
                        </Button>
                    </form>
                </section>

                <section className="returns-list-card" aria-labelledby="returns-list-title">
                    <div className="returns-list-header">
                        <div>
                            <span className="returns-section-kicker">{pl.returns.list.kicker}</span>
                            <Typography id="returns-list-title" variant="h6">{pl.returns.list.title}</Typography>
                            <p>{pl.returns.list.description}</p>
                        </div>
                        <TextField
                            select
                            className="returns-department-filter"
                            label={pl.returns.list.departmentFilter}
                            value={departmentFilter}
                            onChange={(event) => {
                                setDepartmentFilter(event.target.value);
                                setReturnPackage(null);
                            }}
                        >
                            {availableDepartments.map((department) => (
                                <MenuItem key={department.departmentId} value={departmentCode(department)}>
                                    {departmentLabel(department)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </div>

                    <TableContainer className="returns-table-container">
                            <Table className="returns-table" aria-label={pl.returns.list.tableLabel}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell component="th">{pl.returns.fields.returnId}</TableCell>
                                        <TableCell component="th">{pl.returns.fields.shipmentId}</TableCell>
                                        <TableCell component="th">{pl.returns.list.status}</TableCell>
                                        <TableCell component="th">{pl.returns.fields.assignedDepartment}</TableCell>
                                        <TableCell component="th">{pl.returns.fields.reasonCode}</TableCell>
                                        <TableCell component="th">{pl.returns.list.updatedAt}</TableCell>
                                        <TableCell align="right" component="th">{pl.returns.list.actions}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {listLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7}>
                                                <div className="returns-table-state" role="status">
                                                    <CircularProgress size={20} />
                                                    {pl.returns.list.loading}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : listError ? (
                                        <TableRow>
                                            <TableCell colSpan={7}>
                                                <div className="returns-table-state returns-table-error" role="alert">
                                                    <span>{listError}</span>
                                                    <Button variant="outlined" onClick={() => setListReloadKey((key) => key + 1)}>
                                                        {pl.returns.actions.retry}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : returnPackages.length ? returnPackages.map((item) => (
                                        <TableRow
                                            key={item.returnPackageId.value}
                                            selected={item.returnPackageId.value === returnPackage?.returnPackageId.value}
                                        >
                                            <TableCell component="th" scope="row">{item.returnPackageId.value}</TableCell>
                                            <TableCell>{item.shipmentId.value}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    className={`return-status return-status-${item.returnStatus.toLowerCase()}`}
                                                    label={returnStatusLabel(item.returnStatus)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{valueOrDash(item.assignedDepartmentCode?.value)}</TableCell>
                                            <TableCell>{returnReasonLabel(item.reasonCode?.value)}</TableCell>
                                            <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                                            <TableCell align="right">
                                                <Button variant="text" onClick={() => selectReturnPackage(item)}>
                                                    {pl.returns.actions.open}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7}>
                                                <div className="returns-table-empty">{pl.returns.list.noDepartmentResults}</div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                </section>

                {returnPackage ? (
                    <>
                        <section className="returns-detail-card">
                            <div className="returns-detail-header">
                                <div>
                                    <span className="returns-section-kicker">{pl.returns.details.kicker}</span>
                                    <div className="returns-detail-heading">
                                        <Typography variant="h5">#{returnPackage.returnPackageId.value}</Typography>
                                        <Chip
                                            className={`return-status return-status-${returnPackage.returnStatus.toLowerCase()}`}
                                            label={returnStatusLabel(returnPackage.returnStatus)}
                                            size="small"
                                        />
                                    </div>
                                    <p>{pl.returns.fields.shipmentId}: #{returnPackage.shipmentId.value}</p>
                                </div>
                                <div className="returns-actions">
                                    <Button disabled={loading} startIcon={<Refresh />} variant="outlined" onClick={() => loadReturn()}>
                                        {pl.common.refresh}
                                    </Button>
                                    {!terminal ? (
                                        <>
                                            <Button startIcon={<CheckCircleOutline />} onClick={() => setConfirmation("complete")}>
                                                {pl.returns.actions.complete}
                                            </Button>
                                            <Button color="error" startIcon={<DeleteOutline />} variant="outlined" onClick={() => setConfirmation("cancel")}>
                                                {pl.returns.actions.cancelReturn}
                                            </Button>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            <div className="returns-detail-grid">
                                <div className="returns-info-card returns-info-card-wide">
                                    <div className="returns-info-heading">
                                        <div>
                                            <span>{pl.returns.details.reasonTitle}</span>
                                            <strong>{returnReasonLabel(returnPackage.reasonCode.value)}</strong>
                                        </div>
                                        {!terminal ? (
                                            <Button startIcon={<EditOutlined />} variant="text" onClick={() => setReasonDialogOpen(true)}>
                                                {pl.common.edit}
                                            </Button>
                                        ) : null}
                                    </div>
                                    <p>{valueOrDash(returnPackage.reason)}</p>
                                </div>

                                <div className="returns-info-card">
                                    <span>{pl.returns.fields.assignedDepartment}</span>
                                    <strong>{valueOrDash(returnPackage.assignedDepartmentCode?.value)}</strong>
                                    <small>{pl.returns.fields.returnedDepartment}: {valueOrDash(returnPackage.returnedDepartmentCode?.value)}</small>
                                </div>
                                <div className="returns-info-card">
                                    <span>{pl.returns.fields.assignedTo}</span>
                                    <strong>{returnPackage.assignedTo?.value ? `#${returnPackage.assignedTo.value}` : pl.common.dash}</strong>
                                    <small>{pl.returns.fields.processedBy}: {returnPackage.processedBy?.value ? `#${returnPackage.processedBy.value}` : pl.common.dash}</small>
                                </div>
                                <div className="returns-info-card returns-info-card-token">
                                    <span>{pl.returns.fields.returnToken}</span>
                                    <strong>{valueOrDash(returnPackage.returnToken?.value)}</strong>
                                    <Button startIcon={<ContentCopy />} variant="text" onClick={copyToken}>
                                        {pl.returns.actions.copyToken}
                                    </Button>
                                </div>
                            </div>
                        </section>

                        <div className="returns-secondary-grid">
                            <section className="returns-timeline-card">
                                <div className="returns-card-heading">
                                    <History />
                                    <div>
                                        <Typography variant="h6">{pl.returns.timeline.title}</Typography>
                                        <p>{pl.returns.timeline.description}</p>
                                    </div>
                                </div>
                                <ol className="returns-timeline">
                                    <li>
                                        <span />
                                        <div><strong>{pl.returns.timeline.created}</strong><small>{formatDateTime(returnPackage.createdAt)}</small></div>
                                    </li>
                                    <li>
                                        <span />
                                        <div><strong>{pl.returns.timeline.updated}</strong><small>{formatDateTime(returnPackage.updatedAt)}</small></div>
                                    </li>
                                </ol>
                            </section>

                            <section className="returns-token-card">
                                <div className="returns-card-heading">
                                    <Shield />
                                    <div>
                                        <Typography variant="h6">{pl.returns.tokenValidation.title}</Typography>
                                        <p>{pl.returns.tokenValidation.description}</p>
                                    </div>
                                </div>
                                <form onSubmit={validateToken}>
                                    <TextField
                                        label={pl.returns.fields.shipmentId}
                                        inputMode="numeric"
                                        value={tokenShipmentId}
                                        onChange={(event) => {
                                            setTokenShipmentId(event.target.value);
                                            setTokenResult(null);
                                        }}
                                    />
                                    <TextField
                                        label={pl.returns.fields.returnToken}
                                        value={token}
                                        onChange={(event) => {
                                            setToken(event.target.value);
                                            setTokenResult(null);
                                        }}
                                    />
                                    <Button disabled={!validTokenForm || saving} type="submit" variant="outlined">
                                        {pl.returns.actions.validateToken}
                                    </Button>
                                </form>
                                {tokenResult !== null ? (
                                    <Alert severity={tokenResult ? "success" : "error"}>
                                        {tokenResult ? pl.returns.messages.tokenValid : pl.returns.messages.tokenInvalid}
                                    </Alert>
                                ) : null}
                            </section>
                        </div>
                    </>
                ) : null}
            </div>

            <Dialog fullWidth maxWidth="sm" open={createDialogOpen} onClose={() => !saving && setCreateDialogOpen(false)}>
                <form onSubmit={createReturn}>
                    <DialogTitle>{pl.returns.create.title}</DialogTitle>
                    <DialogContent className="returns-dialog-content">
                        <DialogContentText>{pl.returns.create.description}</DialogContentText>
                        <div className="returns-form-grid">
                            <TextField
                                required
                                label={pl.returns.fields.shipmentId}
                                inputMode="numeric"
                                value={createForm.shipmentId}
                                onChange={(event) => setCreateForm({...createForm, shipmentId: event.target.value})}
                            />
                            <TextField
                                select
                                required
                                disabled={departmentsLoading || !availableDepartments.length}
                                label={pl.returns.fields.assignedDepartment}
                                value={createForm.departmentCode}
                                onChange={(event) => setCreateForm({...createForm, departmentCode: event.target.value})}
                            >
                                {!availableDepartments.length ? (
                                    <MenuItem disabled value="">
                                        {departmentsLoading
                                            ? pl.returns.create.departmentsLoading
                                            : pl.returns.create.noAvailableDepartments}
                                    </MenuItem>
                                ) : null}
                                {availableDepartments.map((department) => (
                                    <MenuItem key={department.departmentId} value={departmentCode(department)}>
                                        {departmentLabel(department)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                required
                                label={pl.returns.fields.reasonCode}
                                value={createForm.reasonCode}
                                onChange={(event) => setCreateForm({...createForm, reasonCode: event.target.value as ReturnReasonCode})}
                            >
                                {returnReasonCodes.map((reasonCode) => (
                                    <MenuItem key={reasonCode} value={reasonCode}>{pl.returns.reasonCodes[reasonCode]}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                required
                                className="returns-form-wide"
                                label={pl.returns.fields.reason}
                                multiline
                                rows={4}
                                value={createForm.reason}
                                onChange={(event) => setCreateForm({...createForm, reason: event.target.value})}
                            />
                        </div>
                        {departmentsError ? (
                            <Alert
                                action={(
                                    <Button size="small" variant="text" onClick={() => setDepartmentsReloadKey((key) => key + 1)}>
                                        {pl.returns.actions.retry}
                                    </Button>
                                )}
                                severity="error"
                            >
                                {departmentsError}
                            </Alert>
                        ) : null}
                    </DialogContent>
                    <DialogActions>
                        <Button disabled={saving} variant="text" onClick={() => setCreateDialogOpen(false)}>{pl.common.cancel}</Button>
                        <Button disabled={!validCreateForm || saving} startIcon={saving ? <CircularProgress size={18} /> : <Loop />} type="submit">
                            {pl.returns.actions.create}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog fullWidth maxWidth="xs" open={reasonDialogOpen} onClose={() => !saving && setReasonDialogOpen(false)}>
                <DialogTitle>{pl.returns.reasonDialog.title}</DialogTitle>
                <DialogContent className="returns-dialog-content">
                    <DialogContentText>{pl.returns.reasonDialog.description}</DialogContentText>
                    <TextField
                        select
                        label={pl.returns.fields.reasonCode}
                        value={selectedReasonCode}
                        onChange={(event) => setSelectedReasonCode(event.target.value as ReturnReasonCode)}
                    >
                        {returnReasonCodes.map((reasonCode) => (
                            <MenuItem key={reasonCode} value={reasonCode}>{pl.returns.reasonCodes[reasonCode]}</MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} variant="text" onClick={() => setReasonDialogOpen(false)}>{pl.common.cancel}</Button>
                    <Button disabled={saving} onClick={changeReasonCode}>{pl.common.saveChanges}</Button>
                </DialogActions>
            </Dialog>

            <Dialog maxWidth="xs" open={Boolean(confirmation)} onClose={() => !saving && setConfirmation(null)}>
                <DialogTitle>{confirmation === "complete" ? pl.returns.confirmation.completeTitle : pl.returns.confirmation.cancelTitle}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmation === "complete" ? pl.returns.confirmation.completeDescription : pl.returns.confirmation.cancelDescription}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button disabled={saving} variant="text" onClick={() => setConfirmation(null)}>{pl.common.cancel}</Button>
                    <Button color={confirmation === "cancel" ? "error" : "primary"} disabled={saving} onClick={applyStatusAction}>
                        {confirmation === "complete" ? pl.returns.actions.complete : pl.returns.actions.cancelReturn}
                    </Button>
                </DialogActions>
            </Dialog>
        </main>
    );
}

export default Returns;
