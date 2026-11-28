import "./App.css";
import ChatWorkspace from "./components/chat/ChatWorkspace";
import ThemeToggle from "./components/common/ThemeToggle";
import DocumentLibrary from "./components/documents/DocumentLibrary";
import SummaryModal from "./components/documents/SummaryModal";
import { useDocuments } from "./hooks/useDocuments";
import { useSummary } from "./hooks/useSummary";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  // Theme, documents, and summary state live here; the chat state lives in
  // ChatWorkspace, because nothing outside the chat needs it
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
    <div className="app">
      <aside className="app__sidebar">
        <header className="app__header">
          <h1 className="app__title">DocMind</h1>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </header>
        <DocumentLibrary
          documents={documents}
          isLoading={isLoading}
          loadError={loadError}
          onRetry={reload}
          onUpload={upload}
          onDelete={remove}
          onSummarize={openSummary}
        />
      </aside>

      <main className="app__main">
        <ChatWorkspace documents={documents} />
      </main>

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
    </div>
  );
}