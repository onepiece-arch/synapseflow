import type { APIRoute } from 'astro';
import { addMentorshipRemark, getMentorshipRemarks } from '../../../lib/supabase';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth?.userId || 'guest_user';
    const remarks = await getMentorshipRemarks(userId);
    return new Response(JSON.stringify({ success: true, data: remarks }), {
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
    const { student_name, category, notes, type, remark_date } = body;

    if (!student_name || !notes) {
      return new Response(JSON.stringify({ error: 'Student name and notes are required' }), { status: 400 });
    }

    const remark = await addMentorshipRemark(userId, {
      student_name,
      category: category || 'General Note',
      notes,
      type: type || 'positive',
      remark_date,
    });

    return new Response(JSON.stringify({ success: true, data: remark }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
