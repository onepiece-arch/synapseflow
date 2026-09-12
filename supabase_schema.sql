-- ============================================================================
-- SYNAPSEFLOW SAAS - SUPABASE SQL SCHEMA & REALTIME SETUP
-- Complete, Type-Safe (UUID) with Clean Table Drops & Realtime
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DROP EXISTING CONFLICTING TABLES (CLEAN SLATE)
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.research_papers CASCADE;
DROP TABLE IF EXISTS public.course_materials CASCADE;
DROP TABLE IF EXISTS public.mentorship_remarks CASCADE;
DROP TABLE IF EXISTS public.syllabus_units CASCADE;
DROP TABLE IF EXISTS public.faculty_timetable CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.ats_scans CASCADE;
DROP TABLE IF EXISTS public.pdf_operations CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 3. AUTO UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. CREATE TABLES (ALL UUID PRIMARY KEYS)
-- ============================================================================

-- Table 1: user_profiles
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    department TEXT DEFAULT 'Department of Computer Science',
    institution TEXT DEFAULT 'University Campus',
    role TEXT DEFAULT 'Administrator',
    avatar_url TEXT,
    plan TEXT DEFAULT 'pro',
    theme_accent TEXT DEFAULT '#ffd02f',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 2: pdf_operations
CREATE TABLE public.pdf_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    tool_type TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_size BIGINT DEFAULT 0,
    optimized_size BIGINT DEFAULT 0,
    page_count INT DEFAULT 1,
    status TEXT DEFAULT 'Completed',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 3: ats_scans
CREATE TABLE public.ats_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    resume_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    job_description TEXT,
    score INT NOT NULL CHECK (score >= 0 AND score <= 100),
    matched_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    missing_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    action_verb_score INT DEFAULT 85,
    brevity_score INT DEFAULT 90,
    ai_feedback TEXT,
    ai_prompt_suggestion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 4: courses
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    room TEXT DEFAULT 'Lab 3B',
    schedule_time TEXT DEFAULT '11:00 AM - 12:30 PM',
    semester TEXT DEFAULT 'Fall 2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 5: students
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 6: attendance_records
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'present',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_course_session UNIQUE (course_id, student_id, session_date)
);

-- Table 7: faculty_timetable
CREATE TABLE public.faculty_timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    course_name TEXT NOT NULL,
    topic TEXT,
    room TEXT DEFAULT 'Lab 3B',
    session_type TEXT DEFAULT 'lecture',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 8: syllabus_units
CREATE TABLE public.syllabus_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    unit_title TEXT NOT NULL,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    topics JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 9: mentorship_remarks
CREATE TABLE public.mentorship_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    category TEXT NOT NULL,
    notes TEXT NOT NULL,
    remark_date DATE DEFAULT CURRENT_DATE,
    type TEXT DEFAULT 'positive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 10: course_materials
CREATE TABLE public.course_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Notes',
    file_url TEXT,
    file_size TEXT DEFAULT '2.4 MB',
    downloads INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 11: research_papers
CREATE TABLE public.research_papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    journal TEXT NOT NULL,
    status TEXT DEFAULT 'Published',
    citations INT DEFAULT 0,
    publication_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 12: activity_logs
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    tool TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT DEFAULT 'Completed',
    log_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_syllabus_units_updated_at ON public.syllabus_units;
CREATE TRIGGER set_syllabus_units_updated_at
    BEFORE UPDATE ON public.syllabus_units
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 6. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_pdf_ops_user ON public.pdf_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_ats_scans_user ON public.ats_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_user ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_course ON public.students(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON public.attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance_records(course_id, session_date);
CREATE INDEX IF NOT EXISTS idx_faculty_time_user ON public.faculty_timetable(user_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_user ON public.syllabus_units(user_id);
CREATE INDEX IF NOT EXISTS idx_remarks_user ON public.mentorship_remarks(user_id);
CREATE INDEX IF NOT EXISTS idx_materials_user ON public.course_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_research_user ON public.research_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id);

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Allow full access to user_profiles" ON public.user_profiles;
CREATE POLICY "Allow full access to user_profiles" ON public.user_profiles FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to pdf_operations" ON public.pdf_operations;
CREATE POLICY "Allow full access to pdf_operations" ON public.pdf_operations FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to ats_scans" ON public.ats_scans;
CREATE POLICY "Allow full access to ats_scans" ON public.ats_scans FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to courses" ON public.courses;
CREATE POLICY "Allow full access to courses" ON public.courses FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to students" ON public.students;
CREATE POLICY "Allow full access to students" ON public.students FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to attendance_records" ON public.attendance_records;
CREATE POLICY "Allow full access to attendance_records" ON public.attendance_records FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to faculty_timetable" ON public.faculty_timetable;
CREATE POLICY "Allow full access to faculty_timetable" ON public.faculty_timetable FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to syllabus_units" ON public.syllabus_units;
CREATE POLICY "Allow full access to syllabus_units" ON public.syllabus_units FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to mentorship_remarks" ON public.mentorship_remarks;
CREATE POLICY "Allow full access to mentorship_remarks" ON public.mentorship_remarks FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to course_materials" ON public.course_materials;
CREATE POLICY "Allow full access to course_materials" ON public.course_materials FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to research_papers" ON public.research_papers;
CREATE POLICY "Allow full access to research_papers" ON public.research_papers FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to activity_logs" ON public.activity_logs;
CREATE POLICY "Allow full access to activity_logs" ON public.activity_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- ============================================================================
-- 9. REALTIME REPLICA IDENTITY & PUBLICATION SETUP
-- ============================================================================
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_records REPLICA IDENTITY FULL;
ALTER TABLE public.ats_scans REPLICA IDENTITY FULL;
ALTER TABLE public.pdf_operations REPLICA IDENTITY FULL;
ALTER TABLE public.students REPLICA IDENTITY FULL;
ALTER TABLE public.faculty_timetable REPLICA IDENTITY FULL;
ALTER TABLE public.syllabus_units REPLICA IDENTITY FULL;
ALTER TABLE public.mentorship_remarks REPLICA IDENTITY FULL;
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE 
            public.activity_logs,
            public.attendance_records,
            public.ats_scans,
            public.pdf_operations,
            public.students,
            public.faculty_timetable,
            public.syllabus_units,
            public.mentorship_remarks,
            public.user_profiles;
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;
