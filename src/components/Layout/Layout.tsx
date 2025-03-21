import React from "react";
import { Link } from "react-router-dom";
import "./Layout.scss";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">
            {import.meta.env.VITE_APP_NAME || "AstroReflect"}
          </Link>
          <nav className="nav">
            <ul>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/calendar" className="active">
                  Calendar
                </Link>
              </li>
              <li>
                <Link to="/journal">Journal</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="container">{children}</div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>
            © {new Date().getFullYear()}{" "}
            {import.meta.env.VITE_APP_NAME || "AstroReflect"}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
