import { useId } from "react";
import type { ChangeEvent } from "react";
import { ChevronIcon } from "../../../icons";
import type { DocumentRecord } from "../../../types/api";
import "./ScopeSelector.css";

// `value` is a doc_id for "Single document", or null for "All documents".
// The parent owns the choice; this component only displays and reports it.
type ScopeSelectorProps = {
    documents: DocumentRecord[];
    value: string | null;
    onChange: (docId: string | null) => void;
};

// An empty string is the <select> value of the "All documents" option
const ALL_DOCUMENTS = "";

export default function ScopeSelector({
    documents,
    value,
    onChange,
}: ScopeSelectorProps) {
    // Links the visible label to the select (unique even if rendered twice)
    const selectId = useId();

    // If the chosen document no longer exists, show "All documents" instead of a blank box
    const selectedValue = documents.some((record) => record.doc_id === value)
        ? (value ?? ALL_DOCUMENTS)
        : ALL_DOCUMENTS;

    function handleChange(event: ChangeEvent<HTMLSelectElement>) {
        const next = event.target.value;
        onChange(next === ALL_DOCUMENTS ? null : next);
    }

    return (
        <div className="scope-selector">
            <label className="scope-selector__label" htmlFor={selectId}>
                Search in
            </label>
            <div className="scope-selector__field">
                <select
                    id={selectId}
                    className="scope-selector__select"
                    value={selectedValue}
                    onChange={handleChange}
                    // Nothing to choose until at least one document exists
                    disabled={documents.length === 0}
                >
                    <option value={ALL_DOCUMENTS}>All documents</option>
                    {documents.map((record) => (
                        <option key={record.doc_id} value={record.doc_id}>
                            {record.filename}
                        </option>
                    ))}
                </select>
                <ChevronIcon className="scope-selector__chevron" />
            </div>
        </div>
    );
}