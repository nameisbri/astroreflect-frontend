import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Transit, Planet, Aspect } from "../../types/astrology";
import ActionButton from "../ActionButton/ActionButton";
import "./SimplifiedAspectSection.scss";

interface SimplifiedAspectSectionProps {
  transits: Transit[];
  isLoading: boolean;
  selectedDay: Date;
  journalEntriesByTransitType?: Record<string, number>; // Count of entries by transitTypeId
  onViewTransit: (transit: Transit) => void;
  onAddJournal: (transitId: string, transitTypeId: string) => void;
}

const SimplifiedAspectSection = ({
  transits,
  isLoading,
  selectedDay,
  journalEntriesByTransitType = {},
  onViewTransit,
  onAddJournal,
}: SimplifiedAspectSectionProps) => {
  const [aspectFilter, setAspectFilter] = useState<string>("all");

  // Filter to only include two-planet transits (aspects)
  const aspectTransits = transits.filter((transit) => transit.planetB);

  // Filter transits based on selected aspect type
  const filteredTransits =
    aspectFilter === "all"
      ? aspectTransits
      : aspectTransits.filter(
          (transit) => transit.aspect?.toLowerCase() === aspectFilter
        );

  // Handler for viewing transit entries
  const handleViewEntries = (transit: Transit, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    console.log(
      "View entries clicked for transit:",
      transit.id,
      "type:",
      transit.transitTypeId
    );
    onViewTransit(transit);
  };

  // Handler for adding journal entries
  const handleAddJournal = (
    transitId: string,
    transitTypeId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent event bubbling
    console.log("Add journal clicked for transit:", transitId, transitTypeId);
    onAddJournal(transitId, transitTypeId);
  };

  // Get unique aspect types for the filter
  const aspectTypes = Array.from(
    new Set(aspectTransits.map((transit) => transit.aspect))
  ).filter(Boolean) as string[];

  // Get an icon/symbol for the aspect
  const getAspectSymbol = (aspect: string): string => {
    const aspectSymbols: Record<string, string> = {
      "Conjunction": "☌",
      "Sextile": "⚹",
      "Square": "□",
      "Trine": "△",
      "Opposition": "☍",
    };
    return aspectSymbols[aspect] || aspect.charAt(0);
  };

  // Get an icon/symbol for the planet
  const getPlanetSymbol = (planet: Planet): string => {
    const planetSymbols: Record<Planet, string> = {
      [Planet.SUN]: "☉",
      [Planet.MOON]: "☽",
      [Planet.MERCURY]: "☿",
      [Planet.VENUS]: "♀",
      [Planet.MARS]: "♂",
      [Planet.JUPITER]: "♃",
      [Planet.SATURN]: "♄",
      [Planet.URANUS]: "♅",
      [Planet.NEPTUNE]: "♆",
      [Planet.PLUTO]: "♇",
    };
    return planetSymbols[planet] || planet.charAt(0);
  };

  if (isLoading) {
    return (
      <div className="simplified-aspect-section">
        <div className="section-header">
          <h3>Planetary Aspects</h3>
        </div>
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Loading transits...</p>
        </div>
      </div>
    );
  }

  if (aspectTransits.length === 0) {
    return (
      <div className="simplified-aspect-section">
        <div className="section-header">
          <h3>Planetary Aspects</h3>
        </div>
        <div className="empty-state">
          <p>No planetary aspects on {format(selectedDay, "MMMM d, yyyy")}</p>
          <span className="empty-subtext">
            Check another day to see different aspects
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="simplified-aspect-section">
      <div className="section-header">
        <h3>Planetary Aspects</h3>

        <div className="aspect-filters">
          <button
            className={`filter-btn ${aspectFilter === "all" ? "active" : ""}`}
            onClick={() => setAspectFilter("all")}
          >
            All
          </button>

          {aspectTypes.map((aspect) => (
            <button
              key={aspect}
              className={`filter-btn ${
                aspectFilter === aspect.toLowerCase() ? "active" : ""
              } aspect-${aspect.toLowerCase()}`}
              onClick={() => setAspectFilter(aspect.toLowerCase())}
            >
              {getAspectSymbol(aspect)} {aspect}
            </button>
          ))}
        </div>
      </div>

      {filteredTransits.length === 0 ? (
        <div className="empty-state">
          <p>No {aspectFilter} aspects found on this day</p>
          <button
            className="reset-filter"
            onClick={() => setAspectFilter("all")}
          >
            Show all aspects
          </button>
        </div>
      ) : (
        <div className="transit-list">
          {filteredTransits.map((transit) => (
            <div key={transit.id} className="transit-card">
              <div
                className={`card-header aspect-${transit.aspect?.toLowerCase()}`}
              >
                <div className="aspect-symbols">
                  <span className="planet-a">
                    {getPlanetSymbol(transit.planetA)}
                  </span>
                  <span className="aspect-symbol">
                    {getAspectSymbol(transit.aspect || "")}
                  </span>
                  <span className="planet-b">
                    {getPlanetSymbol(transit.planetB || Planet.SUN)}
                  </span>
                </div>

                <div className="aspect-title">
                  {transit.planetA} {transit.aspect} {transit.planetB}
                </div>

                {transit.timing && (
                  <span
                    className={`timing-badge ${transit.timing.toLowerCase()}`}
                  >
                    {transit.timing}
                  </span>
                )}
              </div>

              <div className="card-body">
                <div className="dates">
                  <div className="date start">
                    <span className="label">Start:</span>
                    <span className="value">
                      {format(
                        typeof transit.startDate === "string"
                          ? parseISO(transit.startDate)
                          : transit.startDate,
                        "MMM d"
                      )}
                    </span>
                  </div>

                  <div className="date exact">
                    <span className="label">Exact:</span>
                    <span className="value">
                      {format(
                        typeof transit.exactDate === "string"
                          ? parseISO(transit.exactDate)
                          : transit.exactDate,
                        "MMM d"
                      )}
                    </span>
                  </div>

                  <div className="date end">
                    <span className="label">End:</span>
                    <span className="value">
                      {format(
                        typeof transit.endDate === "string"
                          ? parseISO(transit.endDate)
                          : transit.endDate,
                        "MMM d"
                      )}
                    </span>
                  </div>
                </div>

                <p className="description">
                  {transit.description?.length > 100
                    ? `${transit.description.slice(0, 100)}...`
                    : transit.description}
                </p>
              </div>

              <div className="card-actions">
                <ActionButton
                  variant="secondary"
                  icon="📓"
                  badgeCount={
                    transit.transitTypeId
                      ? journalEntriesByTransitType[transit.transitTypeId] || 0
                      : 0
                  }
                  onClick={(e) => handleViewEntries(transit, e)}
                >
                  View Entries
                </ActionButton>

                <ActionButton
                  variant="accent"
                  icon="✏️"
                  onClick={(e) =>
                    handleAddJournal(transit.id, transit.transitTypeId || "", e)
                  }
                >
                  Add Entry
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimplifiedAspectSection;
