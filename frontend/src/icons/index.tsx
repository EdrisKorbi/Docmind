import type { SVGProps } from "react";

// All icons share the same props as a normal <svg> (className, aria-label, etc.)
type IconProps = SVGProps<SVGSVGElement>;

// Shared wrapper: every icon uses the same 24x24 grid and stroke style.
// `currentColor` makes the icon take the text color of its parent, so the
// light/dark theme tokens color the icons automatically.
function Icon({ children, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            // Decorative by default; buttons that use an icon carry their own aria-label
            aria-hidden="true"
            {...props}
        >
            {children}
        </svg>
    );
}

export function SunIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </Icon>
    );
}

export function MoonIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </Icon>
    );
}

export function UploadIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 16V4M7 9l5-5 5 5" />
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </Icon>
    );
}

export function FileIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h6" />
        </Icon>
    );
}

export function TrashIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M4 7h16M10 11v6M14 11v6" />
            <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
        </Icon>
    );
}

export function SummarizeIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M4 6h16M4 11h16M4 16h10" />
            <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" />
        </Icon>
    );
}

export function SendIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />
        </Icon>
    );
}

export function ResetIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
        </Icon>
    );
}

export function ChevronIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M6 9l6 6 6-6" />
        </Icon>
    );
}

export function CloseIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M6 6l12 12M18 6L6 18" />
        </Icon>
    );
}

export function WarningIcon(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M12 3L2 20h20z" />
            <path d="M12 10v4M12 17.5v.5" />
        </Icon>
    );
}