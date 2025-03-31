import { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  addWeeks,
  isSameDay,
  parseISO,
} from "date-fns";
import {
  fetchTransits,
  fetchDailySnapshot,
  fetchJournalEntriesByDate,
  fetchJournalEntriesForDateRange,
} from "../../services/api";
import "./Calendar.scss";
import {
  Transit,
  Planet,
  PlanetPosition,
  JournalEntry,
} from "../../types/astrology";
import ActionButton from "../ActionButton/ActionButton";
import { formatShortDate } from "../../utils/dateUtils";
import JournalEntryForm from "../JournalEntry/JournalEntryForm";
import SimplifiedAspectSection from "../SimplifiedAspectSection/SimplifiedAspectSection";
import SimplifiedEntryModal from "../SimplifiedEntryModal/SimplifiedEntryModal";
import { v4 as uuidv4 } from "uuid";

const Calendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [transits, setTransits] = useState<Transit[]>([]);
  const [planetPositions, setPlanetPositions] = useState<PlanetPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDay, setIsLoadingDay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayTransits, setSelectedDayTransits] = useState<Transit[]>([]);
  const [selectedTransit, setSelectedTransit] = useState<Transit | null>(null);
  const [aspectFilter, setAspectFilter] = useState<string>("all");
  const [journalEntriesByDay, setJournalEntriesByDay] = useState<
    Record<string, JournalEntry[]>
  >({});
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [selectedJournalTransit, setSelectedJournalTransit] = useState<{
    transitId: string;
    transitTypeId: string;
    planetA?: Planet;
    planetB?: Planet;
    aspect?: string;
  } | null>(null);
  const [showTransitDetail, setShowTransitDetail] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryModalData, setEntryModalData] = useState<any>(null);

  // Load transits for the current week and today's details on initial load
  useEffect(() => {
    const loadTransits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
        const end = endOfWeek(currentWeek, { weekStartsOn: 1 }); // End on Sunday

        const transitData = await fetchTransits(start, end);
        setTransits(transitData);

        // Fetch journal entries for the week
        const entriesData = await fetchJournalEntriesForDateRange(start, end);
        setJournalEntriesByDay(entriesData);
      } catch (err) {
        console.error("Failed to fetch transits:", err);
        setError("Failed to load transits. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTransits();

    // If it's the initial load (when currentWeek is today's week), load today's data
    if (!selectedDay) {
      const today = new Date();
      loadDailyData(today);
    }
  }, [currentWeek]);

  // Helper function to get journal entries for a specific day
  const getJournalEntriesForDay = (day: Date): JournalEntry[] => {
    const dayKey = format(day, "yyyy-MM-dd");
    return journalEntriesByDay[dayKey] || [];
  };

  const getJournalEntriesCountByTransitType = () => {
    const entriesCount: Record<string, number> = {};

    if (selectedDay) {
      // Iterate through all entries in journalEntriesByDay
      Object.values(journalEntriesByDay).forEach((dayEntries) => {
        dayEntries.forEach((entry) => {
          if (entry.transitTypeId) {
            entriesCount[entry.transitTypeId] =
              (entriesCount[entry.transitTypeId] || 0) + 1;
          }
        });
      });

      // Generate planet-in-sign transit types for all positions
      planetPositions.forEach((position) => {
        const transitTypeId = `${position.planet}_IN_${
          position.sign?.name || "Aries"
        }`;
        if (!entriesCount[transitTypeId]) {
          entriesCount[transitTypeId] = 0;
        }
      });

      console.log("Journal entries by transit type:", entriesCount);
    }

    return entriesCount;
  };

  // Handle journal entry form modal with planet information
  const handleAddJournal = (
    transitId: string,
    transitTypeId: string,
    planetA?: Planet,
    planetB?: Planet,
    aspect?: string
  ) => {
    setSelectedJournalTransit({
      transitId,
      transitTypeId,
      planetA,
      planetB,
      aspect,
    });
    setShowJournalForm(true);
    // Close the transit detail if it's open
    setSelectedTransit(null);
    setShowTransitDetail(false);
  };

  const handleSaveJournal = async () => {
    setShowJournalForm(false);
    setSelectedJournalTransit(null);

    // Reload journal entries for the selected day to show the new entry
    if (selectedDay) {
      try {
        const entries = await fetchJournalEntriesByDate(selectedDay);
        const dayKey = format(selectedDay, "yyyy-MM-dd");
        setJournalEntriesByDay((prev) => ({
          ...prev,
          [dayKey]: entries,
        }));
      } catch (error) {
        console.error("Failed to refresh journal entries:", error);
      }
    }
  };
  // New function to handle viewing entries with simplified modal
  const handleViewEntries = (
    data: any,
    isPlanetPosition: boolean = false,
    event?: React.MouseEvent
  ) => {
    // Prevent event propagation to avoid double modal
    if (event) {
      event.stopPropagation();
    }

    // Format the data consistently for both planet positions and transits
    const modalData = {
      ...data,
      isPlanetPosition,
      // Make sure these fields exist for proper keyword display
      planetA: data.planetA || data.planet,
      planetB: data.planetB,
      aspect: data.aspect,
    };

    setEntryModalData(modalData);
    setShowEntryModal(true);

    // Make sure other modals are closed
    setShowJournalForm(false);
  };

  // Function to close the entry modal
  const handleCloseEntryModal = () => {
    setShowEntryModal(false);
    setEntryModalData(null);
  };

  const handleViewTransitDetail = (transit: Transit) => {
    setSelectedTransit(transit);
    setShowTransitDetail(true);
  };

  const handleCloseTransitDetail = () => {
    setSelectedTransit(null);
    setShowTransitDetail(false);
  };

  // Function to navigate to today
  const handleTodayClick = () => {
    const today = new Date();
    setCurrentWeek(today);
    loadDailyData(today);
  };

  // Navigation functions
  const handlePreviousWeek = () => {
    setCurrentWeek((prevWeek) => addWeeks(prevWeek, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeek((prevWeek) => addWeeks(prevWeek, 1));
  };

  // Get days in the current week
  const getDaysInWeek = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  // Get transits for a specific day
  const getTransitsForDay = (day: Date) => {
    return transits.filter((transit) => {
      const startDate =
        typeof transit.startDate === "string"
          ? parseISO(transit.startDate)
          : transit.startDate;
      const endDate =
        typeof transit.endDate === "string"
          ? parseISO(transit.endDate)
          : transit.endDate;

      return day >= startDate && day <= endDate;
    });
  };

  // Load daily data for a specific day
  const loadDailyData = async (day: Date) => {
    setSelectedDay(day);
    setIsLoadingDay(true);

    try {
      // Use the daily-snapshot endpoint to get both planet positions and transits
      const snapshot = await fetchDailySnapshot(day);

      // Check if data is valid
      if (snapshot && Array.isArray(snapshot.positions)) {
        setPlanetPositions(snapshot.positions);
      } else {
        setPlanetPositions([]);
      }

      if (snapshot && Array.isArray(snapshot.transits)) {
        setSelectedDayTransits(snapshot.transits);
      } else {
        // Fallback to the previous method if no transits in snapshot
        const dayTransits = getTransitsForDay(day);
        setSelectedDayTransits(dayTransits);
      }

      // Fetch journal entries for the selected day if not already loaded
      const dayKey = format(day, "yyyy-MM-dd");
      if (!journalEntriesByDay[dayKey]) {
        const entries = await fetchJournalEntriesByDate(day);
        setJournalEntriesByDay((prev) => ({
          ...prev,
          [dayKey]: entries,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch daily snapshot:", err);
      // Fallback to the previous method if the snapshot endpoint fails
      const dayTransits = getTransitsForDay(day);
      setSelectedDayTransits(dayTransits);
      setPlanetPositions([]);
    } finally {
      setIsLoadingDay(false);
    }
  };

  // Handle day click
  const handleDayClick = (day: Date) => {
    loadDailyData(day);
  };

  // Combined transit and journal indicator
  const renderTransitIndicator = (day: Date) => {
    const dayTransits = getTransitsForDay(day);
    if (dayTransits.length === 0) return null;

    // Get journal entries for this day
    const journalEntries = getJournalEntriesForDay(day);
    const hasJournalEntry = journalEntries.length > 0;

    // Count exact transits on this day
    const exactToday = dayTransits.filter((transit) => {
      const exactDate =
        typeof transit.exactDate === "string"
          ? parseISO(transit.exactDate)
          : transit.exactDate;
      return isSameDay(exactDate, day);
    }).length;

    return (
      <div className="transit-indicators">
        <div className="indicator-row">
          {/* Calendar marker dots */}
          <div className="calendar-markers">
            {Array.from({ length: Math.min(dayTransits.length, 3) }).map(
              (_, i) => (
                <span key={i} className="calendar-dot"></span>
              )
            )}
          </div>

          {/* Exact transit marker */}
          {exactToday > 0 && <span className="exact-marker">★</span>}
        </div>

        {/* Journal entry indicator */}
        {hasJournalEntry && (
          <div className="journal-indicator">
            <span className="journal-dot"></span>
            {journalEntries.length > 1 && (
              <span className="entry-count">{journalEntries.length}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Get an icon/symbol for the planet
  const getPlanetSymbol = (planet: Planet) => {
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

  // Get an icon/symbol for the aspect
  const getAspectSymbol = (aspect: string) => {
    const aspectSymbols: Record<string, string> = {
      "Conjunction": "☌",
      "Sextile": "⚹",
      "Square": "□",
      "Trine": "△",
      "Opposition": "☍",
    };
    return aspectSymbols[aspect] || aspect.charAt(0);
  };

  // Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;

    if (j === 1 && k !== 11) {
      return "st";
    }
    if (j === 2 && k !== 12) {
      return "nd";
    }
    if (j === 3 && k !== 13) {
      return "rd";
    }
    return "th";
  };

  // Estimate the direct date for a retrograde planet if not provided
  const estimateDirectDate = (planet: Planet): Date => {
    const today = new Date();
    // Approximate durations of retrograde periods in days
    const retrogradeDurations: Record<Planet, number> = {
      [Planet.MERCURY]: 24,
      [Planet.VENUS]: 42,
      [Planet.MARS]: 72,
      [Planet.JUPITER]: 120,
      [Planet.SATURN]: 140,
      [Planet.URANUS]: 155,
      [Planet.NEPTUNE]: 158,
      [Planet.PLUTO]: 160,
      [Planet.SUN]: 0, // Sun and Moon don't go retrograde
      [Planet.MOON]: 0,
    };

    // Add half the retrograde duration to today to estimate when it goes direct
    const duration = retrogradeDurations[planet] || 0;
    const result = new Date(today);
    result.setDate(result.getDate() + Math.floor(duration / 2));
    return result;
  };

  // Get a symbol for the zodiac sign
  const getZodiacSymbol = (sign: string) => {
    const signSymbols: Record<string, string> = {
      "Aries": "♈",
      "Taurus": "♉",
      "Gemini": "♊",
      "Cancer": "♋",
      "Leo": "♌",
      "Virgo": "♍",
      "Libra": "♎",
      "Scorpio": "♏",
      "Sagittarius": "♐",
      "Capricorn": "♑",
      "Aquarius": "♒",
      "Pisces": "♓",
    };
    return signSymbols[sign] || sign.charAt(0);
  };

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

  // Render the planet positions grid for the selected day
  const renderPlanetPositions = () => {
    if (!selectedDay || planetPositions.length === 0) {
      if (isLoadingDay) {
        return (
          <div className="loading-positions">Loading planet positions...</div>
        );
      }
      return null;
    }

    return (
      <div className="planet-positions">
        <h3>
          Planet Positions for {format(selectedDay, "EEEE, MMMM d, yyyy")}
        </h3>
        <div className="planet-grid">
          {planetPositions.map((position, index) => {
            // Determine planet-specific class for styling
            const planetClass = `${position.planet.toLowerCase()}-card`;

            return (
              <div key={index} className={`planet-card ${planetClass}`}>
                <div className="planet-header">
                  <div className="planet-symbol">
                    {getPlanetSymbol(position.planet)}
                  </div>
                  <div className="planet-name">{position.planet}</div>
                  {position.retrograde?.isRetrograde && (
                    <div className="retrograde-status">Retrograde</div>
                  )}
                </div>

                <div className="position-details">
                  <div className="position-sign">
                    <div className="detail-label">Sign</div>
                    <div className="detail-value">
                      {getZodiacSymbol(position.sign?.name || "Aries")}{" "}
                      {position.sign?.name || "Aries"}{" "}
                      {position.sign?.degreeInSign
                        ? `(${Math.floor(position.sign.degreeInSign)}°)`
                        : ""}
                    </div>
                    {position.signDuration && (
                      <div className="date-range">
                        In {position.sign?.name} until{" "}
                        {formatShortDate(position.signDuration.exitDate)}
                      </div>
                    )}
                  </div>

                  {position.house && (
                    <div className="position-house">
                      <div className="detail-label">House</div>
                      <div className="detail-value">
                        {position.house.number || "1"}
                        {getOrdinalSuffix(position.house.number || 1)} House
                      </div>
                    </div>
                  )}

                  {position.retrograde?.isRetrograde && (
                    <div className="position-retrograde">
                      <div className="detail-label">Retrograde</div>
                      <div className="retrograde-until">
                        Until{" "}
                        {formatShortDate(estimateDirectDate(position.planet))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="planet-actions">
                  <ActionButton
                    variant="accent"
                    icon="✏️"
                    onClick={() => {
                      // Create a placeholder transit for planet position entries
                      const placeholderId = uuidv4();
                      const transitTypeId = `${position.planet}_IN_${
                        position.sign?.name || "Aries"
                      }`;
                      handleAddJournal(
                        placeholderId,
                        transitTypeId,
                        position.planet
                      );
                    }}
                  >
                    Add Entry
                  </ActionButton>

                  <ActionButton
                    variant="secondary"
                    icon="📓"
                    badgeCount={
                      getJournalEntriesCountByTransitType()[
                        `${position.planet}_IN_${
                          position.sign?.name || "Aries"
                        }`
                      ] || 0
                    }
                    onClick={(e) => {
                      // Prepare data for the modal
                      const modalData = {
                        id: uuidv4(), // Generate a unique ID for this view
                        transitTypeId: `${position.planet}_IN_${
                          position.sign?.name || "Aries"
                        }`,
                        title: `${position.planet} in ${
                          position.sign?.name || "Aries"
                        }`,
                        description: `${position.planet} is moving through ${
                          position.sign?.name || "Aries"
                        }, infusing ${position.planet.toLowerCase()}-related matters with ${(
                          position.sign?.name || "Aries"
                        ).toLowerCase()} qualities.`,
                        planet: position.planet,
                        sign: position.sign?.name || "Aries",
                      };

                      handleViewEntries(modalData, true, e);
                    }}
                  >
                    View Entries
                  </ActionButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render the aspect transits (transits between two planets) for the selected day
  const renderAspectTransits = () => {
    if (!selectedDay) return null;

    return (
      <SimplifiedAspectSection
        transits={selectedDayTransits}
        isLoading={isLoadingDay}
        selectedDay={selectedDay}
        journalEntriesByTransitType={getJournalEntriesCountByTransitType()}
        onViewTransit={(transit) => {
          console.log(
            "Calendar: onViewTransit called with transit:",
            transit.id,
            "type:",
            transit.transitTypeId
          );

          // Make sure we have a transitTypeId - it's crucial for retrieving entries
          if (!transit.transitTypeId) {
            console.error("Missing transitTypeId for transit:", transit.id);
            // You might want to show an error message to the user here
            return;
          }

          // Modified to use the more appropriate simplified entry modal with clearer reference to transitTypeId
          const modalData = {
            ...transit,
            title: `${transit.planetA} ${transit.aspect} ${transit.planetB}`,
            // Ensure the transitTypeId is properly included
            transitTypeId: transit.transitTypeId,
          };

          console.log("Setting modal data:", modalData);
          setEntryModalData(modalData);
          setShowEntryModal(true);
        }}
        onAddJournal={(transitId, transitTypeId, transit) => {
          console.log(
            "Calendar: onAddJournal called with transit:",
            transit?.planetA,
            transit?.aspect,
            transit?.planetB
          );

          handleAddJournal(
            transitId,
            transitTypeId,
            transit?.planetA,
            transit?.planetB,
            transit?.aspect
          );
        }}
      />
    );
  };
  // Render calendar legend to explain the indicators
  const renderCalendarLegend = () => (
    <div className="calendar-legend">
      <div className="legend-item">
        <div className="calendar-markers">
          <span className="calendar-dot"></span>
          <span className="calendar-dot"></span>
        </div>
        <span className="legend-text">Transit count</span>
      </div>

      <div className="legend-item">
        <span className="exact-marker">★</span>
        <span className="legend-text">Exact transit</span>
      </div>

      <div className="legend-item">
        <div className="journal-indicator">
          <span className="journal-dot"></span>
          <span className="entry-count">2</span>
        </div>
        <span className="legend-text">Journal entries</span>
      </div>
    </div>
  );

  return (
    <div className="week-calendar simplified">
      {/* Simplified Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-title">
          <h2>
            {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMMM yyyy")}
          </h2>
          <div className="date-range">
            {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")} -{" "}
            {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")}
          </div>
        </div>

        <div className="calendar-controls">
          <button
            className="calendar-nav-button prev-button"
            onClick={handlePreviousWeek}
            aria-label="Previous Week"
          >
            ←
          </button>

          <button
            className="calendar-nav-button today-button"
            onClick={handleTodayClick}
          >
            Today
          </button>

          <button
            className="calendar-nav-button next-button"
            onClick={handleNextWeek}
            aria-label="Next Week"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar legend */}
      {renderCalendarLegend()}

      {isLoading ? (
        <div className="loading">Loading weekly transits...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="week-grid">
          {/* Day headers */}
          <div className="day-headers">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="day-name">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="days-grid">
            {getDaysInWeek().map((day) => {
              const dayNumber = day.getDate();
              const isCurrentDay = isToday(day);
              const isSelected = selectedDay
                ? isSameDay(day, selectedDay)
                : false;
              const dayTransits = getTransitsForDay(day);
              const hasTransits = dayTransits.length > 0;

              return (
                <div
                  key={day.toString()}
                  className={`day-cell ${isCurrentDay ? "current-day" : ""} ${
                    isSelected ? "selected-day" : ""
                  } ${hasTransits ? "has-transits" : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="day-number">{dayNumber}</span>
                  {hasTransits && renderTransitIndicator(day)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected day info */}
      {selectedDay && (
        <div className="selected-day-details">
          <div className="selected-date-header">
            <h3>{format(selectedDay, "EEEE, MMMM d, yyyy")}</h3>
          </div>
          {renderPlanetPositions()}
          {renderAspectTransits()}
        </div>
      )}

      {/* Journal Entry Form Modal */}
      {showJournalForm && selectedJournalTransit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <JournalEntryForm
              transitId={selectedJournalTransit.transitId}
              transitTypeId={selectedJournalTransit.transitTypeId}
              planetA={selectedJournalTransit.planetA}
              planetB={selectedJournalTransit.planetB}
              aspect={selectedJournalTransit.aspect}
              onSave={handleSaveJournal}
              onCancel={() => setShowJournalForm(false)}
            />
          </div>
        </div>
      )}

      {/* Simplified Entry Modal - replaces both old modals */}
      {showEntryModal && entryModalData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <SimplifiedEntryModal
              data={entryModalData}
              onClose={handleCloseEntryModal}
              onAddJournal={(
                transitId,
                transitTypeId,
                planetA,
                planetB,
                aspect
              ) => {
                handleAddJournal(
                  transitId,
                  transitTypeId,
                  planetA,
                  planetB,
                  aspect
                );
                handleCloseEntryModal();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
