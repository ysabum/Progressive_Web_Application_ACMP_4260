import React, { useState } from "react";
import "../css/Home.css";
import testImg from "../images/home_test_play.png";
import recordImg from "../images/home_record.png";
import overlayImg from "../images/home_overlay.png";
import shareImg from "../images/home_share.png";


export default function Home({ onStart }) {

  /* Module Bar declare */
  const [activeTab, setActiveTab] = useState("test");
  const screenshots = {
    test: testImg,
    record: recordImg,
    overlay: overlayImg,
    share: shareImg,
  };

  /* Flavor text for each button */
  const flavorText = {
    test: "Experiment with sounds instantly. Play instruments using your keyboard and explore Glowworm’s sonic playground.",
    record: "Capture your performance with studio‑quality sampling. Layer takes and build your musical ideas.",
    overlay: "Blend, align, and visualize your tracks. The overlay engine helps you refine timing and harmony.",
    share: "Export your creations to mp3 format and share them with collaborators or friends. Glowworm makes distribution effortless."
  };

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

      {/* Instrument Emoji Background Layer */}
      <div className="instrument-bg">
        <span>🎺</span>
        <span>🎷</span>
      </div>

      <div className="instrument-bg2">
        <span>🎸</span>
        <span>🥁</span>
      </div>

      <div className="instrument-bg3">
        <span>🎹</span>
        <span>🎻</span>
      </div>

        {/* Module Bar */}
        <div className="module-bar-wrapper">
          <div className="module-bar">
            <button className={`module-btn ${activeTab === "test" ? "active" : ""}`} onClick={() => setActiveTab("test")}>
              Test & Play
            </button>

            <button className={`module-btn ${activeTab === "record" ? "active" : ""}`} onClick={() => setActiveTab("record")}>
              Record
            </button>

            <button className={`module-btn ${activeTab === "overlay" ? "active" : ""}`} onClick={() => setActiveTab("overlay")}>
              Overlay
            </button>

            <button className={`module-btn ${activeTab === "share" ? "active" : ""}`} onClick={() => setActiveTab("share")}>
              Share
            </button>
          </div>
        </div>

        {/* Flavor Text Container */}
        <div className="flavor-card">
          <p className="flavor-text">{flavorText[activeTab]}</p>
        </div>

        {/* Screenshot Preview */}
        <div className="preview-section">
          <div className="preview-card">
            <img
              src={screenshots[activeTab]}
              alt="Glowworm preview"
              className="preview-image"
            />
          </div>
        </div>

        {/* Floating dots animation */}
        <div className="floating-dots">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="dot"></span>
          ))}
        </div>

        {/* Footer */}
        <div className="footer">
          <b>Developed by Team Glowworm:</b> Gregory, Allan, Hennysa, & Laurelle
        </div>
    </div>
  );
}