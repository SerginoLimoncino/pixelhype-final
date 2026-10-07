import { spaziOnline, pixelVenduti } from "../../../lib/db";

export const dynamic = "force-dynamic";

// The spaces shown in the mosaic.
export async function GET() {
  const [spazi, venduti] = await Promise.all([spaziOnline(), pixelVenduti()]).catch(() => [[], 0]);
  return Response.json({ spazi, venduti });
}
