import { useId, useState } from "react";
import { ChevronIcon, FileIcon } from "../../../icons";
import type { Citation } from "../../../types/api";
import "./CitationList.css";

type CitationListProps = {
    citations: Citation[];
};

export default function CitationList({ citations }: CitationListProps) {
    const [isOpen, setIsOpen] = useState(false);
    // Links the toggle button to the panel it controls (for screen readers)
    const panelId = useId();

    // Fallback answers have no sources, so there is nothing to show
    if (citations.length === 0) {
        return null;
    }

    const label = `Sources (${citations.length})`;
    const chevronClass = isOpen
        ? "citation-list__chevron citation-list__chevron--open"
        : "citation-list__chevron";

    return (
        <div className="citation-list">
            <button
                type="button"
                className="citation-list__toggle"
                onClick={() => setIsOpen((previous) => !previous)}
                aria-expanded={isOpen}
                aria-controls={panelId}
            >
                <span>{label}</span>
                <ChevronIcon className={chevronClass} />
            </button>

            {isOpen && (
                <ul id={panelId} className="citation-list__items">
                    {citations.map((citation) => (
                        // doc_id + chunk_index is unique: retrieval never returns a chunk twice
                        <li
                            key={`${citation.doc_id}-${citation.chunk_index}`}
                            className="citation-list__card"
                        >
                            <div className="citation-list__heading">
                                <FileIcon width={16} height={16} />
                                <span
                                    className="citation-list__filename"
                                    title={citation.filename}
                                >
                                    {citation.filename}
                                </span>
                            </div>
                            <span className="citation-list__meta">
                                {/* page is 0 for .txt and .md files, which have no pages */}
                                {citation.page > 0 && `Page ${citation.page} · `}
                                Chunk {citation.chunk_index + 1}
                            </span>
                            <p className="citation-list__preview">{citation.preview}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}