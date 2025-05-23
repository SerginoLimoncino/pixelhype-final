import React from "react";
import '../styles/styles.css';  // Importa il file CSS

const PixelGrid = () => {
  const dimensioneDellaGriglia = 300; // larghezza: 300 blocchi
  const mockData = [
    { id: 1, x: 10, y: 10, collegamento: "https://esempio.com", etichetta: "Progetto 1" },
    { id: 2, x: 20, y: 20, collegamento: "https://google.com", etichetta: "Progetto 2" },
    // aggiungi altri blocchi qui
  ];

  return (
    <div className="relative w-full h-[100px] bg-white overflow-scroll border">
      <div className="absolute" style={{ width: `${dimensioneDellaGriglia * 10}px`, height: `${dimensioneDellaGriglia * 10}px` }}>
        {mockData.map((blocco) => (
          <a key={blocco.id} className="absolute" href={blocco.collegamento} target="_blank" rel="noopener noreferrer"
            style={{
              left: `${blocco.x * 10}px`,
              top: `${blocco.y * 10}px`,
              width: '10px',
              height: '10px',
              backgroundColor: '#777777',
              borderRadius: '3px',
              textAlign: 'center',
              lineHeight: '10px',
              color: '#fff',
            }}
          >
            {blocco.etichetta}
          </a>
        ))}
      </div>
    </div>
  );
};

export default PixelGrid;
