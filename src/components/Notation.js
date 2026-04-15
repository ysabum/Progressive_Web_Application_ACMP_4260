import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Accidental, Voice, Formatter } from 'vexflow';

const Notation = ({ notes, containerId = "notation-svg" }) => {
  const containerRef = useRef();

  useEffect(() => {
    if (!notes || notes.length === 0) {
      containerRef.current.innerHTML = `<p style="color: #666; padding-top: 40px; text-align: center; width: 100%;">Click Record to begin...</p>`;
      return;
    }

    try {
      containerRef.current.innerHTML = '';
      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(800, 150);
      const context = renderer.getContext();
      context.element.id = containerId; // ID used for saving the image later

      const stave = new Stave(10, 20, 750);
      stave.addClef("treble").setContext(context).draw();

      const staveNotes = notes.slice(-8).map((n, i) => {
        const key = n.note.slice(0, -1).toLowerCase() + '/' + n.note.slice(-1);
        
        // RHYTHM LOGIC: Compare time between this note and the next
        let duration = "q"; 
        if (i < notes.slice(-8).length - 1) {
          const diff = notes[i+1].time - n.time;
          if (diff < 0.3) duration = "8"; // Fast typing = 8th note
          if (diff > 0.8) duration = "h"; // Slow typing = Half note
        }

        const staveNote = new StaveNote({ clef: "treble", keys: [key], duration: duration });
        if (n.note.includes('#')) staveNote.addModifier(new Accidental("#"), 0);
        return staveNote;
      });

      if (staveNotes.length > 0) {
        const voice = new Voice({ num_beats: 100, beat_value: 4 }).setStrict(false);
        voice.addTickables(staveNotes);
        new Formatter().joinVoices([voice]).format([voice], 700);
        voice.draw(context, stave);
      }
    } catch (err) {
      console.error("VexFlow Error:", err);
    }
  }, [notes, containerId]);

  return (
    <div ref={containerRef} style={{ background: 'white', padding: '10px', borderRadius: '8px' }}></div>
  );
};

export default Notation;