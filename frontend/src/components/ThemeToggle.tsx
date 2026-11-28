import type { Theme } from "../hooks/useTheme";
import { MoonIcon, SunIcon } from "../icons";
import "./ThemeToggle.css";

// The component receives the theme and a click handler from its parent
type ThemeToggleProps = {
    theme: Theme;
    onToggle: () => void;
};

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
    const isDark = theme === "dark";
    // The label describes the ACTION (what happens on click), not the current state
    const label = isDark ? "Switch to light theme" : "Switch to dark theme";

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={onToggle}
            aria-label={label}
            title={label}
        >
            {/* Show the icon of the theme you will switch to */}
            {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
    );
}