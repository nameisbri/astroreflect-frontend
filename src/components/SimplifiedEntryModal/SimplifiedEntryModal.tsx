import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  fetchJournalEntriesForTransit,
  fetchJournalEntriesForTransitType,
} from "../../services/api";
import { JournalEntry, Planet } from "../../types/astrology";
import { formatShortDate } from "../../utils/dateUtils";
import "./SimplifiedEntryModal.scss";

interface ModalData {
  id: string;
  transitTypeId: string;
  title: string;
  description?: string;
  startDate?: Date | string;
  exactDate?: Date | string;
  endDate?: Date | string;
  isPlanetPosition?: boolean;
  planet?: Planet;
  sign?: string;
  aspect?: string;
}

interface SimplifiedEntryModalProps {
  data: ModalData;
  onClose: () => void;
  onAddJournal: (transitId: string, transitTypeId: string) => void;
}

const SimplifiedEntryModal = ({
  data,
  onClose,
  onAddJournal,
}: SimplifiedEntryModalProps) => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Improved date formatting function
  const formatDateSafely = (dateValue: Date | string | undefined): string => {
    if (!dateValue) return "Unknown date";

    try {
      // Handle both Date objects and ISO strings
      const dateObj =
        typeof dateValue === "string" ? parseISO(dateValue) : dateValue;

      // Verify the date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn("Invalid date:", dateValue);
        return "Unknown date";
      }

      return format(dateObj, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error, dateValue);
      return "Unknown date";
    }
  };

  useEffect(() => {
    const loadJournalEntries = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let entries: JournalEntry[] = [];

        if (data.isPlanetPosition) {
          const response = await fetchJournalEntriesForTransitType(
            data.transitTypeId
          );

          entries = response.entries || [];
        } else {
          try {
            entries = await fetchJournalEntriesForTransit(data.id);
          } catch (err) {
            console.log("No entries for specific transit, trying transit type");
          }

          if (entries.length === 0) {
            const response = await fetchJournalEntriesForTransitType(
              data.transitTypeId
            );
            entries = response.entries || [];
          }
        }

        setJournalEntries(entries);
      } catch (err) {
        console.error("Failed to fetch journal entries:", err);
        setError("Failed to load journal entries.");
      } finally {
        setIsLoading(false);
      }
    };

    loadJournalEntries();
  }, [data.id, data.transitTypeId, data.isPlanetPosition]);

  const getModalClass = () => {
    if (data.isPlanetPosition) {
      return "planet-position";
    } else if (data.aspect) {
      return data.aspect.toLowerCase();
    }
    return "";
  };

  return (
    <div className={`simplified-entry-modal ${getModalClass()}`}>
      <div className="modal-header">
        <h2>{data.title}</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="modal-content">
        {data.description && (
          <div className="description-section">
            <p>{data.description}</p>
          </div>
        )}

        {!data.isPlanetPosition && data.startDate && data.endDate && (
          <div className="dates-section">
            <div className="date-item">
              <span className="date-label">Start:</span>
              <span className="date-value">
                {formatDateSafely(data.startDate)}
              </span>
            </div>

            {data.exactDate && (
              <div className="date-item exact">
                <span className="date-label">Exact:</span>
                <span className="date-value">
                  {formatDateSafely(data.exactDate)}
                </span>
              </div>
            )}

            <div className="date-item">
              <span className="date-label">End:</span>
              <span className="date-value">
                {formatDateSafely(data.endDate)}
              </span>
            </div>
          </div>
        )}

        <div className="journal-section">
          <div className="journal-header">
            <h3>Journal Entries</h3>
            <button
              className="add-entry-button"
              onClick={() => onAddJournal(data.id, data.transitTypeId)}
            >
              Add Entry
            </button>
          </div>

          {isLoading && (
            <p className="loading-message">Loading journal entries...</p>
          )}
          {error && <p className="error-message">{error}</p>}

          <div className="entries-list">
            {!isLoading && journalEntries.length === 0 && (
              <p className="no-entries-message">
                No journal entries for this{" "}
                {data.isPlanetPosition ? "planet position" : "transit"} yet.
              </p>
            )}

            {journalEntries.map((entry) => (
              <div className="journal-entry" key={entry.id}>
                <div className="entry-header">
                  <span className="entry-date">
                    {formatDateSafely(entry.createdAt)}
                  </span>
                  {entry.mood && (
                    <span className="entry-mood">{entry.mood}</span>
                  )}
                </div>
                <p className="entry-content">{entry.content}</p>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="entry-tags">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedEntryModal;
