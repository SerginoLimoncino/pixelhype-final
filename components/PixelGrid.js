import React from 'react';

// Dati fittizi per i blocchi
const datiFittizi = [
  { id: 1, x: 20, y: 20, h: 20, collegamento: "https://esempio.com", etichetta: "Progetto 1" },
  { id: 2, x: 30, y: 30, h: 20, collegamento: "https://google.com", etichetta: "Progetto 2" },
  { id: 3, x: 40, y: 40, h: 20, collegamento: "https://yahoo.com", etichetta: "Progetto 3" },
  // Puoi aggiungere altri blocchi qui
];

const PixelGrid = () => {
  const dimensioneDellaGriglia = 300; // Larghezza della griglia (300 blocchi)

  // Visualizzare i dati nella console per il debug
  console.log(datiFittizi); // Qui puoi vedere i tuoi dati in console

  return (
    <div className="relative w-full h-[100vh] bg-white overflow-scroll border">
      <div
        className="absolute"
        style={{
          width: `${dimensioneDellaGriglia * 10}px`,
          height: `${dimensioneDellaGriglia * 10}px`,
          position: 'relative',
        }}
      >
        {datiFittizi.map((blocco) => (
          <div key={blocco.id} className="absolute" style={{ left: `${blocco.x * 10}px`, top: `${blocco.y * 10}px` }}>
            <a
              href={blocco.collegamento}
              target="_blank"
              rel="noopener noreferrer"
              className="group absolute"
              style={{
                width: `${blocco.h * 10}px`,
                height: `${blocco.h * 10}px`,
                backgroundColor: '#FF5722',
                color: '#fff',
                borderRadius: '8px',
                textAlign: 'center',
                lineHeight: `${blocco.h * 10}px`,
              }}
            >
              {blocco.etichetta}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PixelGrid;
