export const runtime = 'nodejs';

// Setup wizard désactivé
export async function GET() {
  return new Response(null, { status: 410 });
}

export async function POST() {
  return new Response(null, { status: 410 });
}
