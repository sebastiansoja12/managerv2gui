import React, {useCallback, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle} from "components/ui";
import {Download, Print} from "components/ui/icons";
import PalletService, {savePalletDocument} from "../../hooks/PalletService";
import pl from "../../i18n/translate";
import {PalletDocumentFile, PalletDocumentKind, PalletDto} from "./model/Pallet";
import {exportPalletExcel, exportPalletListExcel} from "./palletExcelExport";
import {palletErrorMessage} from "./palletLabels";

export type PalletDocumentAction = PalletDocumentKind | "excel";

type Preview = {kind: PalletDocumentKind; trackingNumber: string; url: string; file: PalletDocumentFile};

export function usePalletDocuments(departmentLabel: (id?: number | string | null) => string) {
    const translations = pl.pallets.documents;
    const [loading, setLoading] = useState<PalletDocumentAction | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const frameRef = useRef<HTMLIFrameElement | null>(null);

    useEffect(() => () => {
        if (preview) {
            URL.revokeObjectURL(preview.url);
        }
    }, [preview]);

    const openDocument = useCallback(async (pallet: PalletDto, kind: PalletDocumentKind) => {
        setLoading(kind);
        setError(null);
        try {
            const file = await PalletService.getDocument(pallet.trackingNumber, kind);
            setPreview({kind, trackingNumber: pallet.trackingNumber, url: URL.createObjectURL(file.blob), file});
        } catch (documentError) {
            setError(palletErrorMessage(documentError, translations.error));
        } finally {
            setLoading(null);
        }
    }, [translations.error]);

    const exportExcel = useCallback(async (pallet: PalletDto) => {
        setLoading("excel");
        setError(null);
        try {
            await exportPalletExcel(pallet, departmentLabel);
        } catch (exportError) {
            setError(pl.pallets.excel.error);
        } finally {
            setLoading(null);
        }
    }, [departmentLabel]);

    const exportListExcel = useCallback(async (pallets: PalletDto[]) => {
        setLoading("excel");
        setError(null);
        try {
            await exportPalletListExcel(pallets, departmentLabel);
        } catch (exportError) {
            setError(pl.pallets.excel.error);
        } finally {
            setLoading(null);
        }
    }, [departmentLabel]);

    const print = () => {
        frameRef.current?.contentWindow?.focus();
        frameRef.current?.contentWindow?.print();
    };

    const dialog = preview ? createPortal(
        <Dialog fullWidth maxWidth="md" open onClose={() => setPreview(null)}>
            <DialogTitle>
                {preview.kind === "label" ? translations.label.title : translations.transport.title} · {preview.trackingNumber}
            </DialogTitle>
            <DialogContent className="pallet-document-preview">
                <iframe ref={frameRef} src={preview.url} title={translations.previewTitle} />
            </DialogContent>
            <DialogActions>
                <Button variant="text" onClick={() => setPreview(null)}>{pl.common.close}</Button>
                <Button startIcon={<Download />} variant="outlined" onClick={() => savePalletDocument(preview.file)}>
                    {translations.download}
                </Button>
                <Button startIcon={<Print />} onClick={print}>{translations.print}</Button>
            </DialogActions>
        </Dialog>,
        document.body,
    ) : null;

    return {loading, error, setError, openDocument, exportExcel, exportListExcel, dialog};
}
