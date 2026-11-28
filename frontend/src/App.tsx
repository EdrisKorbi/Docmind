import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";
import { FileIcon, SendIcon, TrashIcon, UploadIcon } from "./icons";

// Temporary Step 2 screen: tests the theme toggle and previews the icons.
// This file is replaced by the real layout in Steps 4-5.
export default function App() {
  // Called once here, then passed down, so there is only one theme state
  const { theme, toggleTheme } = useTheme();

  return (
    <main style={{ padding: "var(--space-4)" }}>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <h1>DocMind</h1>
      <p>Current theme: {theme}</p>
      <p>API base URL: {import.meta.env.VITE_API_BASE_URL}</p>
      {/* Icon preview: icons inherit the text color of their parent */}
      <p style={{ display: "flex", gap: "var(--space-3)" }}>
        <UploadIcon />
        <FileIcon />
        <TrashIcon />
        <SendIcon />
      </p>
    </main>
  );
}