import { useState, useMemo } from "react";
import { Planet, PlanetPosition, Transit } from "../../types/astrology";
import PlanetCard from "../PlanetCard/PlanetCard";
import "./PlanetView.scss";

interface PlanetViewProps {
  planetPositions: PlanetPosition[];
  transits: Transit[];
  journalEntriesByTransitType: Record<string, number>;
  isLoading: boolean;
  onAddJournal: (
    transitId: string,
    transitTypeId: string,
    planetA?: Planet,
    planetB?: Planet,
    aspect?: string
  ) => void;
  onViewEntries: (
    data: any,
    isPlanetPosition: boolean,
    event?: React.MouseEvent
  ) => void;
}

const PlanetView = ({
  planetPositions,
  transits,
  journalEntriesByTransitType,
  isLoading,
  onAddJournal,
  onViewEntries,
}: PlanetViewProps) => {
  const [filter, setFilter] = useState<"all" | Planet>("all");

  // Helper for sorting planets by traditional astrological importance
  const getPlanetImportance = (planet: Planet): number => {
    const order = [
      Planet.SUN,
      Planet.MOON,
      Planet.MERCURY,
      Planet.VENUS,
      Planet.MARS,
      Planet.JUPITER,
      Planet.SATURN,
      Planet.URANUS,
      Planet.NEPTUNE,
      Planet.PLUTO,
    ];
    return order.indexOf(planet);
  };

  // Group transits by planet
  const transitsByPlanet = useMemo(() => {
    const result: Record<Planet, Transit[]> = {
      [Planet.SUN]: [],
      [Planet.MOON]: [],
      [Planet.MERCURY]: [],
      [Planet.VENUS]: [],
      [Planet.MARS]: [],
      [Planet.JUPITER]: [],
      [Planet.SATURN]: [],
      [Planet.URANUS]: [],
      [Planet.NEPTUNE]: [],
      [Planet.PLUTO]: [],
    };

    transits.forEach((transit) => {
      // Only include aspects (transits between two planets)
      if (transit.planetA && transit.planetB && transit.aspect) {
        // Add to planetA's list
        result[transit.planetA].push(transit);

        // Add to planetB's list if it exists and is different from planetA
        if (transit.planetB !== transit.planetA) {
          result[transit.planetB].push(transit);
        }
      }
    });

    return result;
  }, [transits]);

  // Get journal entry counts for both position and aspects
  const getJournalCounts = (planet: Planet, position: PlanetPosition) => {
    const positionTransitTypeId = `${planet}_IN_${
      position.sign?.name || "Aries"
    }`;
    const positionCount =
      journalEntriesByTransitType[positionTransitTypeId] || 0;

    // Sum up counts for all aspects involving this planet
    let aspectsCount = 0;
    transitsByPlanet[planet].forEach((transit) => {
      if (transit.transitTypeId) {
        aspectsCount += journalEntriesByTransitType[transit.transitTypeId] || 0;
      }
    });

    return {
      position: positionCount,
      aspects: aspectsCount,
    };
  };

  // Sort positions by traditional astrological importance
  const sortedPositions = [...planetPositions].sort(
    (a, b) => getPlanetImportance(a.planet) - getPlanetImportance(b.planet)
  );

  // Filter positions if needed
  const filteredPositions =
    filter === "all"
      ? sortedPositions
      : sortedPositions.filter((position) => position.planet === filter);

  if (isLoading) {
    return (
      <div className="planet-view">
        <div className="loading-indicator">
          <div className="loading-spinner"></div>
          <p>Loading planetary data...</p>
        </div>
      </div>
    );
  }

  if (planetPositions.length === 0) {
    return (
      <div className="planet-view">
        <div className="empty-state">
          <p>No planetary data available for this date.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="planet-view">
      <div className="planet-filters">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Planets
        </button>

        {sortedPositions.slice(0, 5).map((position) => (
          <button
            key={position.planet}
            className={`filter-btn ${
              filter === position.planet ? "active" : ""
            } ${position.planet.toLowerCase()}-filter`}
            onClick={() => setFilter(position.planet)}
          >
            {position.planet}
          </button>
        ))}

        {sortedPositions.length > 5 && (
          <div className="dropdown">
            <button className="dropdown-toggle">More ▼</button>
            <div className="dropdown-menu">
              {sortedPositions.slice(5).map((position) => (
                <button
                  key={position.planet}
                  className={`dropdown-item ${
                    filter === position.planet ? "active" : ""
                  }`}
                  onClick={() => setFilter(position.planet)}
                >
                  {position.planet}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="planets-grid">
        {filteredPositions.map((position) => (
          <div key={position.planet} className="planet-card-wrapper">
            <PlanetCard
              position={position}
              aspects={transitsByPlanet[position.planet]}
              journalEntryCount={getJournalCounts(position.planet, position)}
              onAddJournal={onAddJournal}
              onViewEntries={onViewEntries}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanetView;
