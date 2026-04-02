import React from 'react';
import * as Tone from 'tone';

function App() {
  // Function to play a simple note
  const playNote = () => {
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease("C4", "8n");
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Glowworm Music Station</h1>
      <p>Click the button below to test the sound engine.</p>
      <button 
        onClick={playNote} 
        style={{ padding: '20px', fontSize: '20px', cursor: 'pointer' }}
      >
        Play Middle C
      </button>
    </div>
  );
}

export default App;