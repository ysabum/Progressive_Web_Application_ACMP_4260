import React from 'react';

const InstrumentSelect = ({ onSelect, onBack }) => {
  const instruments = [
    { name: 'Guitar', icon: '🎸' },
    { name: 'Piano', icon: '🎹' },
    { name: 'Violin', icon: '🎻' },
    { name: 'Trumpet', icon: '🎺' }
  ];

  return (
    <div style={pageStyle}>
      <h2 style={{ color: '#1a1a2e', marginBottom: '30px' }}>Select Your Sound</h2>
      <div style={gridStyle}>
        {instruments.map((inst) => (
          <button 
            key={inst.name} 
            onClick={() => onSelect(inst.name)} 
            style={instBtn}
          >
            <span style={{ fontSize: '2rem', display: 'block' }}>{inst.icon}</span>
            {inst.name}
          </button>
        ))}
      </div>
      <button onClick={onBack} style={secondaryBtn}>← Back to Home</button>
    </div>
  );
};

// --- STYLING ---
const pageStyle = { 
  padding: '80px 20px', 
  textAlign: 'center', 
  minHeight: '100vh', 
  backgroundColor: '#f7fafc' 
};

const gridStyle = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(2, 1fr)', 
  gap: '20px', 
  maxWidth: '500px', 
  margin: '0 auto 40px auto' 
};

const instBtn = { 
  padding: '30px', 
  fontSize: '1.1rem', 
  cursor: 'pointer', 
  border: '1px solid #e2e8f0', 
  borderRadius: '15px', 
  backgroundColor: 'white',
  transition: 'transform 0.2s',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};

const secondaryBtn = { 
  padding: '10px 20px', 
  cursor: 'pointer', 
  background: 'none', 
  border: '1px solid #cbd5e0',
  borderRadius: '5px'
};

export default InstrumentSelect;