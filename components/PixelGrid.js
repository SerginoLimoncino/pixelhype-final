components/PixelGrid.js
import React from "react";

const mockData = [
  {
    id: 1,
    x: 5,
    y: 2,
    w: 10,
    h: 10,
    link: "https://example.com",
    label: "Progetto 1"
  },
  {
    id: 2,
    x: 20,
    y: 5,
    w: 20,
    h: 20,
    link: "https://google.com",
    label: "Progetto 2"
  },
  // Aggiungi altri blocchi qui
];

const PixelGrid = () => {
  const gridSize = 300; // larghezza: 300 blocchi

  return (
    <div className="relative w-full h-[1000px] bg-white overflow-scroll border">
      <div
        className="absolute"
        style={{
          width: `${gridSize * 10}px`,
          height: `${100 * 10}px`,
          position: "relative",
        }}
      >
        {mockData.map((block) => (
          <a
            key={block.id}
            href={block.link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute group"
            style={{
              left: `${block.x * 10}px`,
              top: `${block.y * 10}px`,
              width: `${block.w * 10}px`,
              height: `${block.h * 10}px`,
              backgroundColor: "#b2f5ea",
              border: "1px solid #38b2ac",
            }}
          >
            <span className="hidden group-hover:flex absolute top-0 left-0 bg-black text-white text-xs p-1 z-10">
              {block.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default PixelGrid;


