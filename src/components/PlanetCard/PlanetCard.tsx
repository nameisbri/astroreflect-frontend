import { useState } from "react";
import { Planet, PlanetPosition, Transit } from "../../types/astrology";
import { formatShortDate } from "../../utils/dateUtils";
import ActionButton from "../ActionButton/ActionButton";
import {
  getAspectSymbol,
  getPlanetSymbol,
  getZodiacSymbol,
} from "../../utils/symbolUtils";
import "./PlanetCard.scss";

interface PlanetCardProps {
  position: PlanetPosition;
  aspects: Transit[];
  journalEntryCount: {
    position: number;
    aspects: number;
  };
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

const PlanetCard = ({
  position,
  aspects,
  journalEntryCount,
  onAddJournal,
  onViewEntries,
}: PlanetCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate transit type ID for position
  const positionTransitTypeId = `${position.planet}_IN_${
    position.sign?.name || "Aries"
  }`;

  // Sort aspects by importance/intensity
  const sortedAspects = [...aspects].sort((a, b) => {
    // Prioritize exact aspects
    const aIsExact =
      new Date(a.exactDate).toDateString() === new Date().toDateString();
    const bIsExact =
      new Date(b.exactDate).toDateString() === new Date().toDateString();

    if (aIsExact && !bIsExact) return -1;
    if (!aIsExact && bIsExact) return 1;

    // Then by intensity if available
    if (a.intensity !== undefined && b.intensity !== undefined) {
      return b.intensity - a.intensity;
    }

    return 0;
  });

  // Generate a planet-specific class for styling
  const planetClass = `${position.planet.toLowerCase()}-card`;

  return (
    <div
      className={`planet-card ${planetClass} ${isExpanded ? "expanded" : ""}`}
    >
      <div className="planet-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="planet-symbol">{getPlanetSymbol(position.planet)}</div>
        <div className="planet-name">
          {position.planet}
          {aspects.length > 0 && (
            <span className="aspect-count">{aspects.length}</span>
          )}
        </div>
        {position.retrograde?.isRetrograde && (
          <div className="retrograde-status">↺ Retrograde</div>
        )}
        <div className="expand-icon">{isExpanded ? "▼" : "▶"}</div>
      </div>

      <div className="planet-position">
        <div className="position-sign">
          <span className="position-label">
            {getZodiacSymbol(position.sign?.name || "Aries")}{" "}
            {position.sign?.name || "Aries"}{" "}
            {position.sign?.degreeInSign
              ? `${Math.floor(position.sign.degreeInSign)}°`
              : ""}
          </span>

          {position.signDuration && (
            <span className="position-date">
              until {formatShortDate(position.signDuration.exitDate)}
            </span>
          )}
        </div>

        <div className="position-actions">
          <ActionButton
            variant="secondary"
            icon="📓"
            badgeCount={journalEntryCount.position}
            onClick={(e) => {
              const modalData = {
                id: crypto.randomUUID(),
                transitTypeId: positionTransitTypeId,
                title: `${position.planet} in ${
                  position.sign?.name || "Aries"
                }`,
                description: `${position.planet} is moving through ${
                  position.sign?.name || "Aries"
                }, bringing ${(
                  position.sign?.name || "Aries"
                ).toLowerCase()} qualities to ${position.planet.toLowerCase()}-related matters.`,
                planet: position.planet,
                sign: position.sign?.name || "Aries",
              };
              onViewEntries(modalData, true, e);
            }}
          >
            View
          </ActionButton>

          <ActionButton
            variant="accent"
            icon="✏️"
            onClick={() => {
              const placeholderId = crypto.randomUUID();
              onAddJournal(
                placeholderId,
                positionTransitTypeId,
                position.planet
              );
            }}
          >
            Journal
          </ActionButton>
        </div>
      </div>

      {isExpanded && aspects.length > 0 && (
        <div className="planet-aspects">
          <h4>Aspects ({aspects.length})</h4>
          <div className="aspects-list">
            {sortedAspects.map((aspect, index) => {
              // Determine which planet is the "other" planet in the aspect
              const isFirstPlanet = aspect.planetA === position.planet;
              const otherPlanet = isFirstPlanet
                ? aspect.planetB
                : aspect.planetA;

              if (!otherPlanet) return null;

              return (
                <div
                  key={index}
                  className={`aspect-item ${
                    aspect.aspect?.toLowerCase() || ""
                  }`}
                >
                  <div className="aspect-header">
                    <div className="aspect-planets">
                      <span className="aspect-symbol">
                        {getAspectSymbol(aspect.aspect || "")}
                      </span>
                      <span className="other-planet">{otherPlanet}</span>
                    </div>

                    {aspect.timing && (
                      <span
                        className={`timing-badge ${aspect.timing.toLowerCase()}`}
                      >
                        {aspect.timing}
                      </span>
                    )}
                  </div>

                  <div className="aspect-dates">
                    {aspect.exactDate && (
                      <span className="exact-date">
                        Exact: {formatShortDate(aspect.exactDate)}
                      </span>
                    )}
                  </div>

                  <div className="aspect-actions">
                    <ActionButton
                      variant="secondary"
                      icon="📓"
                      badgeCount={journalEntryCount.aspects}
                      onClick={(e) => {
                        const modalData = {
                          ...aspect,
                          title: `${aspect.planetA} ${aspect.aspect} ${aspect.planetB}`,
                        };
                        onViewEntries(modalData, false, e);
                      }}
                    >
                      View
                    </ActionButton>

                    <ActionButton
                      variant="accent"
                      icon="✏️"
                      onClick={() => {
                        onAddJournal(
                          aspect.id,
                          aspect.transitTypeId || "",
                          aspect.planetA,
                          aspect.planetB,
                          aspect.aspect
                        );
                      }}
                    >
                      Journal
                    </ActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isExpanded && aspects.length === 0 && (
        <div className="no-aspects-message">
          No current aspects for {position.planet}
        </div>
      )}
    </div>
  );
};

export default PlanetCard;
