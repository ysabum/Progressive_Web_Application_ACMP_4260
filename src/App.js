import React, { useState } from "react";
import Home from "./pages/Home";
import InstrumentSelect from "./pages/InstrumentSelect";
import Studio from "./pages/Studio";
import Overlay from "./pages/Overlay";
import "./css/App.css";

export default function App() {
  const [view, setView] = useState("home");
  const [instrument, setInstrument] = useState(null);

  // Navigation
  const startApp = () => setView("select");
  const goBack = () => setView("home");
  const goToStudio = () => {
    if (instrument) setView("studio");
    else alert("Please select an instrument first!");
  };

  const selectInstrument = (inst) => {
    setInstrument(inst);
    setView("studio");
  };

  return (
    <div className="app">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo" onClick={goBack}>
          Glowworm 🐛
        </div>

        <div className="nav-links">

          {/* Home */}
          <span
            className={view === "home" ? "active" : ""}
            onClick={goBack}
          >
            Home
          </span>

          {/* Instruments */}
          <span
            className={view === "select" ? "active" : ""}
            onClick={startApp}
          >
            Instruments
          </span>

          {/* Studio */}
          <span
            className={view === "studio" ? "active" : instrument ? "" : "disabled"}
            onClick={goToStudio}
          >
            Studio {instrument && `(${instrument})`}
          </span>

          {/* Overlay */}
          <span
            className={view === "overlay" ? "active" : ""}
            onClick={() => setView("overlay")}
          >
            Overlay
          </span>
        </div>
      </nav>

      {/* VIEW SWITCHER */}
      {view === "home" && <Home onStart={startApp} />}
      {view === "select" && (
        <InstrumentSelect onSelect={selectInstrument} onBack={goBack} />
      )}
      {view === "studio" && (
        <Studio instrumentName={instrument} onBack={startApp} />
      )}
      {view === "overlay" && <Overlay onBack={goBack} />}
    </div>
  );
}