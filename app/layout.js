import { Cormorant_Garamond, Manrope } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { pixelVendutiPresto } from "../lib/db";
import { SOGLIA_ASTE } from "../lib/prezzi";
import MenuTelefono from "./components/MenuTelefono";
import { LinguaProvider, CambiaLingua } from "./components/Lingua";
import { lingua, traduttore } from "../lib/lingua";
import { PRENOTAZIONI } from "../lib/modo";

export const revalidate = 30;

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["600", "700"], style: ["normal", "italic"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-body" });

export async function generateMetadata() {
  const { T } = await traduttore();
  return {
    title: T("PixelHype · Un'opera d'arte fatta di marchi", "PixelHype · A work of art made of brands"),
    description: T("10.000 pixel, per sempre. Prendi il tuo spazio nel mosaico: immagine, link e posizione restano tuoi.", "10,000 pixels, forever. Get your space in the mosaic: your image, link and position stay yours."),
  };
}

function Marchio({ verde = "#123d30" }) {
  return (
    <svg className="marchio" viewBox="0 0 52 52" width="26" height="26" aria-hidden="true">
      <rect width="24" height="24" fill="#b8925a" />
      <rect x="28" width="24" height="24" fill="#d9bf8c" />
      <rect y="28" width="24" height="24" fill={verde} />
      <rect x="28" y="28" width="24" height="24" fill="#b8925a" />
    </svg>
  );
}

export default async function RootLayout({ children }) {
  const asteAperte = !PRENOTAZIONI && (await pixelVendutiPresto()) >= SOGLIA_ASTE; // booking mode: no auctions yet
  const lang = await lingua(), T = (it, en) => (lang === "en" ? en : it);
  return (
    <html lang={lang} className={`${display.variable} ${body.variable}`}>
      <body><LinguaProvider lingua={lang}>
        <header className="site-header">
          <div className="wrap hd">
            <Link href="/" className="logo">
              <Marchio />
              <span>Pixel<i>Hype</i></span>
            </Link>
            <nav className="nav">
              <Link href="/#galleria">{T("La galleria", "The gallery")}</Link>
              <Link href="/compra">{T("Prezzi", "Prices")}</Link>
              {asteAperte && <Link href="/aste" className="nav-aste">{T("Aste", "Auctions")}</Link>}
              <Link href="/#aste">{T("Il Cuore", "The Heart")}</Link>
              <Link href="/#come">{T("Come funziona", "How it works")}</Link>
            </nav>
            <CambiaLingua />
            <Link href="/compra" className="cta sm">
              <span className="solo-pc">{PRENOTAZIONI ? T("Prenota il tuo spazio", "Book your space") : T("Prendi il tuo spazio", "Get your space")}</span><span className="solo-tel">{PRENOTAZIONI ? T("Prenota", "Book") : T("Compra", "Buy")}</span>
            </Link>
            <MenuTelefono asteAperte={asteAperte} />
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap ft">
            <span className="logo">
              <Marchio verde="#1d5a47" />
              <span>Pixel<i>Hype</i></span>
            </span>
            <span>getpixelhype.com · {T("Contatti", "Contact")}: <a href="mailto:info@getpixelhype.com">info@getpixelhype.com</a> · {T("Ogni immagine viene controllata prima di andare online · Prezzi + IVA", "Every image is checked before it goes online · Prices + VAT")}</span>
            <span className="legal-links"><Link href="/termini">{T("Termini e condizioni", "Terms and conditions")}</Link><Link href="/privacy">Privacy</Link><Link href="/cookie">Cookie</Link></span>
          </div>
        </footer>
      </LinguaProvider></body>
    </html>
  );
}
