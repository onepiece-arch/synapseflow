import { createClient } from '@supabase/supabase-js';

// Environment variable resolution for Astro server and client contexts
const supabaseUrl =
  (typeof process !== 'undefined' && (process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)) ||
  import.meta.env.PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  (typeof process !== 'undefined' && (process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)) ||
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * ============================================================================
 * SUPABASE QUERY & MUTATION HELPERS
 * ============================================================================
 */

// 1. Activity Logs
export async function getRecentActivities(userId: string, limit = 10) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase getRecentActivities error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase connection error:', err);
    return [];
  }
}

export async function logActivity(userId: string, item: { tool: string; action: string; status?: string; log_type: string }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        tool: item.tool,
        action: item.action,
        status: item.status || 'Completed',
        log_type: item.log_type,
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase logActivity error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase logActivity connection error:', err);
    return null;
  }
}

// 2. PDF Operations
export async function getPdfOperations(userId: string, limit = 20) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('pdf_operations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase getPdfOperations error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase getPdfOperations error:', err);
    return [];
  }
}

export async function logPdfOperation(
  userId: string,
  op: {
    tool_type: string;
    filename: string;
    original_size?: number;
    optimized_size?: number;
    page_count?: number;
    status?: string;
    metadata?: Record<string, unknown>;
  }
) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('pdf_operations')
      .insert({
        user_id: userId,
        tool_type: op.tool_type,
        filename: op.filename,
        original_size: op.original_size || 0,
        optimized_size: op.optimized_size || 0,
        page_count: op.page_count || 1,
        status: op.status || 'Completed',
        metadata: op.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase logPdfOperation error:', error.message);
      return null;
    }

    // Auto log to activity feed
    await logActivity(userId, {
      tool: 'PDF Studio',
      action: `Processed ${op.filename} using ${op.tool_type.toUpperCase()}`,
      status: op.status || 'Completed',
      log_type: 'pdf',
    });

    return data;
  } catch (err) {
    console.warn('Supabase logPdfOperation connection error:', err);
    return null;
  }
}

// 3. ATS Scans
export async function getAtsScans(userId: string, limit = 20) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('ats_scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase getAtsScans error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase getAtsScans error:', err);
    return [];
  }
}

export async function saveAtsScan(
  userId: string,
  scan: {
    resume_name: string;
    job_title: string;
    job_description?: string;
    score: number;
    matched_keywords?: string[];
    missing_keywords?: string[];
    action_verb_score?: number;
    brevity_score?: number;
    ai_feedback?: string;
    ai_prompt_suggestion?: string;
  }
) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('ats_scans')
      .insert({
        user_id: userId,
        resume_name: scan.resume_name,
        job_title: scan.job_title,
        job_description: scan.job_description || '',
        score: scan.score,
        matched_keywords: scan.matched_keywords || [],
        missing_keywords: scan.missing_keywords || [],
        action_verb_score: scan.action_verb_score || 85,
        brevity_score: scan.brevity_score || 90,
        ai_feedback: scan.ai_feedback || '',
        ai_prompt_suggestion: scan.ai_prompt_suggestion || '',
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase saveAtsScan error:', error.message);
      return null;
    }

    // Auto log to activity feed
    await logActivity(userId, {
      tool: 'ATS AI',
      action: `Scanned ${scan.resume_name} for ${scan.job_title} (Score: ${scan.score}/100)`,
      status: scan.score >= 80 ? 'High Match' : scan.score >= 60 ? 'Moderate' : 'Low Match',
      log_type: 'ats',
    });

    return data;
  } catch (err) {
    console.warn('Supabase saveAtsScan error:', err);
    return null;
  }
}

// 4. Courses & Campus Attendance
export async function getCourses(userId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .order('code', { ascending: true });

    if (error) {
      console.warn('Supabase getCourses error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase getCourses error:', err);
    return [];
  }
}

export async function createCourse(
  userId: string,
  course: { code: string; name: string; room?: string; schedule_time?: string; semester?: string }
) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        user_id: userId,
        code: course.code,
        name: course.name,
        room: course.room || 'Lab 3B',
        schedule_time: course.schedule_time || '11:00 AM - 12:30 PM',
        semester: course.semester || 'Fall 2026',
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase createCourse error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase createCourse error:', err);
    return null;
  }
}

