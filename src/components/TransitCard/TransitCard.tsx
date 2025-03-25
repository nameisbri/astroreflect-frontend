import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fetchJournalEntriesForTransit } from "../../services/api";
import { Transit, JournalEntry } from "../../types/astrology";

import { formatShortDate, formatDateTime } from "../../utils/dateUtils";
import "./TransitCard.scss";

interface TransitCardProps {
  transit: Transit;
  onClose: () => void;
  onAddJournal: (transitId: string, transitTypeId: string) => void;
}

const TransitCard = ({ transit, onClose, onAddJournal }: TransitCardProps) => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJournalEntries = async () => {
      if (!transit.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const entries = await fetchJournalEntriesForTransit(transit.id);
        setJournalEntries(entries);
      } catch (err) {
        console.error("Failed to fetch journal entries:", err);
        setError("Failed to load journal entries.");
      } finally {
        setIsLoading(false);
      }
    };

    loadJournalEntries();
  }, [transit.id]);

  // Calculate the transit's current status for display
  const getStatusDisplay = () => {
    if (!transit.timing) return "Unknown";

    const timingMap: Record<string, string> = {
      "Active": "Currently Active",
      "Applying": "Building In Strength",
      "Separating": "Diminishing",
      "Upcoming": "Not Yet Active",
    };

    return timingMap[transit.timing] || transit.timing;
  };

  // Get appropriate CSS class based on transit intensity
  const getIntensityClass = () => {
    if (!transit.intensity) return "";

    if (transit.intensity > 80) return "high-intensity";
    if (transit.intensity > 50) return "medium-intensity";
    return "low-intensity";
  };

  return (
    <div className="transit-card">
      <div className="transit-card-header">
        <h2>
          {transit.planetA} {transit.aspect} {transit.planetB}
        </h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="transit-details">
        <div className="transit-dates">
          <div className="date-item">
            <span className="date-label">Start:</span>
            <span className="date-value">
              {formatShortDate(transit.startDate)}
            </span>
          </div>
          <div className="date-item exact">
            <span className="date-label">Exact:</span>
            <span className="date-value">
              {formatDateTime(transit.exactDate)}
            </span>
          </div>
          <div className="date-item">
            <span className="date-label">End:</span>
            <span className="date-value">
              {formatShortDate(transit.endDate)}
            </span>
          </div>
        </div>

        <div className="transit-status">
          <div className="status-row">
            <span className="status-label">Status:</span>
            <span className="status-value">{getStatusDisplay()}</span>
          </div>
          {transit.intensity !== undefined && (
            <div className="status-row">
              <span className="status-label">Intensity:</span>
              <div className="intensity-bar-container">
                <div
                  className={`intensity-bar ${getIntensityClass()}`}
                  style={{ width: `${transit.intensity}%` }}
                />
                <span className="intensity-value">
                  {Math.round(transit.intensity)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="transit-description">
          <p>{transit.description}</p>
        </div>
      </div>

      <div className="journal-section">
        <div className="journal-header">
          <h3>Journal Entries</h3>
          <button
            className="add-journal-button"
            onClick={() => onAddJournal(transit.id, transit.transitTypeId)}
          >
            Add Entry
          </button>
        </div>

        {isLoading && <p className="loading">Loading journal entries...</p>}
        {error && <p className="error">{error}</p>}

        {!isLoading && journalEntries.length === 0 && (
          <p className="no-entries">
            No journal entries yet. Add your reflections about this transit.
          </p>
        )}

        <div className="journal-entries">
          {journalEntries.length === 0 ? (
            <p className="no-entries">
              No journal entries yet. Add your reflections about this transit.
            </p>
          ) : (
            journalEntries.map((entry) => (
              <div className="journal-entry" key={entry.id}>
                <div className="entry-header">
                  <span className="entry-date">
                    {formatShortDate(entry.createdAt)}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TransitCard;
