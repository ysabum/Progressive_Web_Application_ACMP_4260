import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { Mp3Encoder } from '@breezystack/lamejs';
import "../css/Overlay.css";
import overlayImg from "../images/overlay.png";
import WaveformEditor from "../components/WaveformEditor";
import Timeline from "../components/Timeline";

export default function Overlay({ onBack }) {
  const [tracks, setTracks] = useState([]);
  const [players, setPlayers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [openPanels, setOpenPanels] = useState([]);
  const [progress, setProgress] = useState("");

  /* Track Model */
  const handleUpload = (e) => {
    const selected = Array.from(e.target.files);

    selected.forEach((file) => {
      const url = URL.createObjectURL(file);

      const audio = new Audio(url);

      const trackId = crypto.randomUUID();

      const newTrack = {
        id: trackId,
        file,
        url,
        volume: 0,
        startTime: 0,
        trimStart: 0,
        trimEnd: null,
        duration: 0, // will be updated when metadata loads
      };

      audio.addEventListener("loadedmetadata", () => {
        setTracks((prev) =>
          prev.map((t) =>
            t.id === trackId
              ? { ...t, duration: audio.duration }
              : t
          )
        );
      });

      setTracks((prev) => [...prev, newTrack]);
    });
  };

  const updateTrack = (id, patch) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  };

  const removeTrack = (id) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  /* Drag + Drop */
  const onDragStart = (e, id) => {
    e.dataTransfer.setData("trackId", id);
  };

  const onDrop = (e, targetId) => {
    const draggedId = e.dataTransfer.getData("trackId");
    if (!draggedId) return;

    const reordered = [...tracks];
    const draggedIndex = reordered.findIndex((t) => t.id === draggedId);
    const targetIndex = reordered.findIndex((t) => t.id === targetId);

    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    setTracks(reordered);
  };

  /* Playback */
  const playAll = async () => {
    await Tone.start();

    const loadPromises = tracks.map((t) => {
      return new Promise((resolve) => {
        const player = new Tone.Player({
          url: t.url,
          onload: () => resolve({ player, track: t })
        }).toDestination();

        player.volume.value = t.volume;
      });
    });

    const loadedPlayers = await Promise.all(loadPromises);
    const now = Tone.now();

    loadedPlayers.forEach(({ player, track }) => {
      const duration =
        track.trimEnd != null && track.trimEnd > track.trimStart
          ? track.trimEnd - track.trimStart
          : undefined;

      player.start(
        now + track.startTime, 
        track.trimStart,
        duration
      );
    });

    setPlayers(loadedPlayers);
    setIsPlaying(true);
  };

  const stopAll = () => {
    players.forEach(({ player }) => player.stop());
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      players.forEach(({ player }) => player.stop());
    };
  }, [players]);

  /* Decode */
  async function decodeFile(file, audioCtx) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        audioCtx.decodeAudioData(reader.result, resolve, reject);
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /* Download Mix */
  const downloadMix = async () => {
    if (tracks.length === 0) return;

    setProgress("Decoding audio...");

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const decoded = [];
    for (let i = 0; i < tracks.length; i++) {
      setProgress(`Decoding track ${i + 1}/${tracks.length}...`);
      const buffer = await decodeFile(tracks[i].file, audioCtx);
      decoded.push(buffer);
    }

    audioCtx.close();

    let maxEnd = 0;

    tracks.forEach((t, i) => {
      const fullDur = decoded[i].duration;

      const effective =
        t.trimEnd !== "" && t.trimEnd > t.trimStart
          ? t.trimEnd - t.trimStart
          : Math.max(0, fullDur - t.trimStart);

      maxEnd = Math.max(maxEnd, t.startTime + effective);
    });

    if (maxEnd > 300) {
      alert("Mix too long. Please keep under 5 minutes.");
      return;
    }

    const sampleRate = 44100;

    const offline = new OfflineAudioContext(
      2,
      Math.ceil(maxEnd * sampleRate),
      sampleRate
    );

    tracks.forEach((t, i) => {
      const src = offline.createBufferSource();
      src.buffer = decoded[i];

      const gain = offline.createGain();
      gain.gain.value = Math.pow(10, t.volume / 20);

      src.connect(gain).connect(offline.destination);

      const fullDur = decoded[i].duration;

      const effective =
        t.trimEnd !== "" && t.trimEnd > t.trimStart
          ? t.trimEnd - t.trimStart
          : Math.max(0, fullDur - t.trimStart);

      src.start(t.startTime, t.trimStart, effective);
    });

    await new Promise((r) => setTimeout(r, 50));

    setProgress("Rendering mix...");
    const rendered = await offline.startRendering();

    setProgress("Encoding...");
    const blob = encodeMp3(rendered);

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mix.mp3";
    a.click();

    setProgress("Done!");
  };

  function encodeMp3(buffer) {
    const samples = buffer.getChannelData(0);

    const samples16 = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      samples16[i] = Math.max(-1, Math.min(1, samples[i])) * 32767;
    }

    const mp3encoder = new Mp3Encoder(1, buffer.sampleRate, 128);
    const blockSize = 1152;
    let mp3Data = [];

    for (let i = 0; i < samples16.length; i += blockSize) {
      const chunk = samples16.subarray(i, i + blockSize);
      const mp3buf = mp3encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }

    const end = mp3encoder.flush();
    if (end.length > 0) mp3Data.push(end);

    return new Blob(mp3Data, { type: "audio/mp3" });
  }

  /* UI */
  return (
    <div className="overlay">
      <div className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Overlay</h1>
            <p className="hero-subtitle">
              Upload multiple audio files created in Studio 
              and play them together to create layered mixes.
            </p>
          </div>

          <div className="hero-image-container">
            <img src={overlayImg} href="https://www.flaticon.com/free-icons/organized" alt="Overlay visual" className="hero-image" />
          </div>
        </div>
      </div>

      <div className="workspace">
        {/* Upload Audio Files */}
        <label className="upload-button">
          📄 Add Audio Files
          <input type="file" multiple onChange={handleUpload} hidden />
        </label>

        {progress && <div className="progress">{progress}</div>}
        
        {/* Timeline */}
        <Timeline
          tracks={tracks}
          updateTrack={updateTrack}
        />
      </div>


      <div className="card">
        {/* Track List + Items */}
        <div className="track-list">
          {tracks.map((t) => (
            <div key={t.id}>
              <div
                draggable
                onDragStart={(e) => onDragStart(e, t.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, t.id)}
                className="track-item"
              >
                <span className="remove-button" onClick={() => removeTrack(t.id)}>✖</span>
                <span>{t.file.name}</span>

                {/* Edit Button */}
                <button
                  className="edit-button"
                  onClick={() =>
                    setOpenPanels((prev) =>
                      prev.includes(t.id)
                        ? prev.filter((id) => id !== t.id) // close
                        : [...prev, t.id] // open
                    )
                  }
                >
                  Edit
                </button>
              </div>

              {openPanels.includes(t.id) && (
                <div className="edit-panel">
                  <WaveformEditor track={t} updateTrack={updateTrack} />

                  {/* Start Time */}
                  <label className="edit-row">
                    Start Time (s):
                    <div className="slider-row">
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="0.1"
                        value={t.startTime}
                        onChange={(e) =>
                          updateTrack(t.id, { startTime: Number(e.target.value) })
                        }
                        className="slider"
                      />
                      <span className="slider-value">
                        {t.startTime.toFixed(1)}
                      </span>
                    </div>
                  </label>
                  
                  {/* Volume */}
                  <label className="edit-row">
                    Volume (dB):
                    <div className="slider-row">
                      <input
                        type="range"
                        min="-30"
                        max="10"
                        value={t.volume}
                        onChange={(e) =>
                          updateTrack(t.id, { volume: Number(e.target.value) })
                        }
                        className="slider"
                      />

                      <span className="slider-value">
                        {t.volume.toFixed(1)}
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Play All Button */}
        <div className="controls">
          <button
            className="play-button"
            onClick={playAll}
            disabled={tracks.length === 0 || isPlaying}
          >
            ▶ Play All
          </button>

          {/* Stop Button */}
          <button
            className="stop-button"
            onClick={stopAll}
            disabled={!isPlaying}
          >
            ⏹ Stop
          </button>

          {/* MP3 format download */}
          <button className="download-button" onClick={() => downloadMix("mp3")}>
            🡻 Download MP3
          </button>
        </div>
      </div>
      
      {/* Back Button */}
      <div className="back-container">
        <button onClick={onBack} className="back-button">← Back to Home</button>
      </div>
    </div>
  );
}