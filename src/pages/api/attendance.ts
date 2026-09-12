import type { APIRoute } from 'astro';
import { getAttendanceRecords, saveAttendanceRecords } from '../../lib/supabase';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth?.userId || 'guest_user';
    const courseId = url.searchParams.get('courseId') || undefined;
    const date = url.searchParams.get('date') || undefined;

    const records = await getAttendanceRecords(userId, courseId, date);
    return new Response(JSON.stringify({ success: true, data: records }), {
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
    const { records } = body;

    if (!records || !Array.isArray(records)) {
      return new Response(JSON.stringify({ error: 'Array of attendance records is required' }), { status: 400 });
    }

    const result = await saveAttendanceRecords(userId, records);
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
