import Calendar from "../components/Calendar/Calendar";
import Layout from "../components/Layout/Layout";
import "./pages.scss";

const CalendarPage = () => {
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
          <Calendar />
        </div>
      </div>
    </Layout>
  );
};

export default CalendarPage;
