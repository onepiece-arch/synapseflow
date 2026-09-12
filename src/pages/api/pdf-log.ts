import type { APIRoute } from 'astro';
import { logPdfOperation } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth?.userId || 'guest_user';

    const body = await request.json();
    const { tool_type, filename, original_size, optimized_size, page_count, status, metadata } = body;

    if (!tool_type || !filename) {
      return new Response(JSON.stringify({ error: 'Missing tool_type or filename' }), { status: 400 });
    }

    const result = await logPdfOperation(userId, {
      tool_type,
      filename,
      original_size,
      optimized_size,
      page_count,
      status,
      metadata,
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
