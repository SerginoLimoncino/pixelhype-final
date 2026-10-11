// Common layout of the legal pages (Termini, Privacy, Cookie).
export default function Legale({ titolo, aggiornato, children }) {
  return (
    <section className="wrap legale">
      <div className="eyebrow">Documenti</div>
      <h1>{titolo}</h1>
      <p className="muted">Ultimo aggiornamento: {aggiornato}</p>
      {children}
    </section>
  );
}
