import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  addMonths,
  isSameMonth,
  isWithinInterval,
} from "date-fns";
import { fetchTransits } from "../../services/api";
import "./Calendar.scss";
import { Transit, TransitTiming } from "../../types/astrology";

interface CalendarProps {
  onTransitClick: (transit: Transit) => void;
}

const Calendar = ({ onTransitClick }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transits, setTransits] = useState<Transit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransits = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);

        const transitData = await fetchTransits(start, end);
        setTransits(transitData);
      } catch (err) {
        console.error("Failed to fetch transits:", err);
        setError("Failed to load transits. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTransits();
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const getTransitsForDay = (day: Date) => {
    return transits.filter((transit) => {
      const startDate = new Date(transit.startDate);
      const endDate = new Date(transit.endDate);
      return isWithinInterval(day, { start: startDate, end: endDate });
    });
  };

  const getTransitClassName = (transit: Transit) => {
    let className = "transit-dot";

    // Add color based on planets involved
    if (transit.planetA === "SUN" || transit.planetB === "SUN") {
      className += " sun";
    } else if (transit.planetA === "MOON" || transit.planetB === "MOON") {
      className += " moon";
    } else if (transit.planetA === "MERCURY" || transit.planetB === "MERCURY") {
      className += " mercury";
    }

    // Add intensity class
    if (transit.intensity && transit.intensity > 80) {
      className += " high-intensity";
    } else if (transit.intensity && transit.intensity > 50) {
      className += " medium-intensity";
    }

    // Add timing class
    if (transit.timing === TransitTiming.APPLYING) {
      className += " applying";
    } else if (transit.timing === TransitTiming.SEPARATING) {
      className += " separating";
    }

    return className;
  };

  const renderTransitIndicators = (day: Date) => {
    const dayTransits = getTransitsForDay(day);

    if (dayTransits.length === 0) return null;

    return (
      <div className="transit-indicators">
        {dayTransits.slice(0, 3).map((transit, index) => (
          <div
            key={index}
            className={getTransitClassName(transit)}
            title={`${transit.planetA} ${transit.aspect} ${transit.planetB}`}
            onClick={(e) => {
              e.stopPropagation();
              onTransitClick(transit);
            }}
          />
        ))}
        {dayTransits.length > 3 && (
          <div className="transit-more">+{dayTransits.length - 3}</div>
        )}
      </div>
    );
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="calendar-nav-button" onClick={handlePreviousMonth}>
          &lt;
        </button>
        <h2>{format(currentMonth, "MMMM yyyy")}</h2>
        <button className="calendar-nav-button" onClick={handleNextMonth}>
          &gt;
        </button>
      </div>

      {isLoading && <div className="loading">Loading transits...</div>}
      {error && <div className="error">{error}</div>}

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {getDaysInMonth().map((day) => {
            const dayNumber = day.getDate();
            const isCurrentDay = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={day.toString()}
                className={`calendar-day ${isCurrentDay ? "current-day" : ""} ${
                  !isCurrentMonth ? "other-month" : ""
                }`}
              >
                <span className="day-number">{dayNumber}</span>
                {renderTransitIndicators(day)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
