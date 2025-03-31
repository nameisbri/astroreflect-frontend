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
import { formatShortDate } from "../../utils/dateUtils";
import { parseFlexibleDate } from "../../utils/dateUtils";
import JournalEntryForm from "../JournalEntry/JournalEntryForm";
import SimplifiedEntryModal from "../SimplifiedEntryModal/SimplifiedEntryModal";
import PlanetView from "../PlanetView/PlanetView";
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

        // Process the entries data to ensure dates are properly parsed
        const processedEntriesData: Record<string, JournalEntry[]> = {};

        // Process each day's entries
        Object.entries(entriesData).forEach(([day, entries]) => {
          // Properly parse the dates for each entry
          const processedEntries = entries.map((entry) => ({
            ...entry,
            createdAt: parseFlexibleDate(entry.createdAt) || entry.createdAt,
            updatedAt: parseFlexibleDate(entry.updatedAt) || entry.updatedAt,
          }));

          processedEntriesData[day] = processedEntries;
        });

        setJournalEntriesByDay(processedEntriesData);
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

    // Close the entry modal if it's open
    setShowEntryModal(false);
    setEntryModalData(null);
  };

  const handleSaveJournal = async () => {
    setShowJournalForm(false);
    setSelectedJournalTransit(null);

    // Reload journal entries for the selected day to show the new entry
    if (selectedDay) {
      try {
        const entries = await fetchJournalEntriesByDate(selectedDay);

        // Use entries as-is without additional processing
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

  // Function to handle viewing entries with the modal
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
  };

  // Function to close the entry modal
  const handleCloseEntryModal = () => {
    setShowEntryModal(false);
    setEntryModalData(null);
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

        // Don't try to process the entries - use them as-is
        // The API is already returning dates in ISO format
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

          {/* New Planet-centric view */}
          <PlanetView
            planetPositions={planetPositions}
            transits={selectedDayTransits}
            journalEntriesByTransitType={getJournalEntriesCountByTransitType()}
            isLoading={isLoadingDay}
            onAddJournal={handleAddJournal}
            onViewEntries={handleViewEntries}
          />
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

      {/* Simplified Entry Modal */}
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
