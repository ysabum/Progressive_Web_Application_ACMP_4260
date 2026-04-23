import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import "../css/Waveform.css";

export default function WaveformEditor({ track, updateTrack }) {
    const containerRef = useRef(null);
    const waveRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [duration, setDuration] = useState(1);

    useEffect(() => {
    if (!containerRef.current) return;

    let wave = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#ccc",
        progressColor: "#4cc9f0",
        height: 80,
    });

    waveRef.current = wave;

    let isMounted = true;

    wave.on("ready", () => {
        if (!isMounted) return;
        setDuration(wave.getDuration() || 1);
    });

    wave.load(track.url);

    return () => {
        isMounted = false;

        // Delay destroy until next tick
        requestAnimationFrame(() => {
        if (waveRef.current === wave) {
            wave.destroy();
            waveRef.current = null;
        }
        });
    };
    }, [track.id]);

  // Drag (startTime movement)
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e) => {
        if (!isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;

    updateTrack(track.id, {
      startTime: Math.max(0, time),
    });
  };

  // Trim rendering safety
    const safeDuration = duration || 1;

    const hasTrimEnd =
        typeof track.trimEnd === "number" && !isNaN(track.trimEnd);

    const clamp = (v) => Math.min(100, Math.max(0, v));

    const trimStartPercent = clamp(
        (track.trimStart / safeDuration) * 100
    );

    const trimEndPercent = hasTrimEnd
        ? clamp((track.trimEnd / safeDuration) * 100)
        : 100;

  // Click trimming (stable)
    const handleTrimClick = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;

    if (e.shiftKey) {
      updateTrack(track.id, { trimEnd: time });
    } else {
      updateTrack(track.id, { trimStart: time });
    }

    handleMouseDown();
  };

    return (
        <div className="waveform-wrapper">
        <div
            className="waveform-container"
            ref={containerRef}
            onMouseDown={handleTrimClick}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
        >
            {/* Trim Start */}
            <div
            className="trim-marker start"
            style={{ left: `${trimStartPercent}%` }}
            />

            {/* Trim End */}
            {hasTrimEnd && (
            <div
                className="trim-marker end"
                style={{ left: `${trimEndPercent}%` }}
            />
            )}

            {/* Active Region */}
            <div
            className="trim-region"
            style={{
                left: `${trimStartPercent}%`,
                width: `${trimEndPercent - trimStartPercent}%`,
            }}
            />
        </div>

        <p className="waveform-hint">
            Click = trim start | Shift+Click = trim end | Drag = move start time
        </p>
        </div>
    );
}