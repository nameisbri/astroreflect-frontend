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
  addMonths,
} from "date-fns";
import { fetchTransits, fetchPlanetPosition } from "../../services/api";
import "./Calendar.scss";
import { Transit, Planet, ZodiacSign } from "../../types/astrology";
import { formatShortDate } from "../../utils/dateUtils";

const Calendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [transits, setTransits] = useState<Transit[]>([]);
  const [planetPositions, setPlanetPositions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Load planet positions when a day is selected
  useEffect(() => {
    const loadPlanetPositions = async () => {
      if (!selectedDay) return;

      try {
        // Create placeholder positions for each planet
        // In a real implementation, you would fetch these from your API
        const positions = await Promise.all(
          Object.values(Planet).map(async (planet) => {
            try {
              // Attempt to fetch from API
              const position = await fetchPlanetPosition(planet, selectedDay);
              return position;
            } catch (err) {
              // Fallback to mock data if API fails
              console.error(`Error fetching position for ${planet}:`, err);

              // Generate realistic date ranges for planet in sign and house
              const signEntryDate = addDays(
                selectedDay,
                -Math.floor(Math.random() * 30) - 1
              );
              const signExitDate = addDays(
                selectedDay,
                Math.floor(Math.random() * 60) + 1
              );

              const houseEntryDate = addDays(
                selectedDay,
                -Math.floor(Math.random() * 15) - 1
              );
              const houseExitDate = addDays(
                selectedDay,
                Math.floor(Math.random() * 30) + 1
              );

              // Generate a realistic house number based on the sign
              // (Houses roughly correspond to signs, but not exactly)
              const signIndex = Object.values(ZodiacSign).indexOf(
                getMockSign(planet) as ZodiacSign
              );
              let house = signIndex + 1;
              // Add some randomness to house placement
              house = ((house + Math.floor(Math.random() * 3) - 1) % 12) + 1;

              return {
                planet,
                sign: {
                  name: getMockSign(planet),
                  ruler: getMockRuler(planet),
                  element: getMockElement(planet),
                  degreeInSign: Math.random() * 29,
                  percentInSign: Math.random(),
                },
                house,
                houseDetails: {
                  entryDate: houseEntryDate,
                  exitDate: houseExitDate,
                },
                signDetails: {
                  entryDate: signEntryDate,
                  exitDate: signExitDate,
                },
                retrograde: {
                  isRetrograde: Math.random() > 0.7,
                  status: Math.random() > 0.7 ? "Retrograde" : "Direct",
                  speed: Math.random() * 2 - 1,
                },
              };
            }
          })
        );

        setPlanetPositions(positions);
      } catch (err) {
        console.error("Failed to fetch planet positions:", err);
      }
    };

    loadPlanetPositions();
  }, [selectedDay]);

  // Mock helpers for generating placeholder data
  const getMockSign = (planet: Planet): string => {
    const signs = Object.values(ZodiacSign);
    const index = (Object.values(Planet).indexOf(planet) * 3) % signs.length;
    return signs[index];
  };

  const getMockRuler = (planet: Planet): Planet => {
    const planets = Object.values(Planet);
    const index = (Object.values(Planet).indexOf(planet) + 2) % planets.length;
    return planets[index];
  };

  const getMockElement = (planet: Planet): string => {
    const elements = ["Fire", "Earth", "Air", "Water"];
    const index = Object.values(Planet).indexOf(planet) % elements.length;
    return elements[index];
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

  // Handle day click
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    const dayTransits = getTransitsForDay(day);
    setSelectedDayTransits(dayTransits);
    console.log(`Selected day: ${format(day, "yyyy-MM-dd")}`);
    console.log("Transits for selected day:", dayTransits);
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
    if (!selectedDay || planetPositions.length === 0) return null;

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
                  <div className="date-range">
                    {formatShortDate(position.signDetails?.entryDate)} -{" "}
                    {formatShortDate(position.signDetails?.exitDate)}
                  </div>
                </div>

                <div className="position-house">
                  <div className="detail-label">House:</div>
                  <div className="detail-value">{position.house || "1"}</div>
                  <div className="date-range">
                    {formatShortDate(position.houseDetails?.entryDate)} -{" "}
                    {formatShortDate(position.houseDetails?.exitDate)}
                  </div>
                </div>
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
