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
import { fetchTransits, fetchDailySnapshot } from "../../services/api";
import "./Calendar.scss";
import { Transit, Planet, PlanetPosition } from "../../types/astrology";
import { formatShortDate } from "../../utils/dateUtils";

const Calendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [transits, setTransits] = useState<Transit[]>([]);
  const [planetPositions, setPlanetPositions] = useState<PlanetPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDay, setIsLoadingDay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayTransits, setSelectedDayTransits] = useState<Transit[]>([]);

  // Load transits for the current week and today's details on initial load
  useEffect(() => {
    const loadTransits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const start = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Start on Monday
        const end = endOfWeek(currentWeek, { weekStartsOn: 1 }); // End on Sunday

        console.log(
          `Fetching transits from ${start.toISOString()} to ${end.toISOString()}`
        );

        const transitData = await fetchTransits(start, end);
        console.log("API returned transits:", transitData);

        setTransits(transitData);
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

  // Function to navigate to today
  const handleTodayClick = () => {
    const today = new Date();
    setCurrentWeek(today);
    loadDailyData(today);
  };

  // Navigation functions
  const handlePreviousWeek = () => {
    setCurrentWeek((prevWeek) => addWeeks(prevWeek, -1));
    setSelectedDay(null);
  };

  const handleNextWeek = () => {
    setCurrentWeek((prevWeek) => addWeeks(prevWeek, 1));
    setSelectedDay(null);
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
        console.warn("No planet positions returned from API");
      }

      if (snapshot && Array.isArray(snapshot.transits)) {
        setSelectedDayTransits(snapshot.transits);
      } else {
        // Fallback to the previous method if no transits in snapshot
        const dayTransits = getTransitsForDay(day);
        setSelectedDayTransits(dayTransits);
      }

      console.log(`Loaded data for: ${format(day, "yyyy-MM-dd")}`);
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
    // Assuming we're roughly in the middle of the retrograde period
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

  // Render the transit indicators for a day
  const renderTransitIndicators = (day: Date) => {
    const dayTransits = getTransitsForDay(day);

    if (dayTransits.length === 0) return null;

    // Sort transits by importance and take the top 3
    const sortedTransits = [...dayTransits].sort((a, b) => {
      // First compare by planetA importance
      const planetAImportance =
        getPlanetImportance(a.planetA) - getPlanetImportance(b.planetA);
      if (planetAImportance !== 0) return planetAImportance;

      // Then by planetB importance
      return (
        getPlanetImportance(a.planetB || Planet.SUN) -
        getPlanetImportance(b.planetB || Planet.SUN)
      );
    });

    const topTransits = sortedTransits.slice(0, 3);

    return (
      <div className="transit-indicators">
        {topTransits.map((transit, index) => (
          <div
            key={index}
            className={`transit-symbol ${transit.planetA.toLowerCase()}`}
            title={`${transit.planetA} ${transit.aspect} ${transit.planetB}`}
          >
            {getPlanetSymbol(transit.planetA)}
            {transit.aspect && getAspectSymbol(transit.aspect)}
            {transit.planetB && getPlanetSymbol(transit.planetB)}
          </div>
        ))}
        {dayTransits.length > 3 && (
          <div className="transit-more">+{dayTransits.length - 3}</div>
        )}
      </div>
    );
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
                  <button className="add-journal-button">Add Entry</button>
                  <button className="view-entries-button">View Entries</button>
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

    if (isLoadingDay) {
      return <div className="loading-transits">Loading transit details...</div>;
    }

    // Filter to only include two-planet transits
    const aspectTransits = selectedDayTransits.filter(
      (transit) => transit.planetB
    );

    if (aspectTransits.length === 0) {
      return (
        <div className="no-transits">
          No planetary aspects on {format(selectedDay, "EEEE, MMMM d, yyyy")}
        </div>
      );
    }

    return (
      <div className="aspect-transits">
        <h3>Planetary Aspects</h3>
        <div className="transit-grid">
          {aspectTransits.map((transit, index) => (
            <div className="transit-card" key={index}>
              <div className="transit-card-header">
                <h4>
                  {transit.planetA} {transit.aspect} {transit.planetB}
                </h4>
              </div>
              <div className="transit-dates">
                <div className="exact-date">
                  <span className="date-label">Exact:</span>
                  <span>{formatShortDate(transit.exactDate)}</span>
                </div>
                <div className="transit-description">
                  {transit.description && (
                    <p className="description-text">{transit.description}</p>
                  )}
                </div>
              </div>
              <div className="transit-actions">
                <button className="add-journal-button">
                  Add Journal Entry
                </button>
                <button className="view-entries-button">
                  View Past Entries
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="week-calendar">
      <div className="calendar-header">
        <div className="calendar-nav-left">
          <button className="calendar-nav-button" onClick={handlePreviousWeek}>
            &lt; Previous Week
          </button>
        </div>
        <h2>
          {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")} -{" "}
          {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d, yyyy")}
        </h2>
        <div className="calendar-nav-right">
          <button
            className="calendar-nav-button today-button"
            onClick={handleTodayClick}
          >
            Today
          </button>
          <button className="calendar-nav-button" onClick={handleNextWeek}>
            Next Week &gt;
          </button>
        </div>
      </div>

      {isLoading && <div className="loading">Loading transits...</div>}
      {error && <div className="error">{error}</div>}

      <div className="week-grid">
        {getDaysInWeek().map((day) => {
          const dayNumber = day.getDate();
          const isCurrentDay = isToday(day);
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
          const dayTransits = getTransitsForDay(day);

          return (
            <div
              key={day.toString()}
              className={`week-day ${isCurrentDay ? "current-day" : ""} ${
                isSelected ? "selected-day" : ""
              } ${dayTransits.length > 0 ? "has-transits" : ""}`}
              onClick={() => handleDayClick(day)}
            >
              <div className="day-header">
                <span className="day-name">{format(day, "EEE")}</span>
                <span className="day-number">{dayNumber}</span>
              </div>
              {renderTransitIndicators(day)}
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="selected-day-details">
          {renderPlanetPositions()}
          {renderAspectTransits()}
        </div>
      )}
    </div>
  );
};

export default Calendar;
