import React, { useState } from 'react';
import Home from './pages/Home';
import InstrumentSelect from './pages/InstrumentSelect';
import Studio from './pages/Studio';
import Overlay from './pages/Overlay';


function App() {
  const [view, setView] = useState('home'); 
  const [instrument, setInstrument] = useState(null);

  // Navigation Handlers
  const startApp = () => setView('select');
  const goBack = () => setView('home');
  const goToStudio = () => {
    if (instrument) setView('studio');
    else alert("Please select an instrument first!");
  };

  const selectInstrument = (inst) => {
    setInstrument(inst);
    setView('studio');
  };

  const goToOverlay = () => setView('overlay');


  return (
    <div className="App">
      {/* Navigation Bar */}
      <nav style={navStyle}>
        <div style={logoStyle} onClick={goBack}>Glowworm 🐛</div>
        <div style={navLinks}>
          <span style={view === 'home' ? activeLink : link} onClick={goBack}>Home</span>
          <span style={view === 'select' ? activeLink : link} onClick={startApp}>Instruments</span>
          <span 
            style={view === 'studio' ? activeLink : (instrument ? link : disabledLink)} 
            onClick={goToStudio}
          >
            Studio {instrument && `(${instrument})`}
          </span>
          <span style={view === 'overlay' ? activeLink : link} onClick={goToOverlay}>Overlay</span>
        </div>
      </nav>

      {/* View Switcher */}
      {view === 'home' && <Home onStart={startApp} />}
      {view === 'select' && (
        <InstrumentSelect onSelect={selectInstrument} onBack={goBack} />
      )}
      {view === 'studio' && <Studio instrumentName={instrument} onBack={startApp} />}
      {view === 'overlay' && <Overlay onBack={goBack} />}
    </div>
  );
}

// --- STYLING ---
const navStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '0 40px', height: '60px', backgroundColor: '#1a1a2e', color: 'white',
  position: 'fixed', top: 0, width: '100%', zIndex: 1000, boxSizing: 'border-box'
};

const logoStyle = { fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer' };
const navLinks = { display: 'flex', gap: '30px' };
const link = { cursor: 'pointer', opacity: 0.8 };
const activeLink = { cursor: 'pointer', fontWeight: 'bold', borderBottom: '2px solid #4cc9f0' };
const disabledLink = { cursor: 'not-allowed', opacity: 0.3 };

export default App;