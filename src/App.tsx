import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import "./App.scss";

// Pages/components placeholders
const DashboardPage = () => <div>Dashboard Page</div>;
const CalendarPage = () => <div>Calendar Page</div>;
const TransitDetailPage = () => <div>Transit Detail Page</div>;
const JournalPage = () => <div>Journal Page</div>;

// Placeholder for Navbar component
const Navbar = () => (
  <nav style={{ padding: "1rem", background: "#5c164e", color: "white" }}>
    <h1>AstroReflect</h1>
  </nav>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/transit/:transitId" element={<TransitDetailPage />} />
            <Route path="/journal" element={<JournalPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
