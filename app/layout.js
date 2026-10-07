import { Cormorant_Garamond, Manrope } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["600", "700"], style: ["normal", "italic"], variable: "--font-display" });
const body = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-body" });

export const metadata = {
  title: "PixelHype · Un'opera d'arte fatta di marchi",
  description: "10.000 pixel, per sempre. Prendi il tuo spazio nel mosaico: immagine, link e posizione restano tuoi.",
};

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

export default function RootLayout({ children }) {
  return (
    <html lang="it" className={`${display.variable} ${body.variable}`}>
      <body>
        <header className="site-header">
          <div className="wrap hd">
            <Link href="/" className="logo">
              <Marchio />
              <span>Pixel<i>Hype</i></span>
            </Link>
            <nav className="nav">
              <Link href="/#galleria">La galleria</Link>
              <Link href="/compra">Prezzi</Link>
              <Link href="/#aste">Il Cuore</Link>
              <Link href="/#come">Come funziona</Link>
            </nav>
            <Link href="/compra" className="cta sm">
              Prendi il tuo spazio
            </Link>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap ft">
            <span className="logo">
              <Marchio verde="#1d5a47" />
              <span>Pixel<i>Hype</i></span>
            </span>
            <span>getpixelhype.com · Contatti: <a href="mailto:info@getpixelhype.com">info@getpixelhype.com</a> · Ogni immagine viene controllata prima di andare online · Prezzi + IVA</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
