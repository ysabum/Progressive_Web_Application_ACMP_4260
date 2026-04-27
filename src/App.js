import React, { useState } from "react";
import Home from "./pages/Home";
import InstrumentSelect from "./pages/InstrumentSelect";
import Studio from "./pages/Studio";
import Overlay from "./pages/Overlay";
import Tutorial from "./components/Tutorial";
import "./css/App.css";

export default function App() {
  const [view, setView] = useState("home");
  const [instrument, setInstrument] = useState(null);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasNotes, setHasNotes] = useState(false);

  const tutorialNavigate = (targetView) => {
    if (targetView === "studio") {
      if (!instrument) setInstrument("Piano");
      setView("studio");
    } else {
      setView(targetView);
    }
  };

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
            data-tutorial="nav-overlay"
            className={view === "overlay" ? "active" : ""}
            onClick={() => setView("overlay")}
          >
            Overlay
          </span>

          <button
            className="tutorial-launch-btn"
            onClick={() => { setView("home"); setTutorialActive(true); }}
          >
            ? Tutorial
          </button>
        </div>
      </nav>

      {/* VIEW SWITCHER */}
      {view === "home" && <Home onStart={startApp} />}
      {view === "select" && (
        <InstrumentSelect onSelect={selectInstrument} onBack={goBack} />
      )}
      {view === "studio" && (
        <Studio
          instrumentName={instrument}
          onBack={startApp}
          onRecordingChange={setIsRecording}
          onNotesChange={setHasNotes}
        />
      )}
      {view === "overlay" && <Overlay onBack={goBack} />}

      {tutorialActive && (
        <Tutorial
          currentView={view}
          onNavigate={tutorialNavigate}
          onClose={() => setTutorialActive(false)}
          isRecording={isRecording}
          hasNotes={hasNotes}
        />
      )}
    </div>
  );
}