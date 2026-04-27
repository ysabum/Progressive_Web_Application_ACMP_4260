import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import Notation from '../components/Notation';
import { Renderer, Stave, StaveNote, Accidental } from 'vexflow';
import "../css/Studio.css";

/* =========================
   KEYBOARD → NOTE MAP
========================= */
const visualMap = {
  q: 'C2', w: 'D2', e: 'E2', r: 'F2', t: 'G2',
  a: 'A2', s: 'B2', d: 'C3', f: 'D3', g: 'E3',
  z: 'F3', x: 'G3', c: 'A3', v: 'B3', b: 'C4',
  y: 'D4', u: 'E4', i: 'F4', o: 'G4', p: 'A4',
  h: 'B4', j: 'C5', k: 'D5', l: 'E5', ';': 'F5',
  n: 'G5', m: 'A5', ',': 'B5', '.': 'C6', '/': 'D6'
};

/* =========================
   INSTRUMENT CONFIGS
========================= */
const instrumentConfigs = {
  Piano: {
    offset: 12,
    baseUrl: "./sounds/piano/",
    urls: {
      C2: "C2.mp3", C3: "C3.mp3", C4: "C4.mp3", C5: "C5.mp3",
      "D#2": "Ds2.mp3", "D#3": "Ds3.mp3", "D#4": "Ds4.mp3", "D#5": "Ds5.mp3"
    }
  },
  Guitar: {
    offset: 0,
    baseUrl: "./sounds/guitar/",
    urls: {
      A2: "As2.mp3", B2: "B2.mp3", G2: "G2.mp3", "F#2": "Fs2.mp3",
      A3: "A3.mp3", D3: "D3.mp3", F3: "F3.mp3", G3: "G3.mp3",
      C4: "C4.mp3", E4: "E4.mp3"
    }
  },
  Violin: {
    offset: 12,
    baseUrl: "./sounds/violin/",
    urls: {
      G3: "G3.mp3", A3: "A3.mp3", C4: "C4.mp3", A4: "A4.mp3",
      C5: "C5.mp3", E5: "E5.mp3", G5: "G5.mp3", C6: "C6.mp3"
    }
  },
  Trumpet: {
    offset: 12,
    baseUrl: "./sounds/trumpet/",
    urls: {
      A3: "A3.mp3", C4: "C4.mp3", "A#4": "As4.mp3", "D#4": "Ds4.mp3",
      F3: "F3.mp3", F5: "F5.mp3", G4: "G4.mp3", D5: "D5.mp3"
    }
  }
};

