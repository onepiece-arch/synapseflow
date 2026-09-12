import type { APIRoute } from 'astro';
import { getSyllabusUnits, updateSyllabusUnit } from '../../../lib/supabase';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth?.userId || 'guest_user';
    const units = await getSyllabusUnits(userId);
    return new Response(JSON.stringify({ success: true, data: units }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth?.userId || 'guest_user';

    const body = await request.json();
    const { unitId, progress, topics } = body;

    if (!unitId) {
      return new Response(JSON.stringify({ error: 'unitId is required' }), { status: 400 });
    }

    const updated = await updateSyllabusUnit(userId, unitId, { progress, topics });
    return new Response(JSON.stringify({ success: true, data: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