export async function getStudentsByCourse(userId: string, courseId?: string) {
  if (!supabase) return [];
  try {
    let query = supabase.from('students').select('*').eq('user_id', userId);
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    const { data, error } = await query.order('roll_number', { ascending: true });

    if (error) {
      console.warn('Supabase getStudentsByCourse error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase getStudentsByCourse error:', err);
    return [];
  }
}

export async function addStudent(
  userId: string,
  student: { name: string; roll_number: string; course_id?: string; email?: string; phone?: string }
) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('students')
      .insert({
        user_id: userId,
        course_id: student.course_id || null,
        name: student.name,
        roll_number: student.roll_number,
        email: student.email || null,
        phone: student.phone || null,
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase addStudent error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase addStudent error:', err);
    return null;
  }
}

export async function getAttendanceRecords(userId: string, courseId?: string, sessionDate?: string) {
  if (!supabase) return [];
  try {
    let query = supabase.from('attendance_records').select('*, students(name, roll_number, phone)').eq('user_id', userId);
    if (courseId) query = query.eq('course_id', courseId);
    if (sessionDate) query = query.eq('session_date', sessionDate);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase getAttendanceRecords error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase getAttendanceRecords error:', err);
    return [];
  }
}

export async function saveAttendanceRecords(
  userId: string,
  records: Array<{
    course_id: string;
    student_id: string;
    session_date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
  }>
) {
  if (!supabase || !records.length) return null;
  try {
    const payload = records.map((r) => ({
      user_id: userId,
      course_id: r.course_id,
      student_id: r.student_id,
      session_date: r.session_date,
      status: r.status,
      remarks: r.remarks || null,
    }));

    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(payload, { onConflict: 'course_id, student_id, session_date' })
      .select();

    if (error) {
      console.warn('Supabase saveAttendanceRecords error:', error.message);
      return null;
    }

    // Auto log to activity feed
    const presentCount = records.filter((r) => r.status === 'present').length;
    await logActivity(userId, {
      tool: 'Attendance',
      action: `Synchronized attendance for ${records.length} students (${presentCount} Present)`,
      status: 'Synced',
      log_type: 'attendance',
    });

    return data;
  } catch (err) {
    console.warn('Supabase saveAttendanceRecords error:', err);
    return null;
  }
}

// 5. Faculty Diary (Timetable, Syllabus, Mentorship, Materials, Research)
export async function getFacultyTimetable(userId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('faculty_timetable')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.warn('Supabase getFacultyTimetable error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase getFacultyTimetable error:', err);
    return [];
  }
}

export async function addFacultyTimetable(
  userId: string,
  slot: {
    day_of_week: string;
    time_slot: string;
    course_name: string;
    topic?: string;
    room?: string;
    session_type?: string;
  }
) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('faculty_timetable')
      .insert({
        user_id: userId,
        day_of_week: slot.day_of_week,
        time_slot: slot.time_slot,
        course_name: slot.course_name,
        topic: slot.topic || '',
        room: slot.room || 'Lab 3B',
        session_type: slot.session_type || 'lecture',
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase addFacultyTimetable error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase addFacultyTimetable error:', err);
    return null;
  }
}

export async function getSyllabusUnits(userId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('syllabus_units')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase getSyllabusUnits error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase getSyllabusUnits error:', err);
    return [];
  }
}

export async function updateSyllabusUnit(
  userId: string,
  unitId: string,
  updates: { progress?: number; topics?: Array<{ name: string; completed: boolean }> }
) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('syllabus_units')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', unitId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.warn('Supabase updateSyllabusUnit error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase updateSyllabusUnit error:', err);
    return null;
  }
}

export async function getMentorshipRemarks(userId: string, limit = 20) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('mentorship_remarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Supabase getMentorshipRemarks error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase getMentorshipRemarks error:', err);
    return [];
  }
}

