import React from "react";
import type {IconType} from "react-icons";
import {
    FiActivity, FiAlertCircle, FiAlertTriangle, FiAperture, FiArchive, FiArrowLeft, FiBarChart2,
    FiBell, FiBox, FiBriefcase, FiCheckCircle, FiCheckSquare, FiChevronDown,
    FiChevronRight, FiClock, FiCode, FiCompass, FiCopy, FiDatabase,
    FiDelete, FiDollarSign, FiDownload, FiEdit, FiEye, FiFilter, FiGrid,
    FiHardDrive, FiInfo, FiKey, FiLayers, FiLayout, FiLink2, FiList,
    FiLogOut, FiMap, FiMapPin, FiMaximize2, FiMonitor, FiMoreHorizontal, FiMoreVertical, FiPackage,
    FiMessageCircle, FiPhone, FiPlus, FiPrinter, FiRadio, FiRefreshCw, FiRepeat, FiRotateCw, FiSave, FiSend,
    FiSearch, FiSettings, FiShield, FiShoppingBag, FiShoppingCart, FiSliders,
    FiStar, FiTable, FiTag, FiToggleLeft, FiToggleRight, FiTool, FiTrendingUp, FiTruck,
    FiUnlock, FiUpload, FiUser, FiUserPlus, FiUsers, FiX, FiXCircle, FiZap,
} from "react-icons/fi";

type LegacyIconProps = {
    className?: string;
    color?: string;
    fontSize?: "inherit" | "small" | "medium" | "large" | number | string;
    sx?: Record<string, unknown>;
    titleAccess?: string;
    [key: string]: any;
};

const sizes: Record<string, number | string> = {
    inherit: "1em",
    small: 18,
    medium: 24,
    large: 32,
};

const makeIcon = (Icon: IconType) => ({fontSize = "medium", sx, style, titleAccess, ...props}: LegacyIconProps) => {
    const resolvedSize = typeof fontSize === "number" ? fontSize : sizes[fontSize] || fontSize;
    const iconStyle = {...(sx as React.CSSProperties), ...(style as React.CSSProperties)};
    return <Icon size={resolvedSize} style={iconStyle} aria-label={titleAccess} {...props} />;
};

// Feather has no exact equivalent of the Material git-branch and trash glyphs;
// aliases keep the original component API while preserving a single icon system.
const FiGitBranchFallback = FiLayers;
const FiTrashFallback = FiDelete;

