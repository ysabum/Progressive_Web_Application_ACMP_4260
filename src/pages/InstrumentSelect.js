import React from "react";
import "../css/InstrumentSelect.css";

export default function InstrumentSelect({ onSelect, onBack }) {
  const instruments = [
    { name: "Guitar", icon: "🎸" },
    { name: "Piano", icon: "🎹" },
    { name: "Violin", icon: "🎻" },
    { name: "Trumpet", icon: "🎺" }
  ];

  return (
    <div className="instrument-page">
      <h2 className="instrument-title">Select Your Sound</h2>

      <div className="instrument-grid" data-tutorial="instrument-grid">
        {instruments.map((inst) => (
          <button
            key={inst.name}
            className="instrument-btn"
            onClick={() => onSelect(inst.name)}
          >
            <span className="instrument-icon">{inst.icon}</span>
            {inst.name}
          </button>
        ))}
      </div>

      <button className="inst-back-btn" onClick={onBack}>
        ← Back to Home
      </button>
    </div>
  );
}