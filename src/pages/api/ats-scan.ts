import type { APIRoute } from 'astro';
import { saveAtsScan } from '../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const auth = locals.auth();
    const userId = auth?.userId || 'guest_user';

    const body = await request.json();
    const {
      resume_name,
      job_title,
      job_description,
      score,
      matched_keywords,
      missing_keywords,
      action_verb_score,
      brevity_score,
      ai_feedback,
      ai_prompt_suggestion,
    } = body;

    if (!resume_name || !job_title || score === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required scan fields' }), { status: 400 });
    }

    const result = await saveAtsScan(userId, {
      resume_name,
      job_title,
      job_description,
      score,
      matched_keywords,
      missing_keywords,
      action_verb_score,
      brevity_score,
      ai_feedback,
      ai_prompt_suggestion,
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
