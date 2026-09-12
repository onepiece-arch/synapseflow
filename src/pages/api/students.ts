import type { APIRoute } from 'astro';
import { addStudent, getStudentsByCourse } from '../../lib/supabase';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth?.userId || 'guest_user';
    const courseId = url.searchParams.get('courseId') || undefined;

    const students = await getStudentsByCourse(userId, courseId);
    return new Response(JSON.stringify({ success: true, data: students }), {
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
    const { name, roll_number, course_id, email, phone } = body;

    if (!name || !roll_number) {
      return new Response(JSON.stringify({ error: 'Name and roll number are required' }), { status: 400 });
    }

    const student = await addStudent(userId, { name, roll_number, course_id, email, phone });
    return new Response(JSON.stringify({ success: true, data: student }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
