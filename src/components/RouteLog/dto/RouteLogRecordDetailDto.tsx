import ParcelStatusDto from "./enum/ParcelStatusDto";
import ProcessTypeDto from "./enum/ProcessTypeDto";

export default interface RouteLogRecordDetailDto {
    id: number;
    zebraId: number;
    version: string;
    username: string;
    supplierCode: string;
    depotCode: string;
    parcelStatus: ParcelStatusDto;
    description: string;
    timestamp: string;
    processType: ProcessTypeDto;
    request: string;
}