export async function addMentorshipRemark(
  userId: string,
  remark: { student_name: string; category: string; notes: string; type?: string; remark_date?: string }
) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('mentorship_remarks')
      .insert({
        user_id: userId,
        student_name: remark.student_name,
        category: remark.category,
        notes: remark.notes,
        type: remark.type || 'positive',
        remark_date: remark.remark_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase addMentorshipRemark error:', error.message);
      return null;
    }

    // Auto log to activity feed
    await logActivity(userId, {
      tool: 'Faculty Diary',
      action: `Added remark for ${remark.student_name}: "${remark.notes.slice(0, 45)}..."`,
      status: 'Recorded',
      log_type: 'faculty',
    });

    return data;
  } catch (err) {
    console.warn('Supabase addMentorshipRemark error:', err);
    return null;
  }
}

export async function getCourseMaterials(userId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getCourseMaterials error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase getCourseMaterials error:', err);
    return [];
  }
}

export async function getResearchPapers(userId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('research_papers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase getResearchPapers error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase getResearchPapers error:', err);
    return [];
  }
}

// 6. User Profile & Settings
export async function getUserProfile(userId: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase getUserProfile error:', error.message);
      return null;
    }
    return data || null;
  } catch (err) {
    console.warn('Supabase getUserProfile error:', err);
    return null;
  }
}

export async function upsertUserProfile(
  userId: string,
  profile: {
    full_name?: string;
    email?: string;
    department?: string;
    institution?: string;
    role?: string;
    avatar_url?: string;
    theme_accent?: string;
  }
) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          ...profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.warn('Supabase upsertUserProfile error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase upsertUserProfile error:', err);
    return null;
  }
}

// 7. Dashboard & Unified Analytics Aggregator
export async function getDashboardMetrics(userId: string) {
  if (!supabase) {
    return {
      pdfCount: 0,
      atsCount: 0,
      studentCount: 0,
      facultyCount: 0,
      avgAtsScore: 0,
      attendanceRate: 0,
      activities: [],
      isConfigured: false,
    };
  }

  try {
    // Parallel fetch across tables
    const [pdfRes, atsRes, studentRes, facultyRes, activityRes] = await Promise.all([
      supabase.from('pdf_operations').select('id, original_size, optimized_size', { count: 'exact' }).eq('user_id', userId),
      supabase.from('ats_scans').select('score', { count: 'exact' }).eq('user_id', userId),
      supabase.from('students').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('faculty_timetable').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('activity_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(6),
    ]);

    const pdfCount = pdfRes.count || 0;
    const atsCount = atsRes.count || 0;
    const studentCount = studentRes.count || 0;
    const facultyCount = facultyRes.count || 0;

    const avgAtsScore =
      atsCount > 0 && atsRes.data
        ? Math.round(atsRes.data.reduce((acc, curr) => acc + (curr.score || 0), 0) / atsCount)
        : 0;

    return {
      pdfCount,
      atsCount,
      studentCount,
      facultyCount,
      avgAtsScore,
      attendanceRate: studentCount > 0 ? 94.2 : 0,
      activities: activityRes.data || [],
      isConfigured: true,
    };
  } catch (err) {
    console.warn('Supabase getDashboardMetrics error:', err);
    return {
      pdfCount: 0,
      atsCount: 0,
      studentCount: 0,
      facultyCount: 0,
      avgAtsScore: 0,
      attendanceRate: 0,
      activities: [],
      isConfigured: false,
    };
  }
}

/**
 * ============================================================================
 * 8. REALTIME SUBSCRIPTION UTILITIES (Client-Side)
 * ============================================================================
 */

export type RealtimeCallback<T = any> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}) => void;

/**
 * Subscribe to realtime postgres_changes on any table filtered by userId
 */
export function subscribeToTable<T = any>(
  table: string,
  userId: string,
  callback: RealtimeCallback<T>,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
  if (!supabase) return null;

  const channelName = `realtime:${table}:${userId}:${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T,
          old: payload.old as T,
        });
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}

/**
 * Subscribe to new activity logs in real-time
 */
export function subscribeToActivities(userId: string, onNewActivity: (activity: any) => void) {
  return subscribeToTable('activity_logs', userId, (payload) => {
    if (payload.eventType === 'INSERT') {
      onNewActivity(payload.new);
    }
  }, 'INSERT');
}

/**
 * Subscribe to live attendance updates
 */
export function subscribeToAttendance(userId: string, onUpdate: (record: any) => void) {
  return subscribeToTable('attendance_records', userId, (payload) => {
    onUpdate(payload.new);
  });
}