/* =========================
   STUDIO COMPONENT
========================= */
const Studio = ({ instrumentName, onBack }) => {

  /* =========================
     STATE MANAGEMENT
  ========================= */
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState([]);
  const [keyMap, setKeyMap] = useState(() => {
    const saved = localStorage.getItem("studio_keymap");
    return saved ? JSON.parse(saved) : visualMap;
  });
  const [isEditMode, setIsEditMode] = useState(false);

  /* =========================
     AUDIO / RECORDING REFS
  ========================= */
  const samplerRef = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const startTime = useRef(null);
  const destRef = useRef(null);

  /* =========================
     PERFORMANCE REFS
  ========================= */
  const isRecordingRef = useRef(false);
  const keyMapRef = useRef(keyMap);
  const activeNotesRef = useRef({});
  const configRef = useRef(null);

  /* =========================
     KEYMAP SYNC + PERSISTENCE
  ========================= */
  useEffect(() => {
    keyMapRef.current = keyMap;
    localStorage.setItem("studio_keymap", JSON.stringify(keyMap));
  }, [keyMap]);

  /* =========================
     RECORDING STATE SYNC
  ========================= */
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  /* =========================
     NOTE TRANSPOSITION HELPER
  ========================= */
  const getFinalNote = (baseNote, config) =>
    Tone.Frequency(baseNote)
      .transpose(config.offset || 0)
      .toNote();

  /* =========================
     AUDIO ENGINE + KEYBOARD INPUT
  ========================= */
  useEffect(() => {
    destRef.current = Tone.getContext().createMediaStreamDestination();
    configRef.current = instrumentConfigs[instrumentName] || instrumentConfigs.Piano;

    const sampler = new Tone.Sampler({
      urls: configRef.current.urls,
      baseUrl: configRef.current.baseUrl,
      release: 1,
      onload: () => console.log(`${instrumentName} loaded`)
    }).toDestination();

    sampler.connect(destRef.current);
    samplerRef.current = sampler;

    /* =========================
       KEY DOWN HANDLER
    ========================= */
    const handleKeyDown = async (e) => {
      if (e.repeat || isEditMode) return;

      const key = e.key.toLowerCase();
      const baseNote = keyMapRef.current[key];
      if (!baseNote) return;

      if (Tone.getContext().state !== "running") await Tone.start();

      const finalNote = getFinalNote(baseNote, configRef.current);
      sampler.triggerAttack(finalNote);

      if (isRecordingRef.current) {
        const t = Tone.now() - startTime.current;
        activeNotesRef.current[key] = { note: finalNote, startTime: t };
      }
    };

    /* =========================
       KEY UP HANDLER
    ========================= */
    const handleKeyUp = (e) => {
      if (isEditMode) return;

      const key = e.key.toLowerCase();
      const baseNote = keyMapRef.current[key];
      if (!baseNote) return;

      const finalNote = getFinalNote(baseNote, configRef.current);
      sampler.triggerRelease(finalNote);

      if (isRecordingRef.current && activeNotesRef.current[key]) {
        const { startTime: noteStart } = activeNotesRef.current[key];

        const duration = Tone.now() - startTime.current - noteStart;

        setRecordedData(prev => [
          ...prev,
          { note: finalNote, time: noteStart, duration }
        ]);

        delete activeNotesRef.current[key];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      sampler.dispose();
    };
  }, [instrumentName, isEditMode]);

  /* =========================
     RECORDING TOGGLE
  ========================= */
  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      setRecordedData([]);
      audioChunks.current = [];
      startTime.current = Tone.now();

      mediaRecorder.current = new MediaRecorder(destRef.current.stream);
      mediaRecorder.current.ondataavailable = (e) =>
        audioChunks.current.push(e.data);

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${instrumentName}_Recording.wav`;
        a.click();
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } else {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  }, [isRecording, instrumentName]);

  /* =========================
     SCORE EXPORT (VEXFLOW → PNG)
  ========================= */
  const saveScoreAsImage = () => {
    if (!recordedData.length) return alert("No notes recorded!");

    const secondsPerLine = 12;
    const numSystems = Math.ceil(recordedData.at(-1).time / secondsPerLine);

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = numSystems * 150 + 100;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderer = new Renderer(canvas, Renderer.Backends.CANVAS);
    const vf = renderer.getContext();

    for (let i = 0; i < numSystems; i++) {
      const stave = new Stave(50, 50 + i * 150, 1100);
      stave.addClef("treble");
      if (i === 0) stave.addTimeSignature("4/4");
      stave.setContext(vf).draw();

      const start = i * secondsPerLine;

      recordedData
        .filter(n => n.time >= start && n.time < start + secondsPerLine)
        .forEach(n => {
          const keys = n.note.slice(0, -1).toLowerCase() + "/" + n.note.slice(-1);

          let d = "q";
          if (n.duration > 1.5) d = "w";
          else if (n.duration > 0.75) d = "h";
          else if (n.duration < 0.2) d = "8";

          const note = new StaveNote({ clef: "treble", keys: [keys], duration: d });

          if (n.note.includes("#")) note.addModifier(new Accidental("#"), 0);

          note.setContext(vf).setStave(stave).draw();
        });
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "score.png";
    link.click();
  };

  /* =========================
     AUTO SCROLL SCORE VIEW
  ========================= */
  useEffect(() => {
    const score = document.querySelector(".score-area");
    if (!score) return;

    const id = requestAnimationFrame(() => {
      score.scrollTo({ top: score.scrollHeight, behavior: "smooth" });
    });

    return () => cancelAnimationFrame(id);
  }, [recordedData]);

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="studio-container">

      <header className="studio-header">
        <h2 className="studio-title">{instrumentName} Studio</h2>

        <div className="studio-controls">
          <button
            className={`edit-toggle-btn ${isEditMode ? "active" : ""}`}
            onClick={() => setIsEditMode(v => !v)}
          >
            {isEditMode ? "✅ Save Keys" : "⌨️ Edit Keys"}
          </button>

          <button
            onClick={toggleRecording}
            className={`record-btn ${isRecording ? "recording" : ""}`}
          >
            {isRecording ? "■ Stop" : "● Record (Enter)"}
          </button>

          {!isRecording && recordedData.length > 0 && (
            <button className="save-score-btn" onClick={saveScoreAsImage}>
              💾 Save Score Image
            </button>
          )}
        </div>
      </header>

      <div className="score-area">
        <p className="score-label">Real-time VexFlow Notation</p>
        <Notation notes={recordedData} />
      </div>

      <div className="keyboard-area">
        <p className="instruction-text">
          Use the keyboard to make {instrumentName.toLowerCase()} sounds (Range: C2 - D6)
        </p>

        <div className="key-row">
          {Object.keys(keyMap).map((key) => (
            <div
              key={key}
              className={`key-box ${isEditMode ? "editable" : ""}`}
              onClick={() => {
                if (!isEditMode) return;

                const newNote = prompt(
                  `Enter new note for ${key.toUpperCase()}`,
                  keyMap[key]
                );

                if (newNote) {
                  setKeyMap(prev => ({ ...prev, [key]: newNote }));
                }
              }}
            >
              <span className="key-label">{key.toUpperCase()}</span>
              <div className="note-label">{keyMap[key]}</div>
            </div>
          ))}
        </div>

        <button className="change-instrument-btn" onClick={onBack}>
          Change Instrument
        </button>
      </div>
    </div>
  );
};

export default Studio;