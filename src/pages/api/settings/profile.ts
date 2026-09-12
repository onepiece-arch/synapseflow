import type { APIRoute } from 'astro';
import { getUserProfile, upsertUserProfile } from '../../../lib/supabase';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth?.userId || 'guest_user';
    const profile = await getUserProfile(userId);
    return new Response(JSON.stringify({ success: true, data: profile }), {
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
    const { full_name, email, department, institution, role, avatar_url, theme_accent } = body;

    const profile = await upsertUserProfile(userId, {
      full_name,
      email,
      department,
      institution,
      role,
      avatar_url,
      theme_accent,
    });

    return new Response(JSON.stringify({ success: true, data: profile }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
