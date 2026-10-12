import Link from "next/link";
import { traduttore } from "../lib/lingua";

export async function generateMetadata() {
  const { T } = await traduttore();
  return { title: T("Pagina non trovata · PixelHype", "Page not found · PixelHype") };
}

// Shown for any address that does not exist.
export default async function NonTrovata() {
  const { T } = await traduttore();
  return (
    <section className="wrap buy" style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}>
      <div className="card" style={{ display: "grid", gap: 16 }}>
        <span className="step-n">404</span>
        <p className="ok-big">{T("Questa sala della galleria non esiste.", "This room of the gallery does not exist.")}</p>
        <p className="muted">{T("Il link potrebbe essere sbagliato o vecchio. Torna al mosaico e cerca il marchio che ti interessa.", "The link may be wrong or old. Go back to the mosaic and search for the brand you are looking for.")}</p>
        <Link href="/" className="cta" style={{ justifySelf: "start" }}>{T("Torna al mosaico", "Back to the mosaic")}</Link>
      </div>
    </section>
  );
}
