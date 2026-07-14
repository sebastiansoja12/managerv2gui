import {CreateOperatorRequest, Operator, OperatorDraft, UpdateOperatorRequest} from "../../Operators/model/Operator";

export const getOperatorIdValue = (operator: Operator) => String(operator.operatorId?.value ?? "");

export const toCreateRequest = (draft: OperatorDraft): CreateOperatorRequest => ({
    userFirstName: draft.userFirstName,
    userLastName: draft.userLastName,
    username: draft.username,
    password: draft.password,
    language: draft.language,
    email: draft.email,
    taxId: draft.taxId,
    supportsLockers: draft.supportsLockers,
    supportsInternationalShipping: draft.supportsInternationalShipping,
    supportsCashOnDelivery: draft.supportsCashOnDelivery,
    contactPhone: draft.contactPhone,
    contactEmail: draft.contactEmail,
    companyName: draft.companyName,
    contractStartDate: draft.contractStartDate,
    contractEndDate: draft.contractEndDate,
    foundedDate: draft.foundedDate,
    configuration: draft.configuration,
    firstDepartment: draft.firstDepartment,
});

export const toUpdateRequest = (draft: OperatorDraft): UpdateOperatorRequest => ({
    taxId: draft.taxId,
    supportsLockers: draft.supportsLockers,
    supportsInternationalShipping: draft.supportsInternationalShipping,
    supportsCashOnDelivery: draft.supportsCashOnDelivery,
    contactPhone: draft.contactPhone,
    contactEmail: draft.contactEmail,
    companyName: draft.companyName,
    contractStartDate: draft.contractStartDate,
    contractEndDate: draft.contractEndDate,
    foundedDate: draft.foundedDate,
    configuration: draft.configuration,
    status: draft.status,
});
