import ThemeToggle from "./components/common/ThemeToggle";
import UploadZone from "./components/documents/UploadZone";
import { useDocuments } from "./hooks/useDocuments";
import { useTheme } from "./hooks/useTheme";

// Temporary Step 4 screen: tests upload and the documents hook.
// This file is replaced by the real layout in Steps 4-5.
export default function App() {
  // Each hook is called once here and its values are passed down
  const { theme, toggleTheme } = useTheme();
  const { documents, isLoading, loadError, upload } = useDocuments();

  return (
    <main
      style={{
        padding: "var(--space-4)",
        maxWidth: 420,
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <h1>DocMind</h1>
      <UploadZone onUpload={upload} />
      {isLoading && <p>Loading documents...</p>}
      {loadError !== null && <p role="alert">{loadError}</p>}
      <ul>
        {documents.map((document) => (
          <li key={document.doc_id}>
            {document.filename} ({document.chunk_count} chunks)
          </li>
        ))}
      </ul>
    </main>
  );
}