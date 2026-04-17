import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Accidental, TickContext } from 'vexflow';

const Notation = ({ notes }) => {
  const containerRef = useRef();

  useEffect(() => {
    // 1. Initial State
    if (!notes || notes.length === 0) {
      containerRef.current.innerHTML = `<p style="color: #666; padding-top: 40px; text-align: center; width: 100%;">Click Record to begin...</p>`;
      return;
    }

    try {
      // 2. Clear previous notation
      containerRef.current.innerHTML = '';
      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      
      // Calculate how many lines of music we need based on a set time limit per line
      const secondsPerLine = 12; // Controls how much time fits on one staff row
      const staveWidth = 1100;
      const systemHeight = 150;
      const numSystems = Math.ceil(notes[notes.length - 1].time / secondsPerLine);

      // Resize the main container to hold all lines
      renderer.resize(staveWidth + 50, (numSystems * systemHeight) + 20);
      const context = renderer.getContext();

      // Ensure notes are black and visible
      context.setFillStyle('black');
      context.setStrokeStyle('black');

      // 3. Loop and render each stave row (system)
      for (let i = 0; i < numSystems; i++) {
        const staveY = 10 + (i * systemHeight);
        const stave = new Stave(10, staveY, staveWidth);
        
        if (i === 0) stave.addClef("treble").addTimeSignature("4/4");
        else stave.addClef("treble");

        stave.setContext(context).draw();
        
        // --- Process Notes that belong in THIS row ---
        const startTimeForThisRow = i * secondsPerLine;
        const endTimeForThisRow = (i + 1) * secondsPerLine;

        const rowNotes = notes.filter(n => n.time >= startTimeForThisRow && n.time < endTimeForThisRow);

        rowNotes.forEach((n) => {
          const key = n.note.slice(0, -1).toLowerCase() + '/' + n.note.slice(-1);
          const staveNote = new StaveNote({ clef: "treble", keys: [key], duration: "q" });
          if (n.note.includes('#')) staveNote.addModifier(new Accidental("#"), 0);

          let xOffset = ((n.time - startTimeForThisRow) * 82) + 20;

          const noteTickContext = new TickContext();
          staveNote.setContext(context).setStave(stave);
          
          noteTickContext.addTickable(staveNote).preFormat().setX(xOffset); 
          
          staveNote.draw();
        });
      }

    } catch (err) {
      console.error("VexFlow Multi-Line Timing Error:", err);
    }
  }, [notes]);

  // White background wrapper with vertical scrolling
  return (
    <div ref={containerRef} style={notationWrapper}></div>
  );
};

const notationWrapper = { 
  background: 'white', 
  padding: '10px', 
  borderRadius: '8px', 
  minHeight: '150px', 
  width: '100%', 
  maxHeight: '400px', 
  overflowY: 'auto', 
  overflowX: 'auto', // Allows side-to-side scrolling for the wider staff
  display: 'flex',
  justifyContent: 'flex-start', // Keeps the clef/notes aligned to the left
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' 
};

export default Notation;