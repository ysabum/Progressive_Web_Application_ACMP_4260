import React, { useEffect, useState, useRef, useCallback } from 'react'; // Added useCallback
import * as Tone from 'tone';
import Notation from '../components/Notation';
import { Renderer, Stave, StaveNote, Accidental, TickContext } from 'vexflow';
import "../css/Studio.css";

const visualMap = {
  'q': 'C2', 'w': 'D2', 'e': 'E2', 'r': 'F2', 't': 'G2',
  'a': 'A2', 's': 'B2', 'd': 'C3', 'f': 'D3', 'g': 'E3',
  'z': 'F3', 'x': 'G3', 'c': 'A3', 'v': 'B3', 'b': 'C4',
  'y': 'D4', 'u': 'E4', 'i': 'F4', 'o': 'G4', 'p': 'A4',
  'h': 'B4', 'j': 'C5', 'k': 'D5', 'l': 'E5', ';': 'F5',
  'n': 'G5', 'm': 'A5', ',': 'B5', '.': 'C6', '/': 'D6'
};

// 1. INSTRUMENT CONFIGS OUTSIDE: Stays outside to remain static
const instrumentConfigs = {
  Piano: {
    offset: 12,
    baseUrl: "./sounds/piano/",
    urls: { "C2": "C2.mp3", "C3": "C3.mp3", "C4": "C4.mp3", "C5": "C5.mp3",
            "D#2": "Ds2.mp3", "D#3": "Ds3.mp3", "D#4": "Ds4.mp3", "D#5": "Ds5.mp3" }
  },
  Guitar: {
    offset: 0,
    baseUrl: "./sounds/guitar/",
    urls: { "A2": "As2.mp3", "B2": "B2.mp3", "G2": "G2.mp3", "F#2": "Fs2.mp3",
            "A3": "A3.mp3", "D3": "D3.mp3", "F3": "F3.mp3", "G3": "G3.mp3",
            "C4": "C4.mp3", "E4": "E4.mp3" }
  },
  Violin: {
    offset: 12, 
    baseUrl: "./sounds/violin/",
    urls: { "G3": "G3.mp3", "A3": "A3.mp3", "C4": "C4.mp3", "A4": "A4.mp3",
            "C5": "C5.mp3", "E5": "E5.mp3", "G5": "G5.mp3", "C6": "C6.mp3" }
  },
  Trumpet: {
    offset: 12, 
    baseUrl: "./sounds/trumpet/",
    urls: { "A3": "A3.mp3", "C4": "C4.mp3", "A#4": "As4.mp3", "D#4": "Ds4.mp3",
            "F3": "F3.mp3", "F5": "F5.mp3", "G4": "G4.mp3", "D5": "D5.mp3" }
  }
};

