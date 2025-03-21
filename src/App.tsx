import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import CalendarPage from "./pages/CalendarPage";
import "./App.scss";

// Placeholder components for other pages
const DashboardPage = () => <div>Dashboard Page (Coming Soon)</div>;

const JournalPage = () => <div>Journal Page (Coming Soon)</div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/journal" element={<JournalPage />} />
      </Routes>
    </Router>
  );
}

export default App;
