import React, {useEffect, useMemo, useState} from "react";
import {Button, Chip, CircularProgress, IconButton, MenuItem, TextField, Typography} from "components/ui";
import {Add, Close, DeleteOutline, History, LocationOn, SyncAlt} from "components/ui/icons";
import DepartmentMapService from "../../hooks/DepartmentMapService";
import pl from "../../i18n/translate";
import {departmentMapErrorMessage, formatMapDate, movementDescription} from "./departmentMapLabels";
import {LOCATION_STATUS_COLOR} from "./mapGeometry";
import {PalletMovementDto, StorageLocationDto} from "./model/DepartmentMap";

type StorageLocationPanelProps = {
    location: StorageLocationDto;
    locations: StorageLocationDto[];
    movingPallet: string | null;
    onStartPick: (palletTrackingNumber: string) => void;
    onCancelPick: () => void;
    onChanged: (message: string, focusPallet?: string) => Promise<void> | void;
    onRejected: (rejection: unknown) => void;
    onClose: () => void;
};

function StorageLocationPanel({
                                  location,
                                  locations,
                                  movingPallet,
                                  onStartPick,
                                  onCancelPick,
                                  onChanged,
                                  onRejected,
                                  onClose,
                              }: StorageLocationPanelProps) {
    const translations = pl.departmentMap.operations;
    const [palletNumber, setPalletNumber] = useState("");
    const [reservationPallet, setReservationPallet] = useState("");
    const [reservationNote, setReservationNote] = useState("");
    const [moveTargets, setMoveTargets] = useState<Record<string, string>>({});
    const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<{pallet: string; movements: PalletMovementDto[]} | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        setPalletNumber("");
        setReservationPallet("");
        setReservationNote("");
        setMoveTargets({});
        setPendingRemoval(null);
        setError(null);
        setHistory(null);
    }, [location.locationId]);

    const freeSlots = location.capacity - location.pallets.length;
    const blockedByReservation = Boolean(location.reservation) && freeSlots <= 1;
    const canPlace = freeSlots > 0;

    const targetOptions = useMemo(() => locations
        .filter((candidate) => candidate.locationId !== location.locationId)
        .slice()
        .sort((left, right) => left.code.localeCompare(right.code)), [location.locationId, locations]);

    const run = async (action: () => Promise<unknown>, message: string, fallback: string, focusPallet?: string) => {
        setBusy(true);
        setError(null);
        try {
            await action();
            await onChanged(message, focusPallet);
            return true;
        } catch (actionError) {
            setError(departmentMapErrorMessage(actionError, fallback));
            onRejected(actionError);
            return false;
        } finally {
            setBusy(false);
        }
    };

    const placePallet = async () => {
        const normalized = palletNumber.trim().toUpperCase();
        if (!normalized) {
            setError(translations.palletRequired);
            return;
        }
        const placed = await run(() => DepartmentMapService.placePallet(location.locationId, normalized),
            translations.placed.replace("{pallet}", normalized).replace("{code}", location.code),
            translations.placeError, normalized);
        if (placed) {
            setPalletNumber("");
        }
    };

    const movePallet = async (pallet: string) => {
        const targetId = moveTargets[pallet];
        const target = locations.find((candidate) => candidate.locationId === targetId);
        if (!target) {
            setError(translations.targetRequired);
            return;
        }
        await run(() => DepartmentMapService.movePallet(pallet, target.locationId),
            translations.moved.replace("{pallet}", pallet).replace("{code}", target.code), translations.moveError, pallet);
    };

    const removePallet = async (pallet: string) => {
        const removed = await run(() => DepartmentMapService.removePallet(pallet),
            translations.removed.replace("{pallet}", pallet), translations.removeError);
        if (removed) {
            setPendingRemoval(null);
        }
    };

    const reserve = async () => {
        const reserved = await run(() => DepartmentMapService.reserveLocation(location.locationId, {
            palletTrackingNumber: reservationPallet.trim() ? reservationPallet.trim().toUpperCase() : null,
            note: reservationNote.trim() || null,
        }), translations.reserved.replace("{code}", location.code), translations.reserveError);
        if (reserved) {
            setReservationPallet("");
            setReservationNote("");
        }
    };

    const loadHistory = async (pallet: string) => {
        setHistoryLoading(true);
        setError(null);
        try {
            setHistory({pallet, movements: (await DepartmentMapService.palletHistory(pallet)).data || []});
        } catch (historyError) {
            setError(departmentMapErrorMessage(historyError, translations.historyError));
        } finally {
            setHistoryLoading(false);
        }
    };

    return (
        <div className="department-map-location-panel">
            <div className="department-map-panel-header">
                <div>
                    <span className="department-map-kicker">{translations.locationKicker}</span>
                    <Typography variant="h5">{location.code}</Typography>
                </div>
                <IconButton aria-label={pl.common.close} size="small" title={pl.common.close} onClick={onClose}>
                    <Close fontSize="small" />
                </IconButton>
            </div>
            <div className="department-map-location-summary">
                <span className="department-map-status-badge" style={{backgroundColor: LOCATION_STATUS_COLOR[location.status]}}>
                    {pl.departmentMap.status[location.status]}
                </span>
                <span>{translations.occupancy.replace("{count}", String(location.pallets.length))
                    .replace("{capacity}", String(location.capacity))}</span>
            </div>

            {error ? <div className="department-map-inline-error" role="alert">{error}</div> : null}

            {movingPallet ? (
                <div className="department-map-pick-banner" role="status">
                    <span>{translations.pickTarget.replace("{pallet}", movingPallet)}</span>
                    <Button variant="text" onClick={onCancelPick}>{pl.common.cancel}</Button>
                </div>
            ) : null}

            <section className="department-map-panel-section">
                <Typography variant="h6">{translations.palletsTitle}</Typography>
                {location.pallets.length ? (
                    <ul className="department-map-pallet-list">
                        {location.pallets.map((placement) => (
                            <li key={placement.palletTrackingNumber}>
                                <div className="department-map-pallet-row">
                                    <strong>{placement.palletTrackingNumber}</strong>
                                    <span className="department-map-hint">{formatMapDate(placement.placedAt)}</span>
                                </div>
                                <div className="department-map-pallet-actions">
                                    <TextField
                                        select
                                        label={translations.moveTarget}
                                        size="small"
                                        value={moveTargets[placement.palletTrackingNumber] || ""}
                                        onChange={(event) => setMoveTargets((current) => ({
                                            ...current,
                                            [placement.palletTrackingNumber]: event.target.value,
                                        }))}
                                    >
                                        <MenuItem value="">{translations.chooseTarget}</MenuItem>
                                        {targetOptions.map((target) => (
                                            <MenuItem disabled={target.status === "OCCUPIED"} key={target.locationId}
                                                      value={target.locationId}>
                                                {`${target.code} · ${pl.departmentMap.status[target.status]}`}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <Button disabled={busy || !moveTargets[placement.palletTrackingNumber]} startIcon={<SyncAlt />}
                                            variant="outlined" onClick={() => movePallet(placement.palletTrackingNumber)}>
                                        {translations.move}
                                    </Button>
                                    <IconButton aria-label={translations.pickOnMap.replace("{pallet}", placement.palletTrackingNumber)}
                                                disabled={busy} size="small"
                                                title={translations.pickOnMap.replace("{pallet}", placement.palletTrackingNumber)}
                                                onClick={() => onStartPick(placement.palletTrackingNumber)}>
                                        <LocationOn fontSize="small" />
                                    </IconButton>
                                    <IconButton aria-label={translations.history.replace("{pallet}", placement.palletTrackingNumber)}
                                                disabled={historyLoading} size="small"
                                                title={translations.history.replace("{pallet}", placement.palletTrackingNumber)}
                                                onClick={() => loadHistory(placement.palletTrackingNumber)}>
                                        <History fontSize="small" />
                                    </IconButton>
                                    {pendingRemoval === placement.palletTrackingNumber ? (
                                        <span className="department-map-confirm">
                                            <Button color="error" disabled={busy} variant="contained"
                                                    onClick={() => removePallet(placement.palletTrackingNumber)}>
                                                {translations.confirmRemove}
                                            </Button>
                                            <Button disabled={busy} variant="text" onClick={() => setPendingRemoval(null)}>
                                                {pl.common.cancel}
                                            </Button>
                                        </span>
                                    ) : (
                                        <IconButton aria-label={translations.remove.replace("{pallet}", placement.palletTrackingNumber)}
                                                    color="error" disabled={busy} size="small"
                                                    title={translations.remove.replace("{pallet}", placement.palletTrackingNumber)}
                                                    onClick={() => setPendingRemoval(placement.palletTrackingNumber)}>
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : <p className="department-map-hint">{translations.noPallets}</p>}
            </section>

            <section className="department-map-panel-section">
                <Typography variant="h6">{translations.placeTitle}</Typography>
                {!canPlace ? <p className="department-map-hint">{translations.locationFull}</p> : null}
                {canPlace && blockedByReservation ? (
                    <p className="department-map-hint">{translations.reservedHint}</p>
                ) : null}
                <form className="department-map-inline-form" onSubmit={(event) => {
                    event.preventDefault();
                    placePallet();
                }}>
                    <TextField
                        disabled={!canPlace || busy}
                        label={translations.palletNumber}
                        size="small"
                        value={palletNumber}
                        onChange={(event) => setPalletNumber(event.target.value)}
                    />
                    <Button disabled={!canPlace || busy} startIcon={busy ? <CircularProgress size={16} /> : <Add />}
                            type="submit" variant="contained">
                        {translations.place}
                    </Button>
                </form>
            </section>

            <section className="department-map-panel-section">
                <Typography variant="h6">{translations.reservationTitle}</Typography>
                {location.reservation ? (
                    <div className="department-map-reservation">
                        <p>
                            <Chip color="primary" label={location.reservation.palletTrackingNumber
                                ? translations.reservedFor.replace("{pallet}", location.reservation.palletTrackingNumber)
                                : translations.reservedGeneric} size="small" />
                        </p>
                        {location.reservation.note ? <p>{location.reservation.note}</p> : null}
                        <p className="department-map-hint">{formatMapDate(location.reservation.reservedAt)}</p>
                        <Button disabled={busy} variant="outlined"
                                onClick={() => run(() => DepartmentMapService.cancelReservation(location.locationId),
                                    translations.reservationCancelled.replace("{code}", location.code),
                                    translations.reserveError)}>
                            {translations.cancelReservation}
                        </Button>
                    </div>
                ) : (
                    <form className="department-map-inline-form department-map-inline-form-wrap" onSubmit={(event) => {
                        event.preventDefault();
                        reserve();
                    }}>
                        <TextField disabled={!canPlace || busy} label={translations.reservationPallet} size="small"
                                   value={reservationPallet} onChange={(event) => setReservationPallet(event.target.value)} />
                        <TextField disabled={!canPlace || busy} label={translations.reservationNote} size="small"
                                   value={reservationNote} onChange={(event) => setReservationNote(event.target.value)} />
                        <Button disabled={!canPlace || busy} type="submit" variant="outlined">{translations.reserve}</Button>
                    </form>
                )}
            </section>

            {historyLoading ? <p className="department-map-hint"><CircularProgress size={16} /> {pl.common.loading}</p> : null}
            {history ? (
                <section className="department-map-panel-section">
                    <div className="department-map-panel-header">
                        <Typography variant="h6">{translations.historyTitle.replace("{pallet}", history.pallet)}</Typography>
                        <IconButton aria-label={pl.common.close} size="small" onClick={() => setHistory(null)}>
                            <Close fontSize="small" />
                        </IconButton>
                    </div>
                    {history.movements.length ? (
                        <ol className="department-map-history">
                            {history.movements.map((movement) => (
                                <li key={movement.movementId}>
                                    <strong>{movementDescription(movement)}</strong>
                                    <span className="department-map-hint">
                                        {formatMapDate(movement.occurredAt)}
                                        {movement.userId !== null && movement.userId !== undefined
                                            ? ` · ${translations.user.replace("{user}", String(movement.userId))}` : ""}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="department-map-hint">{translations.historyEmpty}</p>}
                </section>
            ) : null}
        </div>
    );
}

export default StorageLocationPanel;
