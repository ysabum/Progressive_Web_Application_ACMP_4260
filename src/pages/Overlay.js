import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';

export default function Overlay({ onBack }) {
  const [tracks, setTracks] = useState([]);
  const [players, setPlayers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [openPanel, setOpenPanel] = useState(null); // which track is being edited

  /* Track Model */
  const handleUpload = (e) => {
    const selected = Array.from(e.target.files);

    const newTracks = selected.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      volume: 0,        // dB
      startTime: 0,     // seconds
      trimStart: 0,     // seconds
      trimEnd: "",      // empty = full length
    }));

    setTracks((prev) => [...prev, ...newTracks]);
  };

  const updateTrack = (id, patch) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  };

  const removeTrack = (id) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  };

  /* Drag and Drop */
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

    let loaded = 0;
    const newPlayers = [];

    for (let t of tracks) {
      const player = new Tone.Player({
        url: t.url,
        onload: () => {
          loaded++;
          if (loaded === tracks.length) {
            newPlayers.forEach(({ player, track }) => {
              const duration =
                track.trimEnd !== "" && track.trimEnd > track.trimStart
                  ? track.trimEnd - track.trimStart
                  : undefined;

              player.start(
                track.startTime,
                track.trimStart,
                duration
              );
            });
            setIsPlaying(true);
          }
        }
      }).toDestination();

      player.volume.value = t.volume;

      newPlayers.push({ player, track: t });
    }

    setPlayers(newPlayers);
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


  /* Download Mix */
  const downloadMix = async () => {
    const maxEnd = tracks.reduce((acc, t) => {
      const duration =
        t.trimEnd !== "" && t.trimEnd > t.trimStart
          ? t.trimEnd - t.trimStart
          : 10;
      return Math.max(acc, t.startTime + duration);
    }, 0);

    const buffer = await Tone.Offline(async () => {
      tracks.forEach((t) => {
        const p = new Tone.Player(t.url).toDestination();
        p.volume.value = t.volume;

        const duration =
          t.trimEnd !== "" && t.trimEnd > t.trimStart
            ? t.trimEnd - t.trimStart
            : undefined;

        p.start(t.startTime, t.trimStart, duration);
      });
    }, maxEnd);

    const wav = audioBufferToWav(buffer);
    const blob = new Blob([wav], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "mix.wav";
    a.click();
  };

  /* WAV Encoder */
  function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);

    let offset = 0;

    function writeString(s) {
      for (let i = 0; i < s.length; i++) {
        view.setUint8(offset++, s.charCodeAt(i));
      }
    }

    writeString("RIFF");
    view.setUint32(offset, 36 + buffer.length * numOfChan * 2, true);
    offset += 4;
    writeString("WAVE");
    writeString("fmt ");
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2;
    view.setUint16(offset, numOfChan, true);
    offset += 2;
    view.setUint32(offset, buffer.sampleRate, true);
    offset += 4;
    view.setUint32(offset, buffer.sampleRate * numOfChan * 2, true);
    offset += 4;
    view.setUint16(offset, numOfChan * 2, true);
    offset += 2;
    view.setUint16(offset, 16, true);
    offset += 2;
    writeString("data");
    view.setUint32(offset, buffer.length * numOfChan * 2, true);
    offset += 4;

    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numOfChan; ch++) {
        let sample = buffer.getChannelData(ch)[i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    return bufferArray;
  }

  /* UI */
  return (
    <div style={{ backgroundColor: "#181F39", minHeight: "100vh" }}>
      <div style={heroStyle}>
        <h1 style={heroTitle}>Overlay</h1>
        <p style={heroSubtitle}>
          Upload multiple audio files created in Studio and play them together to create layered mixes.
        </p>
      </div>

      <div style={cardStyle}>
        <label style={uploadButton}>
          📄 Add Audio Files
          <input
            type="file"
            accept=".mp3,.m4a,.opus,.wav,.ogg"
            multiple
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </label>

        <div style={trackListStyle}>
          {tracks.map((t) => (
            <div key={t.id}>
              <div
                draggable
                onDragStart={(e) => onDragStart(e, t.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, t.id)}
                style={trackItemStyle}
              >
                <span style={removeButton} onClick={() => removeTrack(t.id)}>✖</span>
                <span>{t.file.name}</span>

                <button
                  style={editButton}
                  onClick={() => setOpenPanel(openPanel === t.id ? null : t.id)}
                >
                  Edit
                </button>
              </div>

              {openPanel === t.id && (
                <div style={editPanel}>
                  <label style={editRow}>
                    Volume (dB):
                    <input
                      type="number"
                      value={t.volume}
                      onChange={(e) =>
                        updateTrack(t.id, { volume: Number(e.target.value) })
                      }
                      style={editInput}
                    />
                  </label>

                  <label style={editRow}>
                    Start Time (s):
                    <input
                      type="number"
                      value={t.startTime}
                      onChange={(e) =>
                        updateTrack(t.id, { startTime: Number(e.target.value) })
                      }
                      style={editInput}
                    />
                  </label>

                  <label style={editRow}>
                    Trim Start (s):
                    <input
                      type="number"
                      value={t.trimStart}
                      onChange={(e) =>
                        updateTrack(t.id, { trimStart: Number(e.target.value) })
                      }
                      style={editInput}
                    />
                  </label>

                  <label style={editRow}>
                    Trim End (s):
                    <input
                      type="number"
                      value={t.trimEnd}
                      onChange={(e) =>
                        updateTrack(t.id, {
                          trimEnd: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      style={editInput}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={controlsStyle}>
          <button
            style={playButton}
            onClick={playAll}
            disabled={tracks.length === 0 || isPlaying}
          >
            ▶ Play All
          </button>

          <button style={stopButton} onClick={stopAll}>
            ■ Stop
          </button>

          <button style={downloadButton} onClick={downloadMix}>
            ⬇ Download Mix
          </button>
        </div>
      </div>

      <button onClick={onBack} style={backButton}>← Back to Home</button>
    </div>
  );
}

/* Styles */

const heroStyle = {
  paddingTop: "100px",
  paddingBottom: "40px",
  color: "white",
  maxWidth: "700px",
  margin: "0 auto",
  textAlign: "left",
};

const heroTitle = {
  fontSize: "2.5rem",
  fontWeight: "bold",
  marginBottom: "10px",
};

const heroSubtitle = {
  fontSize: "1.1rem",
  opacity: 0.9,
  maxWidth: "500px",
};

const cardStyle = {
  background: "white",
  borderRadius: "10px",
  maxWidth: "700px",
  margin: "0 auto",
  padding: "30px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
};

const uploadButton = {
  display: "block",
  background: "#E63946",
  color: "white",
  padding: "12px 20px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  margin: "0 auto 20px auto",
  textAlign: "center",
};

const trackListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  marginTop: "10px",
};

const trackItemStyle = {
  display: "flex",
  alignItems: "center",
  background: "#f5f5f5",
  padding: "12px",
  borderRadius: "6px",
  cursor: "grab",
  justifyContent: "space-between",
  border: "1px solid #ddd",
};

const removeButton = {
  color: "red",
  fontWeight: "bold",
  marginRight: "10px",
  cursor: "pointer",
};

const editButton = {
  background: "#4cc9f0",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
};

const editPanel = {
  background: "#1a1a2e",
  border: "1px solid #4cc9f0",
  borderRadius: "6px",
  padding: "15px",
  marginTop: "8px",
  display: "grid",
  gap: "10px",
};

const editRow = {
  display: "flex",
  justifyContent: "space-between",
  color: "white",
};

const editInput = {
  width: "100px",
  marginLeft: "10px",
};

const controlsStyle = {
  marginTop: "25px",
  display: "flex",
  justifyContent: "center",
  gap: "20px",
};

const playButton = {
  padding: "10px 20px",
  borderRadius: "6px",
  background: "#4cc9f0",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
};

const stopButton = {
  padding: "10px 20px",
  borderRadius: "6px",
  background: "#999",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
};

const downloadButton = {
  padding: "10px 20px",
  borderRadius: "6px",
  background: "#38b000",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  color: "white",
};

const backButton = {
  display: "block",
  marginTop: "40px",
  marginLeft: "auto",
  marginRight: "auto",
  background: "transparent",
  color: "white",
  border: "none",
  cursor: "pointer",
  fontSize: "1.1rem",
  padding: "10px 20px",
  border: "1px solid #cbd5e0",
  borderRadius: "5px",
};