const Studio = ({ instrumentName, onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState([]);
  const [keyMap, setKeyMap] = useState(visualMap);
  const [isEditMode, setIsEditMode] = useState(false);

  const samplerRef = useRef(null);
  const activeNotesRef = useRef({});
  const scoreAreaRef = useRef(null);
  const bottomRef = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const startTime = useRef(null);
  const destRef = useRef(null);
  const isRecordingRef = useRef(isRecording);

  const keyMapRef = useRef(keyMap);
  useEffect(() => {
    keyMapRef.current = keyMap;
  }, [keyMap]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // 2. DEFINE toggleRecording FIRST: Use useCallback for stability
  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      setRecordedData([]);
      audioChunks.current = [];
      startTime.current = Tone.now();

      mediaRecorder.current = new MediaRecorder(destRef.current.stream);
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
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

  // 3. useEffect SECOND: Now it can safely "see" toggleRecording
  useEffect(() => {
    destRef.current = Tone.getContext().createMediaStreamDestination();
    const config = instrumentConfigs[instrumentName] || instrumentConfigs.Piano;

    const reverb = new Tone.Reverb(1.5).toDestination(); 

    const sampler = new Tone.Sampler({
      urls: config.urls,
      baseUrl: config.baseUrl,
      release: 1,
      onload: () => console.log(`${instrumentName} loaded!`)
    }).toDestination();

    sampler.connect(reverb); 
    sampler.connect(destRef.current);
    reverb.connect(destRef.current);
    samplerRef.current = sampler;

    const handleGlobalShortcuts = (e) => {
      if (isEditMode) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault(); 
        toggleRecording();
      }
    };

    const handleKeyDown = async (e) => {
      if (e.repeat || isEditMode) return; 
      const keyName = e.key.toLowerCase();
      const baseNote = keyMapRef.current[keyName];

      if (baseNote && samplerRef.current?.loaded) {
        if (Tone.getContext().state !== "running") await Tone.start();
        const finalNote = Tone.Frequency(baseNote).transpose(config.offset).toNote();
        samplerRef.current.triggerAttack(finalNote);

        if (isRecordingRef.current) {
          activeNotesRef.current[keyName] = {
            note: finalNote,
            startTime: Tone.now() - startTime.current
          };
        }
      }
    };

    const handleKeyUp = (e) => {
      if (isEditMode) return; 
      const keyName = e.key.toLowerCase();
      const baseNote = keyMapRef.current[keyName];

      if (baseNote && samplerRef.current?.loaded) {
        const finalNote = Tone.Frequency(baseNote).transpose(config.offset).toNote();
        samplerRef.current?.triggerRelease(finalNote);

        if (isRecordingRef.current && activeNotesRef.current[keyName]) {
          const { note, startTime: noteStartTime } = activeNotesRef.current[keyName];
          const duration = (Tone.now() - startTime.current) - noteStartTime;
          setRecordedData(prev => [...prev, { note, time: noteStartTime, duration }]);
          delete activeNotesRef.current[keyName];
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleGlobalShortcuts);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleGlobalShortcuts);
      sampler.dispose();
      reverb.dispose();
    };
  }, [instrumentName, isEditMode, toggleRecording]); // Simplified dependencies

  // NEW: The "Target Every Box" Scroll Fix
  useEffect(() => {
    // We use a small delay to let VexFlow finish drawing the new notes
    const timer = setTimeout(() => {
      if (scoreAreaRef.current) {
        // 1. Scroll the main container
        scoreAreaRef.current.scrollTop = scoreAreaRef.current.scrollHeight;
        
        // 2. Find ANY inner containers built by the Notation component and scroll them too
        const innerDivs = scoreAreaRef.current.querySelectorAll('div');
        innerDivs.forEach(div => {
          div.scrollTop = div.scrollHeight;
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [recordedData]); // This triggers every time a new note is played

  const saveScoreAsImage = () => {
    if (recordedData.length === 0) {
      alert("No notes recorded to save!");
      return;
    }

    const secondsPerLine = 12;
    const numSystems = Math.ceil(recordedData[recordedData.length - 1].time / secondsPerLine);
    const canvasWidth = 1200;
    const systemHeight = 150;
    const canvasHeight = numSystems * systemHeight + 100;

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const canvasContext = canvas.getContext("2d");

    canvasContext.fillStyle = "white";
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    const renderer = new Renderer(canvas, Renderer.Backends.CANVAS);
    const vfContext = renderer.getContext();

    vfContext.setFillStyle("black");
    vfContext.setStrokeStyle("black");

    for (let i = 0; i < numSystems; i++) {
      const staveY = 50 + i * systemHeight;
      const stave = new Stave(50, staveY, canvasWidth - 100);

      if (i === 0) stave.addClef("treble").addTimeSignature("4/4");
      else stave.addClef("treble");

      stave.setContext(vfContext).draw();

      const startTimeForThisRow = i * secondsPerLine;
      const rowNotes = recordedData.filter(
        (n) => n.time >= startTimeForThisRow && n.time < (i + 1) * secondsPerLine
      );

      rowNotes.forEach((n) => {
        const key = n.note.slice(0, -1).toLowerCase() + "/" + n.note.slice(-1);
        
        let durationChar = "q"; 
        if (n.duration > 1.5) durationChar = "w";      
        else if (n.duration > 0.75) durationChar = "h"; 
        else if (n.duration < 0.2) durationChar = "8";  

        const staveNote = new StaveNote({ 
          clef: "treble", 
          keys: [key], 
          duration: durationChar 
        });
        if (n.note.includes("#")) staveNote.addModifier(new Accidental("#"), 0);

        let xOffset = (n.time - startTimeForThisRow) * 82 + 20;

        const tick = new TickContext();
        staveNote.setContext(vfContext).setStave(stave);
        tick.addTickable(staveNote).preFormat().setX(xOffset);

        staveNote.draw();
      });
    }

    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "glowworm-full-score.png";
    downloadLink.click();
  };

  const currentConfig = instrumentConfigs[instrumentName] || instrumentConfigs.Piano;
  const startRange = Tone.Frequency("C2").transpose(currentConfig.offset).toNote();
  const endRange = Tone.Frequency("D6").transpose(currentConfig.offset).toNote();

  return (
    <div className="studio-container">
      <header className="studio-header">
        <h2 className="studio-title">{instrumentName} Studio</h2>

        <div className="studio-controls">
          <button 
            className={`edit-toggle-btn ${isEditMode ? "active" : ""}`}
            onClick={() => setIsEditMode(!isEditMode)}
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

      {/* RESTRUCTURED SCORE AREA */}
      <div className="score-area" ref={scoreAreaRef}>
        {/* Label is now at the TOP */}
        <p className="score-label">Real-time VexFlow Notation</p>
        <Notation notes={recordedData} />
      </div>

      <div className="keyboard-area">
        <p className="instruction-text">
          Use the keyboard to make {instrumentName.toLowerCase()} sounds (Range: {startRange} - {endRange})
        </p>

        <div className="key-row">
          {Object.keys(keyMap).map((key) => (
            <div 
              key={key} 
              className={`key-box ${isEditMode ? "editable" : ""}`}
              onClick={() => {
                if (isEditMode) {
                  const newNote = prompt(`Enter new note for key ${key.toUpperCase()} (e.g. C4):`, keyMap[key]);
                  if (newNote) setKeyMap(prev => ({ ...prev, [key]: newNote }));
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