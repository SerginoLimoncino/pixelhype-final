import Admin from "./Admin";

export const metadata = { title: "Pannello · PixelHype", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default function Page() {
  // Test buttons (e.g. end an auction now) appear only while Stripe is in test mode.
  return <Admin prova={String(process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test")} />;
}
