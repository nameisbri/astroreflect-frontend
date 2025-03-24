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
  addDays,
} from "date-fns";
import { fetchTransits, fetchDailySnapshot } from "../../services/api";
import "./Calendar.scss";
import {
  Transit,
  Planet,
  ZodiacSign,
  PlanetPosition,
} from "../../types/astrology";
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

  // Load transits for the current week
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
  }, [currentWeek]);

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

  // Handle day click - now uses the daily-snapshot endpoint
  const handleDayClick = async (day: Date) => {
    setSelectedDay(day);
    setIsLoadingDay(true);

    try {
      // Use the new daily-snapshot endpoint to get both planet positions and transits
      const snapshot = await fetchDailySnapshot(day);

      // Update state with the fetched data
      setPlanetPositions(snapshot.positions);
      setSelectedDayTransits(snapshot.transits);

      console.log(`Selected day: ${format(day, "yyyy-MM-dd")}`);
      console.log("Daily snapshot:", snapshot);
    } catch (err) {
      console.error("Failed to fetch daily snapshot:", err);

      // Fallback to the previous method if the snapshot endpoint fails
      const dayTransits = getTransitsForDay(day);
      setSelectedDayTransits(dayTransits);
      console.log("Fallback - Transits for selected day:", dayTransits);
    } finally {
      setIsLoadingDay(false);
    }
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
            {getAspectSymbol(transit.aspect || "")}
            {getPlanetSymbol(transit.planetB || Planet.SUN)}
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
          {planetPositions.map((position, index) => (
            <div key={index} className="planet-card">
              <div className="planet-header">
                <div className="planet-symbol">
                  {getPlanetSymbol(position.planet)}
                </div>
                <div className="planet-name">{position.planet}</div>
                <div className="retrograde-status">
                  {position.retrograde?.isRetrograde ? "Retrograde" : "Direct"}
                </div>
              </div>

              <div className="position-details">
                <div className="position-sign">
                  <div className="detail-label">Sign:</div>
                  <div className="detail-value">
                    {getZodiacSymbol(position.sign?.name || "Aries")}{" "}
                    {position.sign?.name || "Aries"}
                  </div>
                  {position.signDuration && (
                    <div className="date-range">
                      {formatShortDate(position.signDuration.entryDate)} -{" "}
                      {formatShortDate(position.signDuration.exitDate)}
                    </div>
                  )}
                </div>

                {position.house && (
                  <div className="position-house">
                    <div className="detail-label">House:</div>
                    <div className="detail-value">
                      {position.house.number || "1"}
                    </div>
                    <div className="date-range">
                      {formatShortDate(position.house.entryDate)} -{" "}
                      {formatShortDate(position.house.exitDate)}
                    </div>
                  </div>
                )}
              </div>

              <div className="planet-actions">
                <button className="add-journal-button">Add Entry</button>
                <button className="view-entries-button">View Entries</button>
              </div>
            </div>
          ))}
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
                <div className="date-range">
                  <span className="date-label">Active:</span>
                  <span>
                    {formatShortDate(transit.startDate)} -{" "}
                    {formatShortDate(transit.endDate)}
                  </span>
                </div>
                <div className="exact-date">
                  <span className="date-label">Exact:</span>
                  <span>{formatShortDate(transit.exactDate)}</span>
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
        <button className="calendar-nav-button" onClick={handlePreviousWeek}>
          &lt; Previous Week
        </button>
        <h2>
          {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")} -{" "}
          {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d, yyyy")}
        </h2>
        <button className="calendar-nav-button" onClick={handleNextWeek}>
          Next Week &gt;
        </button>
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
