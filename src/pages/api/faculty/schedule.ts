import type { APIRoute } from 'astro';
import { addFacultyTimetable, getFacultyTimetable } from '../../../lib/supabase';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth?.userId || 'guest_user';
    const schedule = await getFacultyTimetable(userId);
    return new Response(JSON.stringify({ success: true, data: schedule }), {
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
    const { day_of_week, time_slot, course_name, topic, room, session_type } = body;

    if (!day_of_week || !time_slot || !course_name) {
      return new Response(JSON.stringify({ error: 'Day, time slot, and course name are required' }), { status: 400 });
    }

    const item = await addFacultyTimetable(userId, {
      day_of_week,
      time_slot,
      course_name,
      topic,
      room,
      session_type,
    });

    return new Response(JSON.stringify({ success: true, data: item }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
