import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  fetchJournalEntriesForTransit,
  fetchJournalEntriesForTransitType,
} from "../../services/api";
import { JournalEntry, Planet } from "../../types/astrology";
import {
  PLANET_KEYWORDS,
  getJournalPrompts,
  getSignMeaning,
  getSignPrompts,
} from "../../utils/planetKeywords";
import { parseFlexibleDate } from "../../utils/dateUtils";
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
  planetA?: Planet;
  planetB?: Planet;
  aspect?: string;
  sign?: string;
}

interface SimplifiedEntryModalProps {
  data: ModalData;
  onClose: () => void;
  onAddJournal: (
    transitId: string,
    transitTypeId: string,
    planetA?: Planet,
    planetB?: Planet,
    aspect?: string
  ) => void;
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
  const formatDateSafely = (
    dateValue: Date | string | undefined | null
  ): string => {
    const parsedDate = parseFlexibleDate(dateValue);

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return "Unknown date";
    }

    try {
      return format(parsedDate, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
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

        console.log("Raw journal entries from API:", entries);
        if (entries.length > 0) {
          console.log("First entry keys:", Object.keys(entries[0]));
        }

        // Don't try to modify the dates - the API already returns them in ISO format
        // Just pass the entries through as-is
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

  // Get journal prompts based on the planets involved
  const getPrompts = () => {
    const planetA = data.planetA || data.planet;
    const planetB = data.planetB;

    if (!planetA) return [];

    // For planet-in-sign configurations
    if (data.isPlanetPosition && data.sign) {
      return getSignPrompts(planetA, data.sign);
    }

    // For planet-to-planet aspects
    return getJournalPrompts(planetA, planetB);
  };

  // Render keywords for a planet
  const renderPlanetKeywords = (planet?: Planet) => {
    if (!planet) return null;

    const keywords = PLANET_KEYWORDS[planet] || [];

    return (
      <div className="planet-keyword-item">
        <span className="planet-name">{planet}:</span>
        <span className="keywords">{keywords.join(", ")}</span>
      </div>
    );
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
        {/* Keywords section instead of description */}
        <div className="keywords-section">
          <h3>Focus Areas</h3>
          <div className="keywords-container">
            {renderPlanetKeywords(data.planetA || data.planet)}
            {renderPlanetKeywords(data.planetB)}

            {data.isPlanetPosition && data.sign && (
              <div className="aspect-context">
                <span className="aspect-label">In Sign:</span>
                <span className="aspect-meaning">
                  {data.sign} - {getSignMeaning(data.sign)}
                </span>
              </div>
            )}
          </div>

          {/* Journal Prompts */}
          <div className="journal-prompts">
            <h4>Reflection Prompts</h4>
            <ul>
              {getPrompts().map((prompt, index) => (
                <li key={index}>{prompt}</li>
              ))}
            </ul>
          </div>
        </div>

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
              onClick={() =>
                onAddJournal(
                  data.id,
                  data.transitTypeId,
                  data.planetA || data.planet,
                  data.planetB,
                  data.aspect
                )
              }
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

            {journalEntries.map((entry) => {
              // Direct access to entry properties to handle the unusual API return format
              // Use any to bypass TypeScript restrictions since we know the data structure
              const rawEntry = entry as any;
              const dateStr =
                rawEntry.created_at || rawEntry.createdAt || "Unknown date";

              // Debug log to see the entry structure
              console.log("Entry object keys:", Object.keys(rawEntry));

              return (
                <div className="journal-entry" key={entry.id}>
                  <div className="entry-header">
                    <span className="entry-date">
                      {typeof dateStr === "string"
                        ? format(new Date(dateStr), "MMM d, yyyy")
                        : "Unknown date"}
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedEntryModal;