export const AccessTime = makeIcon(FiClock);
export const AccountBalance = makeIcon(FiBriefcase);
export const AccountTree = makeIcon(FiGitBranchFallback);
export const AccountTreeOutlined = makeIcon(FiGitBranchFallback);
export const Add = makeIcon(FiPlus);
export const AddBusiness = makeIcon(FiBriefcase);
export const AdminPanelSettings = makeIcon(FiShield);
export const Analytics = makeIcon(FiBarChart2);
export const ArchiveOutlined = makeIcon(FiArchive);
export const ArrowBack = makeIcon(FiArrowLeft);
export const ArrowDropDown = makeIcon(FiChevronDown);
export const AttachMoney = makeIcon(FiDollarSign);
export const AutoModeOutlined = makeIcon(FiRotateCw);
export const Badge = makeIcon(FiTag);
export const Block = makeIcon(FiXCircle);
export const Business = makeIcon(FiBriefcase);
export const Cable = makeIcon(FiLink2);
export const Category = makeIcon(FiTag);
export const ChatBubbleOutline = makeIcon(FiMessageCircle);
export const CheckCircle = makeIcon(FiCheckCircle);
export const CheckCircleOutline = makeIcon(FiCheckCircle);
export const ChevronRight = makeIcon(FiChevronRight);
export const Close = makeIcon(FiX);
export const Code = makeIcon(FiCode);
export const Construction = makeIcon(FiTool);
export const ContentCopy = makeIcon(FiCopy);
export const Dashboard = makeIcon(FiLayout);
export const DataObject = makeIcon(FiDatabase);
export const DataObjectOutlined = makeIcon(FiDatabase);
export const Delete = makeIcon(FiTrashFallback);
export const DeleteOutline = makeIcon(FiTrashFallback);
export const DevicesOther = makeIcon(FiMonitor);
export const DirectionsCar = makeIcon(FiTruck);
export const DocumentScanner = makeIcon(FiAperture);
export const Download = makeIcon(FiDownload);
export const Edit = makeIcon(FiEdit);
export const EditOutlined = makeIcon(FiEdit);
export const ErrorOutline = makeIcon(FiAlertCircle);
export const ExpandMore = makeIcon(FiChevronDown);
export const FactCheckOutlined = makeIcon(FiCheckSquare);
export const FileDownload = makeIcon(FiDownload);
export const FilterList = makeIcon(FiFilter);
export const GridView = makeIcon(FiGrid);
export const GroupOutlined = makeIcon(FiUsers);
export const History = makeIcon(FiClock);
export const Hub = makeIcon(FiRadio);
export const InfoOutlined = makeIcon(FiInfo);
export const Inventory2 = makeIcon(FiPackage);
export const Inventory2Outlined = makeIcon(FiPackage);
export const Key = makeIcon(FiKey);
export const KeyboardArrowDown = makeIcon(FiChevronDown);
export const KeyboardArrowUp = makeIcon(FiChevronRight);
export const LocalOffer = makeIcon(FiTag);
export const LocalShipping = makeIcon(FiTruck);
export const LocationCity = makeIcon(FiBriefcase);
export const LocationOn = makeIcon(FiMapPin);
export const LockOpen = makeIcon(FiUnlock);
export const Logout = makeIcon(FiLogOut);
export const Loop = makeIcon(FiRepeat);
export const ManageAccounts = makeIcon(FiUsers);
export const Map = makeIcon(FiMap);
export const MonitorHeartOutlined = makeIcon(FiActivity);
export const MoreHoriz = makeIcon(FiMoreHorizontal);
export const MoreVert = makeIcon(FiMoreVertical);
export const NotificationsActiveOutlined = makeIcon(FiBell);
export const NotificationsNone = makeIcon(FiBell);
export const OpenInFull = makeIcon(FiMaximize2);
export const PeopleAlt = makeIcon(FiUsers);
export const Person = makeIcon(FiUser);
export const PersonAdd = makeIcon(FiUserPlus);
export const PersonAddAlt = makeIcon(FiUserPlus);
export const PersonPinCircle = makeIcon(FiUser);
export const Phone = makeIcon(FiPhone);
export const Print = makeIcon(FiPrinter);
export const Public = makeIcon(FiCompass);
export const QrCode2 = makeIcon(FiGrid);
export const QrCodeScanner = makeIcon(FiAperture);
export const Radar = makeIcon(FiRadio);
export const Refresh = makeIcon(FiRefreshCw);
export const ReportProblemOutlined = makeIcon(FiAlertTriangle);
export const Route = makeIcon(FiMap);
export const RouteOutlined = makeIcon(FiMap);
export const Save = makeIcon(FiSave);
export const Search = makeIcon(FiSearch);
export const Send = makeIcon(FiSend);
export const SecurityOutlined = makeIcon(FiShield);
export const Settings = makeIcon(FiSettings);
export const SettingsOutlined = makeIcon(FiSettings);
export const SettingsSuggest = makeIcon(FiSliders);
export const Shield = makeIcon(FiShield);
export const ShoppingCart = makeIcon(FiShoppingCart);
export const Storage = makeIcon(FiHardDrive);
export const Storefront = makeIcon(FiShoppingBag);
export const SupportAgent = makeIcon(FiUser);
export const SyncAlt = makeIcon(FiRepeat);
export const SyncOutlined = makeIcon(FiRefreshCw);
export const TableRows = makeIcon(FiTable);
export const TableView = makeIcon(FiTable);
export const Tag = makeIcon(FiTag);
export const TaskAlt = makeIcon(FiCheckCircle);
export const ToggleOff = makeIcon(FiToggleLeft);
export const ToggleOn = makeIcon(FiToggleRight);
export const TrendingUp = makeIcon(FiTrendingUp);
export const Tune = makeIcon(FiSliders);
export const TuneOutlined = makeIcon(FiSliders);
export const UnarchiveOutlined = makeIcon(FiUpload);
export const Upload = makeIcon(FiUpload);
export const ViewList = makeIcon(FiList);
export const Visibility = makeIcon(FiEye);
export const VpnKey = makeIcon(FiKey);
export const Warehouse = makeIcon(FiBox);
export const WarehouseRounded = makeIcon(FiBox);
export const WarningAmberOutlined = makeIcon(FiAlertTriangle);
export const WebhookOutlined = makeIcon(FiZap);
export const WorkspacePremium = makeIcon(FiStar);
