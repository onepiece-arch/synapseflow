import type { APIRoute } from 'astro';
import { logActivity } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth?.userId || 'guest_user';

    const body = await request.json();
    const { tool, action, status, log_type } = body;

    if (!tool || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const result = await logActivity(userId, { tool, action, status, log_type: log_type || 'system' });
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
