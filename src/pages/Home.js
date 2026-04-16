import React from "react";
import "../css/Home.css";

export default function Home({ onStart }) {
  return (
    <div className="home">

      {/* Hero Text */}
      <div className="hero-content">
        <h1 className="title">Glowworm 🐛</h1>
        <p className="subtitle">Compose. Record. Layer.</p>

        <p className="description">
          Transform your QWERTY keyboard into a professional workstation.
          Create symphonies with acoustic guitar, piano, violin, and trumpet.
        </p>

        {/* Start Making Music Button -> Instruments Page */}
        <button className="primary-btn" onClick={onStart}>
          Start Making Music
        </button>
      </div>

      {/* Footer */}
      <div className="footer">
        <b>Developed by Team Glowworm:</b> Gregory, Allan, Hennysa, & Laurelle
      </div>
    </div>
  );
}