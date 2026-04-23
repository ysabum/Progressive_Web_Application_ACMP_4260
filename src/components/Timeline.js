import React, { useRef } from "react";
import "../css/Timeline.css";

export default function Timeline({ tracks, updateTrack, duration = 30 }) {
  const pixelsPerSecond = 40; // spacing control 

  const dragRef = useRef(null);

  const startDrag = (e, track) => {
    dragRef.current = { id: track.id };

    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
  };

  const onDrag = (e) => {
    if (!dragRef.current) return;

    const canvas = document.querySelector(".timeline-canvas");
    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;

    const newStart = x / pixelsPerSecond;

    updateTrack(dragRef.current.id, {
      startTime: Math.max(0, newStart),
    });
  };

  const stopDrag = () => {
    dragRef.current = null;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", stopDrag);
  };

  return (
    <div className="timeline">

      {/* VIEWPORT (card size) */}
      <div className="timeline-viewport">

        {/* CANVAS */}
        <div
          className="timeline-canvas"
          style={{
            width: `${duration * pixelsPerSecond}px`,
            position: "relative",
            height: "auto",
          }}
        >

          {/* RULER */}
          <div className="timeline-ruler">
            {Array.from({ length: duration }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${i * pixelsPerSecond}px`,
                  fontSize: "12px",
                  color: "white",
                  transform: "translateX(-50%)",
                }}
              >
                {i}s
              </div>
            ))}
          </div>

          {/* TRACKS */}
          {tracks.map((t) => {
            const effectiveDuration =
              t.trimEnd && t.trimEnd > t.trimStart
                ? t.trimEnd - t.trimStart
                : (t.duration || 0) - t.trimStart;

            const width = Math.max(20, effectiveDuration * pixelsPerSecond);

            return (
              <div
                key={t.id}
                className="timeline-track"
                style={{ position: "relative", height: "50px" }}
              >
                <div
                  className="timeline-clip"
                  style={{
                    position: "absolute",
                    left: `${t.startTime * pixelsPerSecond}px`,
                    width: `${width}px`,
                  }}
                  onMouseDown={(e) => startDrag(e, t)}
                  title={t.file.name}
                >
                  {t.file.name}
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}