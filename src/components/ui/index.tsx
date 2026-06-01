import React from "react";

type AnyProps = {
    children?: React.ReactNode;
    className?: string;
    sx?: React.CSSProperties & Record<string, unknown>;
    [key: string]: any;
};

const join = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

const toStyle = (sx?: AnyProps["sx"]): React.CSSProperties | undefined => {
    if (!sx || typeof sx !== "object" || Array.isArray(sx)) {
        return undefined;
    }

    return Object.entries(sx).reduce<React.CSSProperties>((style, [key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
            if (key === "bgcolor" && typeof value === "string") {
                style.backgroundColor = value;
            } else if (key === "borderColor" && typeof value === "string") {
                style.borderColor = value;
            } else if (!key.includes("&") && !key.includes("@")) {
                (style as Record<string, string | number>)[key] = value;
            }
        }
        return style;
    }, {});
};

const omitLegacyProps = (props: AnyProps, names: string[]) => {
    const result = {...props};
    names.forEach((name) => delete result[name]);
    return result;
};

export function Box({component: Component = "div", className, sx, children, ...props}: AnyProps) {
    return <Component data-ui="box" className={className} style={toStyle(sx)} {...omitLegacyProps(props, ["display", "gap", "alignItems", "justifyContent", "flexDirection"])}>{children}</Component>;
}

export function Container({className, sx, children, maxWidth, ...props}: AnyProps) {
    return <div data-ui="container" className={join("mx-auto w-full px-4 sm:px-6 lg:px-8", maxWidth === "sm" && "max-w-3xl", maxWidth === "md" && "max-w-4xl", maxWidth === "lg" && "max-w-6xl", maxWidth === "xl" && "max-w-7xl", className)} style={toStyle(sx)} {...omitLegacyProps(props, ["disableGutters"])}>{children}</div>;
}

export function Paper({className, sx, elevation, children, ...props}: AnyProps) {
    return <div className={join("rounded-2xl border border-border bg-card text-card-foreground shadow-panel", elevation === 0 && "shadow-none", className)} style={toStyle(sx)} {...props}>{children}</div>;
}

const typographyTags: Record<string, keyof JSX.IntrinsicElements> = {
    h1: "h1", h2: "h2", h3: "h3", h4: "h4", h5: "h5", h6: "h6", subtitle1: "h6", subtitle2: "h6", body1: "p", body2: "p", caption: "span", overline: "span", button: "span",
};
const typographyClasses: Record<string, string> = {
    h1: "text-3xl font-bold tracking-tight sm:text-4xl", h2: "text-2xl font-bold tracking-tight sm:text-3xl", h3: "text-xl font-semibold", h4: "text-lg font-semibold", h5: "text-base font-semibold", h6: "text-sm font-semibold", subtitle1: "text-base font-medium", subtitle2: "text-sm font-medium", body1: "text-base", body2: "text-sm", caption: "text-xs text-muted-foreground", overline: "text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground", button: "text-sm font-semibold",
};

export function Typography({component, variant = "body1", className, sx, children, ...props}: AnyProps) {
    const Component = component || typographyTags[variant] || "p";
    return <Component data-ui="typography" data-variant={variant} className={join(typographyClasses[variant] || "", className)} style={toStyle(sx)} {...omitLegacyProps(props, ["gutterBottom", "noWrap", "align", "color"])}>{children}</Component>;
}

const buttonClasses: Record<string, string> = {
    contained: "border border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
    outlined: "border border-border-strong bg-transparent text-foreground hover:border-primary hover:bg-primary/10",
    text: "border border-transparent bg-transparent text-primary hover:bg-primary/10",
};

type ButtonProps = AnyProps & {onClick?: React.MouseEventHandler<HTMLButtonElement>};

export function Button({variant = "contained", color = "primary", startIcon, endIcon, className, sx, children, fullWidth, disabled, type, ...props}: ButtonProps) {
    const colorClass = color === "error" ? "border-danger bg-danger text-white hover:brightness-95" : color === "inherit" ? "text-foreground" : "";
    return <button data-ui="button" data-variant={variant} data-color={color} type={type || "button"} disabled={disabled} className={join("inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:border-border disabled:text-muted-foreground disabled:opacity-100", buttonClasses[variant] || buttonClasses.contained, colorClass, fullWidth && "w-full", className)} style={toStyle(sx)} {...omitLegacyProps(props, ["disableElevation", "size"])}>{startIcon}{children}{endIcon}</button>;
}

