import React, { useState, useEffect, useRef } from 'react';
import '../css/Tutorial.css';

// waitFor: auto-advances the step when the condition fires (no Next button shown)
// gate:    Next button stays disabled until the condition is met
const STEPS = [
  {
    id: 'welcome',
    title: "Welcome to Glowworm!",
    content: "Let's make a real song together — pick an instrument, record a melody, watch it become sheet music, then mix it into a final MP3. Click Next to begin!",
    target: null,
    view: "home",
  },
  {
    id: 'choose-instrument',
    title: "Step 1 — Choose an Instrument",
    content: "Click any instrument card below. Each has real audio samples. The tutorial will continue once you pick one!",
    target: "[data-tutorial='instrument-grid']",
    view: "select",
    arrowDir: "up",
  },
  {
    id: 'play-notes',
    title: "Step 2 — Try the Keyboard",
    content: "Press Q, W, E, R, T on your keyboard to hear the instrument. Get comfortable with the sounds before we record. Click Next when you're ready.",
    target: "[data-tutorial='keyboard-area']",
    view: "studio",
    arrowDir: "down",
  },
  {
    id: 'start-recording',
    title: "Step 3 — Start Recording",
    content: "Click the Record button now. It will turn red to show you're live. The tutorial will move forward automatically once you start.",
    target: "[data-tutorial='record-btn']",
    view: "studio",
    arrowDir: "up",
    waitFor: 'recording-start',
  },
  {
    id: 'play-melody',
    title: "Step 3b — Play Your Melody",
    content: "You're recording! Play some notes on the keyboard to build your melody. Once you've played at least one note the Next button will unlock.",
    target: "[data-tutorial='keyboard-area']",
    view: "studio",
    arrowDir: "down",
    gate: 'has-notes',
  },
  {
    id: 'watch-score',
    title: "Step 3c — Watch the Score",
    content: "See your notes appearing here as live sheet music! VexFlow renders them in real time. Keep playing or click Next to move on.",
    target: "[data-tutorial='score-area']",
    view: "studio",
    arrowDir: "up",
  },
  {
    id: 'stop-recording',
    title: "Step 3d — Stop Recording",
    content: "Click the Record button again to stop. Your melody will download automatically as a WAV file. The tutorial will continue once you stop.",
    target: "[data-tutorial='record-btn']",
    view: "studio",
    arrowDir: "up",
    waitFor: 'recording-stop',
  },
  {
    id: 'save-score',
    title: "Step 4 — Save Your Score",
    content: "Your sheet music is ready! Click Save Score Image to download it as a PNG — great for sharing or printing your composition.",
    target: "[data-tutorial='save-score-btn']",
    view: "studio",
    arrowDir: "up",
  },
  {
    id: 'edit-keys',
    title: "Bonus — Remap Keys",
    content: "Click Edit Keys to enter mapping mode. Click any key box to assign a different note, then Save Keys when done. Useful for custom scales!",
    target: "[data-tutorial='edit-keys-btn']",
    view: "studio",
    arrowDir: "up",
  },
  {
    id: 'go-overlay',
    title: "Step 5 — Go to Overlay",
    content: "Click Overlay in the navbar above. Bring the WAV file you just downloaded — we'll mix it into a full song there.",
    target: "[data-tutorial='nav-overlay']",
    view: "studio",
    arrowDir: "up",
  },
  {
    id: 'upload-tracks',
    title: "Step 6 — Upload Your Tracks",
    content: "Click Add Audio Files and select the WAV you recorded. You can upload multiple tracks at once to layer them.",
    target: "[data-tutorial='upload-btn']",
    view: "overlay",
    arrowDir: "up",
  },
  {
    id: 'edit-track',
    title: "Step 7 — Edit a Track",
    content: "Click Edit on any track to open the waveform editor. Adjust volume in dB, trim silence from the start or end, and set a start-time delay.",
    target: "[data-tutorial='track-list']",
    view: "overlay",
    arrowDir: "up",
  },
  {
    id: 'export',
    title: "Final Step — Export Your Song!",
    content: "Click Download MP3 to render all tracks into one mixed file. Your first Glowworm song is ready to share!",
    target: "[data-tutorial='download-btn']",
    view: "overlay",
    arrowDir: "down",
  },
];

const PAD = 12;
const TOOLTIP_W = 360;

