# PixelHype · sito stile Galleria

File completi da copiare nel progetto (stessi percorsi):

| File | Cosa fa |
|---|---|
| `app/layout.js` | Intestazione, piè di pagina, font (Cormorant Garamond + Manrope) |
| `app/globals.css` | Tutto lo stile: avorio, oro, nero, verde |
| `app/page.js` | Home: fase e prezzo, vetrina "In evidenza", mosaico, fasi, pacchetti, Il Cuore, come funziona |
| `app/compra/page.js` | Pagina dei pacchetti |
| `app/crea-spazio/page.js` | Pagina `/crea-spazio?pack=X` |
| `app/crea-spazio/CreaSpazio.js` | Modulo: pacchetto, nome, link, immagine, email, anteprima, riepilogo, Paga |
| `app/components/Mosaico.js` | Il mosaico esplorabile (trascina, zoom, ricerca, mini-mappa) |
| `app/components/Pacchetti.js` | Le schede dei 6 pacchetti |
| `lib/prezzi.js` | Listino ufficiale: fasi, pacchetti, sconti, basi d'asta |

## Come provarlo

1. Copia i file nella cartella del progetto, negli stessi percorsi (la cartella `lib` va accanto alla cartella `app`).
2. Nel terminale di Visual Studio Code: `npm run dev`
3. Apri http://localhost:3000

## Da sapere

- `DEMO = true` in `app/components/Mosaico.js` mostra marchi di esempio. Al lancio va messo `false`.
- Pagamenti: Stripe. La chiave segreta va su Vercel → Variabili ambientali con il nome `STRIPE_SECRET_KEY` (mai nel codice). Senza chiave il pagamento resta una prova. Con una chiave `sk_test_` si paga con carte di prova; con `sk_live_` si incassa davvero.
- `PIXEL_VENDUTI = 0` in `lib/prezzi.js`: quando ci sarà il database il numero arriverà da lì, e il prezzo salirà da solo.
- Provato con Next.js 15 e React 19.
