import { traduttore } from "../../lib/lingua";

// Common layout of the legal pages (Termini, Privacy, Cookie).
export default async function Legale({ titolo, aggiornato, children }) {
  const { T } = await traduttore();
  return (
    <section className="wrap legale">
      <div className="eyebrow">{T("Documenti", "Documents")}</div>
      <h1>{titolo}</h1>
      <p className="muted">{T("Ultimo aggiornamento", "Last updated")}: {aggiornato}</p>
      {children}
    </section>
  );
}