export default function Tutorial({ currentView, onNavigate, onClose, isRecording, hasNotes }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const tooltipRef = useRef(null);
  const rafRef = useRef(null);
  const prevRectRef = useRef(null);
  const wasRecordingRef = useRef(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isGated = current.gate === 'has-notes' && !hasNotes;

  // ── Navigate to correct view when step changes via Next/Back ──
  useEffect(() => {
    if (current.view !== currentView) {
      onNavigate(current.view);
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-advance when user navigates externally (e.g. clicks an instrument) ──
  useEffect(() => {
    if (current.view === currentView) return;
    const next = STEPS.findIndex((s, i) => i > step && s.view === currentView);
    if (next !== -1) setStep(next);
  }, [currentView]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-advance on recording start / stop ──
  useEffect(() => {
    if (isRecording) {
      wasRecordingRef.current = true;
      if (STEPS[step].waitFor === 'recording-start') {
        setStep(s => s + 1);
      }
    } else if (wasRecordingRef.current) {
      wasRecordingRef.current = false;
      if (STEPS[step].waitFor === 'recording-stop') {
        setStep(s => s + 1);
      }
    }
  }, [isRecording, step]);

  // ── RAF loop: keeps spotlight rect live with actual DOM layout ──
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    if (!current.target) {
      setRect(null);
      prevRectRef.current = null;
      return;
    }

    const tick = () => {
      const el = document.querySelector(current.target);
      if (el) {
        const r = el.getBoundingClientRect();
        const prev = prevRectRef.current;
        if (!prev || prev.top !== r.top || prev.left !== r.left || prev.width !== r.width || prev.height !== r.height) {
          const next = { top: r.top, left: r.left, width: r.width, height: r.height };
          prevRectRef.current = next;
          setRect(next);
        }
      } else {
        if (prevRectRef.current !== null) {
          prevRectRef.current = null;
          setRect(null);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const timer = setTimeout(() => {
      const el = document.querySelector(current.target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      rafRef.current = requestAnimationFrame(tick);
    }, 300);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [step, currentView]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = () => {
    if (isGated || current.waitFor) return;
    isLast ? onClose() : setStep(s => s + 1);
  };
  const handlePrev = () => step > 0 && setStep(s => s - 1);

  // ── Tooltip positioning ──
  const getTooltipStyle = () => {
    if (!rect) return {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(TOOLTIP_W, vw - 32);
    const tooltipH = tooltipRef.current ? tooltipRef.current.offsetHeight : 220;
    const gap = PAD + 10;

    let top;
    if (current.arrowDir === 'up') {
      top = rect.top + rect.height + gap;
      if (top + tooltipH > vh - 16) top = rect.top - tooltipH - gap;
    } else {
      top = rect.top - tooltipH - gap;
      if (top < 70) top = rect.top + rect.height + gap;
    }

    let left = rect.left + rect.width / 2 - w / 2;
    left = Math.max(16, Math.min(left, vw - w - 16));

    return { top, left, width: w };
  };

  const getArrowStyle = () => {
    if (!rect) return null;
    const ts = getTooltipStyle();
    if (ts.top === undefined) return null;
    const tooltipH = tooltipRef.current ? tooltipRef.current.offsetHeight : 220;
    const arrowLeft = rect.left + rect.width / 2;
    if (ts.top > rect.top + rect.height) return { top: ts.top - 8, left: arrowLeft, dir: 'up' };
    return { top: ts.top + tooltipH, left: arrowLeft, dir: 'down' };
  };

  const isCentered = !current.target || !rect;
  const tooltipStyle = isCentered ? {} : getTooltipStyle();
  const arrowInfo = isCentered ? null : getArrowStyle();

  return (
    <>
      {/* 4-div spotlight frame */}
      {rect ? (
        <>
          <div className="tut-mask" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - PAD) }} />
          <div className="tut-mask" style={{ top: rect.top - PAD, left: 0, width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2 }} />
          <div className="tut-mask" style={{ top: rect.top - PAD, left: rect.left + rect.width + PAD, right: 0, height: rect.height + PAD * 2 }} />
          <div className="tut-mask" style={{ top: rect.top + rect.height + PAD, left: 0, right: 0, bottom: 0 }} />
        </>
      ) : (
        <div className="tut-mask" style={{ position: 'fixed', inset: 0 }} />
      )}

      {rect && (
        <div
          className="tut-ring"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
          }}
        />
      )}

      {arrowInfo && (
        <div
          className={`tut-arrow tut-arrow-${arrowInfo.dir}`}
          style={{ top: arrowInfo.top, left: arrowInfo.left, transform: 'translateX(-50%)' }}
        />
      )}

      <div
        ref={tooltipRef}
        className={`tut-tooltip${isCentered ? ' tut-centered' : ''}`}
        style={tooltipStyle}
      >
        <div className="tut-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`tut-dot${i === step ? ' active' : i < step ? ' done' : ''}`} />
          ))}
        </div>

        <h3 className="tut-title">{current.title}</h3>
        <p className="tut-body">{current.content}</p>

        {/* Waiting-for-action indicator replaces the Next button */}
        {current.waitFor ? (
          <p className="tut-wait-hint">
            {current.waitFor === 'recording-start'
              ? '⏺ Waiting for you to start recording...'
              : '⏹ Waiting for you to stop recording...'}
          </p>
        ) : (
          <div className="tut-actions">
            {step > 0 && (
              <button className="tut-btn tut-back" onClick={handlePrev}>← Back</button>
            )}
            <button className="tut-btn tut-skip" onClick={onClose}>Skip</button>
            <button
              className="tut-btn tut-next"
              onClick={handleNext}
              disabled={isGated}
              title={isGated ? 'Play some notes first!' : ''}
            >
              {isLast ? 'Finish!' : 'Next →'}
            </button>
          </div>
        )}

        {/* Gate hint shown below actions */}
        {isGated && (
          <p className="tut-gate-hint">Play some notes above to unlock Next</p>
        )}
      </div>
    </>
  );
}
