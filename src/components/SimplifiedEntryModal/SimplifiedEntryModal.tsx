import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  fetchJournalEntriesForTransit,
  fetchJournalEntriesForTransitType,
} from "../../services/api";
import { JournalEntry, Planet } from "../../types/astrology";
import { formatShortDate } from "../../utils/dateUtils";
import { PLANET_KEYWORDS, getJournalPrompts } from "../../utils/planetKeywords";
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

  // Get journal prompts based on the planets involved
  const getPrompts = () => {
    const planetA = data.planetA || data.planet;
    const planetB = data.planetB;

    if (!planetA) return [];

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

            {data.aspect && (
              <div className="aspect-context">
                <span className="aspect-label">Aspect:</span>
                <span className="aspect-meaning">
                  {data.aspect} -
                  {data.aspect === "Conjunction" && " Blending of energies"}
                  {data.aspect === "Sextile" && " Opportunity and harmony"}
                  {data.aspect === "Square" && " Tension and growth"}
                  {data.aspect === "Trine" && " Flow and ease"}
                  {data.aspect === "Opposition" && " Balance and awareness"}
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
