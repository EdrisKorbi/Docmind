import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

// Key used to remember the user's choice between visits
const STORAGE_KEY = "docmind-theme";

// Decide the starting theme: saved choice first, then the OS setting
function getInitialTheme(): Theme {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
            return stored;
        }
    } catch {
        // Storage can be blocked by browser settings; fall through to the OS setting
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export function useTheme() {
    // Passing the function (not its result) means it runs only once, on first render
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // Runs after render whenever `theme` changes
    useEffect(() => {
        // Sets <html data-theme="..."> so the CSS tokens in index.css switch
        document.documentElement.dataset.theme = theme;
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // Ignore: the theme still works, it just won't be remembered
        }
    }, [theme]);

    // Flips between the two themes
    const toggleTheme = useCallback(() => {
        setTheme((previous) => (previous === "light" ? "dark" : "light"));
    }, []);

    return { theme, toggleTheme };
}