type IconButtonProps = AnyProps & {onClick?: React.MouseEventHandler<HTMLButtonElement>};

export function IconButton({className, sx, children, disabled, type, color, size, ...props}: IconButtonProps) {
    return <button data-ui="icon-button" type={type || "button"} disabled={disabled} aria-label={props["aria-label"]} className={join("inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition hover:border-border hover:bg-surface-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:border-border disabled:text-muted-foreground disabled:opacity-100", size === "small" && "size-8", color === "primary" && "text-primary", color === "error" && "text-danger", className)} style={toStyle(sx)} {...omitLegacyProps(props, ["edge"])}>{children}</button>;
}

export function Chip({label, icon, avatar, onDelete, deleteIcon, color = "default", variant = "filled", size = "medium", className, sx, children, ...props}: AnyProps) {
    const colorClass = color === "primary" ? "border-primary/30 bg-primary/12 text-primary" : color === "success" ? "border-success/30 bg-success/12 text-success" : color === "error" ? "border-danger/30 bg-danger/12 text-danger" : color === "warning" ? "border-warning/30 bg-warning/12 text-warning" : "border-border bg-surface-secondary text-muted-foreground";
    return <span data-ui="chip" className={join("inline-flex items-center gap-1.5 rounded-full border px-3 font-semibold", colorClass, variant === "outlined" && "bg-transparent", size === "small" ? "min-h-6 text-xs" : "min-h-7 text-sm", className)} style={toStyle(sx)} {...props}>{avatar || icon}<span data-ui="chip-label">{label || children}</span>{onDelete && <button type="button" onClick={onDelete} className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full hover:bg-black/10" aria-label="Usuń">{deleteIcon || "×"}</button>}</span>;
}

export function Alert({severity = "info", action, className, sx, children, onClose, ...props}: AnyProps) {
    const tones: Record<string, string> = {success: "border-success/30 bg-success/10 text-success", error: "border-danger/30 bg-danger/10 text-danger", warning: "border-warning/30 bg-warning/10 text-warning", info: "border-info/30 bg-info/10 text-info"};
    return <div data-ui="alert" role="alert" className={join("flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium", tones[severity] || tones.info, className)} style={toStyle(sx)} {...props}><div className="min-w-0 flex-1">{children}</div>{action}{onClose && <button type="button" className="text-current opacity-70 hover:opacity-100" onClick={onClose} aria-label="Zamknij">×</button>}</div>;
}

export function CircularProgress({size = 24, className, sx, ...props}: AnyProps) {
    return <span role="progressbar" aria-label="Ładowanie" className={join("inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-primary", className)} style={{width: size, height: size, ...toStyle(sx)}} {...props} />;
}

type TextFieldProps = AnyProps & {
    onChange?: React.ChangeEventHandler<any>;
    onBlur?: React.FocusEventHandler<any>;
};

export function TextField({label, helperText, error, select, multiline, rows, fullWidth, required, disabled, className, sx, InputProps, inputProps, SelectProps, variant, margin, size, children, id, ...props}: TextFieldProps) {
    const inputClass = join("w-full rounded-xl border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60", error ? "border-danger" : "border-border");
    const generatedId = React.useId();
    const resolvedId = id || props.name || `field-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const common = {...omitLegacyProps(props, ["autoComplete", "defaultValue"]), ...(InputProps?.inputProps || {}), ...(inputProps || {})};
    return <label data-ui="text-field" className={join("block", fullWidth !== false && "w-full", className)} htmlFor={resolvedId} style={toStyle(sx)}>{label && <span data-ui="input-label" className="mb-1.5 block text-sm font-medium text-foreground">{label}{required && <span aria-hidden="true" className="ml-1 text-danger"> *</span>}</span>}{select ? <select data-ui="select" id={resolvedId} disabled={disabled} className={inputClass} {...common} {...SelectProps}>{children}</select> : multiline ? <textarea data-ui="input" id={resolvedId} disabled={disabled} rows={rows || 3} className={inputClass} {...common} /> : <input data-ui="input" id={resolvedId} disabled={disabled} className={inputClass} {...common} />}{helperText && <span data-ui="helper" className={join("mt-1.5 block text-xs", error ? "text-danger" : "text-muted-foreground")}>{helperText}</span>}</label>;
}

const MenuContext = React.createContext(false);

export function MenuItem({value, className, children, disabled, onClick, sx, ...props}: AnyProps) {
    const inMenu = React.useContext(MenuContext);
    if (!inMenu && value !== undefined) {
        return <option
            value={value}
            disabled={disabled}
            onClick={(event) => {
                onClick?.(event);
                const option = event.currentTarget as HTMLOptionElement;
                const select = option.parentElement;
                if (select instanceof HTMLSelectElement && !option.disabled) {
                    select.value = option.value;
                    select.dispatchEvent(new Event("change", {bubbles: true}));
                }
            }}
            {...props}
        >{children}</option>;
    }
    return <button type="button" role="menuitem" disabled={disabled} onClick={onClick} className={join("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-surface-secondary disabled:opacity-50", className)} style={toStyle(sx)} {...props}>{children}</button>;
}

export function FormControl({children, className, sx, fullWidth, ...props}: AnyProps) {
    return <div data-ui="form-control" className={join(fullWidth && "w-full", className)} style={toStyle(sx)} {...omitLegacyProps(props, ["variant", "size", "error", "required"])}>{children}</div>;
}

export function InputLabel({children, className, sx, ...props}: AnyProps) {
    return <label data-ui="input-label" className={join("mb-1.5 block text-sm font-medium text-foreground", className)} style={toStyle(sx)} {...props}>{children}</label>;
}

type SelectProps = AnyProps & {onChange?: React.ChangeEventHandler<HTMLSelectElement>};

export function Select({children, className, sx, fullWidth, id, labelId, ...props}: SelectProps) {
    return <select
        data-ui="select"
        id={id}
        aria-labelledby={labelId}
        className={join("rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30", fullWidth && "w-full", className)}
        style={toStyle(sx)}
        {...omitLegacyProps(props, ["label", "labelId", "variant", "size"])}
    >{children}</select>;
}

type CheckableProps = AnyProps & {onChange?: React.ChangeEventHandler<HTMLInputElement>};

export function Checkbox({checked, defaultChecked, onChange, disabled, className, sx, ...props}: CheckableProps) {
    return <input data-ui="input" type="checkbox" checked={checked} defaultChecked={defaultChecked} onChange={onChange} disabled={disabled} className={join("size-4 rounded border-border text-primary focus:ring-ring", className)} style={toStyle(sx)} {...omitLegacyProps(props, ["color", "size"])} />;
}

export function Switch({checked, defaultChecked, onChange, disabled, className, sx, ...props}: CheckableProps) {
    return <label data-ui="switch" className={join("relative inline-flex cursor-pointer items-center", disabled && "cursor-not-allowed opacity-50", className)} style={toStyle(sx)}><input data-ui="input" type="checkbox" className="peer sr-only" checked={checked} defaultChecked={defaultChecked} onChange={onChange} disabled={disabled} {...omitLegacyProps(props, ["color", "size"])} /><span className="h-6 w-11 rounded-full bg-muted transition peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-ring/30 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-5" /></label>;
}

export function FormControlLabel({control, label, className, sx, ...props}: AnyProps) {
    return <label data-ui="form-control-label" className={join("inline-flex items-center gap-2 text-sm text-foreground", className)} style={toStyle(sx)} {...props}>{control}<span data-ui="form-control-label-text">{label}</span></label>;
}

export function Stack({direction = "column", spacing = 1, alignItems, justifyContent, className, sx, children, ...props}: AnyProps) {
    const directionClass = direction === "row" ? "flex-row" : direction === "row-reverse" ? "flex-row-reverse" : direction === "column-reverse" ? "flex-col-reverse" : "flex-col";
    return <div className={join("flex", directionClass, className)} style={{gap: typeof spacing === "number" ? `${spacing * 0.25}rem` : spacing, alignItems, justifyContent, ...toStyle(sx)}} {...omitLegacyProps(props, ["useFlexGap"])}>{children}</div>;
}

export function TableContainer({children, className, sx, component: Component = "div", ...props}: AnyProps) {
    return <Component className={join("w-full overflow-x-auto rounded-xl border border-border", className)} style={toStyle(sx)} {...props}>{children}</Component>;
}
export function Table({children, className, sx, size, ...props}: AnyProps) { return <table className={join("w-full border-collapse text-left text-sm", size === "small" && "text-xs", className)} style={toStyle(sx)} {...props}>{children}</table>; }
export function TableHead({children, className, sx, ...props}: AnyProps) { return <thead className={join("bg-surface-secondary text-muted-foreground", className)} style={toStyle(sx)} {...props}>{children}</thead>; }
export function TableBody({children, className, sx, ...props}: AnyProps) { return <tbody className={join("divide-y divide-border", className)} style={toStyle(sx)} {...props}>{children}</tbody>; }
export function TableRow({children, className, sx, hover, selected, ...props}: AnyProps) { return <tr className={join("transition", hover && "hover:bg-surface-secondary", selected && "bg-primary/10", className)} style={toStyle(sx)} {...props}>{children}</tr>; }
export function TableCell({children, className, sx, align, component: Component = "td", colSpan, rowSpan, ...props}: AnyProps) { return <Component className={join("px-4 py-3 align-middle text-foreground", align === "right" && "text-right", align === "center" && "text-center", className)} style={toStyle(sx)} colSpan={colSpan} rowSpan={rowSpan} {...omitLegacyProps(props, ["padding", "sortDirection"])}>{children}</Component>; }

type TablePaginationProps = AnyProps & {
    onPageChange?: (event: React.MouseEvent<HTMLButtonElement>, page: number) => void;
    onRowsPerPageChange?: React.ChangeEventHandler<HTMLSelectElement>;
    labelDisplayedRows?: (pagination: {from: number; to: number; count: number; page: number}) => React.ReactNode;
};

export function TablePagination({count, page = 0, rowsPerPage = 10, onPageChange, onRowsPerPageChange, rowsPerPageOptions = [5, 10, 25], labelDisplayedRows, className, sx, ...props}: TablePaginationProps) {
    const lastPage = Math.max(0, Math.ceil(Math.max(0, count) / rowsPerPage) - 1);
    const displayed = labelDisplayedRows?.({from: count ? page * rowsPerPage + 1 : 0, to: Math.min((page + 1) * rowsPerPage, count), count, page}) || (count ? `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, count)} z ${count}` : "0 z 0");
    return <div className={join("flex flex-wrap items-center justify-end gap-3 border-t border-border px-3 py-2 text-sm text-muted-foreground", className)} style={toStyle(sx)} {...omitLegacyProps(props, ["component", "labelRowsPerPage"])}><span>{displayed}</span><select value={rowsPerPage} onChange={onRowsPerPageChange} className="rounded-lg border border-border bg-input px-2 py-1 text-foreground">{rowsPerPageOptions.map((value: number) => <option key={value} value={value}>{value}</option>)}</select><button type="button" className="rounded-lg px-2 py-1 hover:bg-surface-secondary disabled:opacity-40" onClick={(event) => onPageChange?.(event, Math.max(0, page - 1))} disabled={page <= 0}>‹</button><button type="button" className="rounded-lg px-2 py-1 hover:bg-surface-secondary disabled:opacity-40" onClick={(event) => onPageChange?.(event, Math.min(lastPage, page + 1))} disabled={page >= lastPage}>›</button></div>;
}

export function Tooltip({title, children, className, ...props}: AnyProps) {
    if (!title) return <>{children}</>;
    return <span title={typeof title === "string" ? title : undefined} aria-label={typeof title === "string" ? title : undefined} className={className} {...props}>{children}</span>;
}

export function ListItemIcon({children, className, sx, ...props}: AnyProps) { return <span className={join("inline-flex shrink-0 items-center justify-center text-muted-foreground", className)} style={toStyle(sx)} {...props}>{children}</span>; }
export function ListItemText({primary, secondary, children, className, sx, ...props}: AnyProps) { return <span className={join("min-w-0 text-sm", className)} style={toStyle(sx)} {...props}>{primary || children}{secondary && <small className="mt-0.5 block text-xs text-muted-foreground">{secondary}</small>}</span>; }

export function Collapse({in: visible, children, className, sx, ...props}: AnyProps) { return <div className={join("grid transition-[grid-template-rows,opacity] duration-200", visible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0", className)} style={toStyle(sx)} {...omitLegacyProps(props, ["timeout", "unmountOnExit"])}><div className="overflow-hidden">{children}</div></div>; }

export function Dialog({open, onClose, children, className, sx, maxWidth = "sm", fullWidth, PaperProps, ...props}: AnyProps) {
    if (!open) return null;
    const width = maxWidth === "xs" ? "max-w-sm" : maxWidth === "md" ? "max-w-2xl" : maxWidth === "lg" ? "max-w-4xl" : maxWidth === "xl" ? "max-w-6xl" : maxWidth === false ? "max-w-none" : "max-w-lg";
    const {className: paperClassName, sx: paperSx, ...paperProps} = PaperProps || {};
    return <div data-ui="dialog-backdrop" className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(event, "backdropClick"); }} {...omitLegacyProps(props, ["keepMounted", "scroll", "TransitionProps"])}><div data-ui="dialog" role="dialog" aria-modal="true" className={join("max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground shadow-floating", width, fullWidth && "w-full", className, paperClassName)} style={{...toStyle(sx), ...toStyle(paperSx)}} {...omitLegacyProps(paperProps, ["elevation", "square"])}>{children}</div></div>;
}
export function DialogTitle({children, className, sx, ...props}: AnyProps) { return <div data-ui="dialog-title" className={join("border-b border-border px-6 py-4 text-lg font-bold", className)} style={toStyle(sx)} {...props}>{children}</div>; }
export function DialogContent({children, className, sx, dividers, ...props}: AnyProps) { return <div data-ui="dialog-content" className={join("px-6 py-5", dividers && "border-y border-border", className)} style={toStyle(sx)} {...props}>{children}</div>; }
export function DialogContentText({children, className, sx, ...props}: AnyProps) { return <p data-ui="dialog-content-text" className={join("text-sm leading-6 text-muted-foreground", className)} style={toStyle(sx)} {...props}>{children}</p>; }
export function DialogActions({children, className, sx, ...props}: AnyProps) { return <div data-ui="dialog-actions" className={join("flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4", className)} style={toStyle(sx)} {...props}>{children}</div>; }

export function Snackbar({open, message, children, autoHideDuration, onClose, anchorOrigin, className, sx, ...props}: AnyProps) {
    React.useEffect(() => {
        if (!open || !autoHideDuration) return undefined;
        const timeout = window.setTimeout(() => onClose?.({}, "timeout"), autoHideDuration);
        return () => window.clearTimeout(timeout);
    }, [open, autoHideDuration, onClose]);
    if (!open) return null;
    const vertical = anchorOrigin?.vertical === "top" ? "top-5" : "bottom-5";
    const horizontal = anchorOrigin?.horizontal === "left" ? "left-5" : anchorOrigin?.horizontal === "right" ? "right-5" : "left-1/2 -translate-x-1/2";
    return <div className={join("fixed z-[110]", vertical, horizontal, className)} style={toStyle(sx)} {...props}>{children || <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-card-foreground shadow-floating">{message}</div>}</div>;
}

export function Menu({anchorEl, open, onClose, children, className, sx, ...props}: AnyProps) {
    const rect = anchorEl?.getBoundingClientRect?.();
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    React.useEffect(() => {
        if (!open) return undefined;
        const listener = (event: MouseEvent) => {
            const target = event.target as Node;
            if (anchorEl?.contains?.(target) || menuRef.current?.contains(target)) return;
            onClose?.(event, "backdropClick");
        };
        window.addEventListener("mousedown", listener);
        return () => window.removeEventListener("mousedown", listener);
    }, [anchorEl, open, onClose]);
    if (!open) return null;
    const left = Math.max(8, Math.min(rect?.left || 0, window.innerWidth - 288));
    return <div ref={menuRef} data-ui="menu" role="menu" className={join("fixed z-[90] max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1rem)] min-w-44 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-floating", className)} style={{top: (rect?.bottom || 0) + 8, left, ...toStyle(sx)}} {...omitLegacyProps(props, ["anchorOrigin", "transformOrigin", "keepMounted"])}><MenuContext.Provider value>{children}</MenuContext.Provider></div>;
}
