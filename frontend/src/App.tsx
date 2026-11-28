import ThemeToggle from "./components/common/ThemeToggle";
import UploadZone from "./components/documents/UploadZone";
import DocumentList from "./components/documents/DocumentList";
import SummaryModal from "./components/documents/SummaryModal";

import { useSummary } from "./hooks/useSummary";
import { useDocuments } from "./hooks/useDocuments";
import { useTheme } from "./hooks/useTheme";

// Temporary Step 4 screen: tests upload and the documents hook.
// This file is replaced by the real layout in Steps 4-5.
export default function App() {
  // Each hook is called once here and its values are passed down
  const { theme, toggleTheme } = useTheme();
  const { documents, isLoading, loadError, reload, upload, remove } =
    useDocuments();

  const {
    summaryTarget,
    isSummarizing,
    summaryError,
    summary,
    openSummary,
    closeSummary,
  } = useSummary();

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
      <DocumentList
        documents={documents}
        isLoading={isLoading}
        loadError={loadError}
        onRetry={reload}
        onDelete={remove}
        onSummarize={openSummary}
      />
      {/* Mounted only while a summary is open; mounting is what opens the dialog */}
      {summaryTarget !== null && (
        <SummaryModal
          filename={summaryTarget.filename}
          isLoading={isSummarizing}
          error={summaryError}
          summary={summary}
          onClose={closeSummary}
        />
      )}
    </main>
  );
}