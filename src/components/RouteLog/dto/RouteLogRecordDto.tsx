import ProcessIdDto from "./ProcessIdDto";
import ParcelIdDto from "./ParceldDto";
import RouteLogRecordDetailsDto from "./RouteLogRecordDetailsDto";
import ReturnCodeDto from "./ReturnCodeDto";
import FaultDescriptionDto from "./FaultDescriptionDto";

export default interface RouteLogRecordDto {
    processId: ProcessIdDto;
    parcelId: ParcelIdDto;
    routeLogRecordDetails: RouteLogRecordDetailsDto;
    returnCode: ReturnCodeDto;
    faultDescription: FaultDescriptionDto;
}
