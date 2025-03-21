import { useState } from "react";
import Calendar from "../components/Calendar/Calendar";
import TransitCard from "../components/TransitCard/TransitCard";
import JournalEntry from "../components/JournalEntry/JournalEntry";
import Layout from "../components/Layout/Layout";
import { Transit } from "../types/astrology";
import "./pages.scss";

const CalendarPage = () => {
  const [selectedTransit, setSelectedTransit] = useState<Transit | null>(null);
  const [showJournalForm, setShowJournalForm] = useState(false);

  const handleTransitClick = (transit: Transit) => {
    setSelectedTransit(transit);
    setShowJournalForm(false);
  };

  const handleCloseTransit = () => {
    setSelectedTransit(null);
  };

  const handleAddJournal = (transitId: string, transitTypeId: string) => {
    if (selectedTransit) {
      setShowJournalForm(true);
    }
  };

  const handleSaveJournal = () => {
    // Close the journal form and refresh the transit card to show the new entry
    setShowJournalForm(false);

    // Note: In a real application, you might want to fetch the updated entries
    // or use a state management library to update the UI
  };

  const handleCancelJournal = () => {
    setShowJournalForm(false);
  };

  return (
    <Layout>
      <div className="calendar-page">
        <div className="page-header">
          <h1>Transit Calendar</h1>
          <p>
            Track planetary transits and add journal entries for significant
            astrological events.
          </p>
        </div>

        <div className="calendar-container">
          <Calendar onTransitClick={handleTransitClick} />
        </div>

        {selectedTransit && (
          <div className="modal-overlay" onClick={handleCloseTransit}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {showJournalForm ? (
                <JournalEntry
                  transitId={selectedTransit.id}
                  transitTypeId={selectedTransit.transitTypeId}
                  onSave={handleSaveJournal}
                  onCancel={handleCancelJournal}
                />
              ) : (
                <TransitCard
                  transit={selectedTransit}
                  onClose={handleCloseTransit}
                  onAddJournal={handleAddJournal}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CalendarPage;
