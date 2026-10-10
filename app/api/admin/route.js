import Stripe from "stripe";
import { timingSafeEqual } from "crypto";
import { PACCHETTI } from "../../../lib/prezzi";
import { controllaLink } from "../../../lib/controlloLink";
import { listaAste } from "../../../lib/aste";
import { dbAttivo, tuttiGliSpazi, aggiorna, cancella, nuovoOrdine, salvaImmagine, assegnaPosizione } from "../../../lib/db";

export const dynamic = "force-dynamic";

// Sergio's control panel. The password is ADMIN_PASSWORD, set on Vercel.
function autorizzato(req) {
  const giusta = process.env.ADMIN_PASSWORD || "";
  const data = req.headers.get("x-admin") || "";
  if (giusta.length < 8 || data.length !== giusta.length) return false;
  return timingSafeEqual(Buffer.from(data), Buffer.from(giusta));
}

export async function POST(req) {
  if (!process.env.ADMIN_PASSWORD) return Response.json({ errore: "Manca ADMIN_PASSWORD su Vercel." }, { status: 503 });
  if (!autorizzato(req)) return Response.json({ errore: "Password sbagliata." }, { status: 401 });
  if (!dbAttivo()) return Response.json({ errore: "Il database non è ancora collegato." }, { status: 503 });

  const b = await req.json().catch(() => ({}));
  try {
    switch (b.azione) {
      case "lista":
        return Response.json({ spazi: await tuttiGliSpazi(), aste: await listaAste().catch(() => null) });
      case "approva":
        await aggiorna(b.id, { stato: "online" });
        break;
      case "nascondi":
        await aggiorna(b.id, { stato: "nascosto" });
        break;
      case "cancella":
        await cancella(b.id); // libera anche la posizione
        break;
      case "modifica": {
        const campi = {};
        if (b.nome) campi.nome = String(b.nome).slice(0, 80);
        if (b.link) { const l = await controllaLink(b.link); if (!l.ok) return Response.json({ errore: l.motivo }, { status: 400 }); campi.link = l.link; }
        if (b.immagine) campi.img = await salvaImmagine(`${b.id}-${Date.now()}.${b.immagine.startsWith("data:image/webp") ? "webp" : "jpg"}`, b.immagine);
        if (Object.keys(campi).length) await aggiorna(b.id, campi);
        break;
      }
      case "regala": {
        const p = PACCHETTI[b.pack];
        if (!p || !b.nome || !b.link || !b.immagine) return Response.json({ errore: "Compila pacchetto, nome, link e immagine." }, { status: 400 });
        const l = await controllaLink(b.link);
        if (!l.ok) return Response.json({ errore: l.motivo }, { status: 400 });
        const link = l.link;
        const id = await nuovoOrdine({ pack: p.n, nome: String(b.nome).slice(0, 80), link, prezzo: 0, omaggio: true });
        const img = await salvaImmagine(`${id}-${Date.now()}.${b.immagine.startsWith("data:image/webp") ? "webp" : "jpg"}`, b.immagine);
        await aggiorna(id, { img });
        await assegnaPosizione(id, "online");
        break;
      }
      case "verifica": {
        // A paid order whose buyer closed the page before coming back: check with Stripe and place it.
        const tutti = await tuttiGliSpazi();
        const o = tutti.find((x) => x.id === b.id);
        if (!o?.stripe_session || !process.env.STRIPE_SECRET_KEY) return Response.json({ errore: "Nessun pagamento collegato." }, { status: 400 });
        const s = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(o.stripe_session);
        if (s.payment_status !== "paid") return Response.json({ errore: "Questo ordine non risulta pagato." }, { status: 400 });
        await assegnaPosizione(o.id, s.metadata?.da_controllare === "si" ? "da_controllare" : "online");
        break;
      }
      default:
        return Response.json({ errore: "Azione sconosciuta." }, { status: 400 });
    }
    return Response.json({ ok: true, spazi: await tuttiGliSpazi() });
  } catch (e) {
    return Response.json({ errore: e.message || "Errore." }, { status: 500 });
  }
}
