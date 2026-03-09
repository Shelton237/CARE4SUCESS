-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Demandes de bilan
create table if not exists public.requests (
    id uuid primary key default gen_random_uuid(),
    parent_name text not null,
    child_name text not null,
    level text not null,
    subject text not null,
    phone text not null,
    status text not null check (status in ('reçu', 'en traitement', 'assigné', 'clôturé')) default 'reçu',
    request_date date not null default current_date,
    created_at timestamptz not null default now()
);

create index if not exists requests_status_idx on public.requests (status);

-- Assignations conseiller -> enseignant
create table if not exists public.assignments (
    id uuid primary key default gen_random_uuid(),
    child_name text not null,
    level text not null,
    subject text not null,
    needs text[] not null default '{}',
    schedule text not null,
    candidates jsonb not null default '[]'::jsonb,
    selected_teacher text,
    status text not null check (status in ('pending', 'selected', 'confirmed')) default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz
);

create index if not exists assignments_status_idx on public.assignments (status);

-- Créneaux de cours
create table if not exists public.sessions (
    id uuid primary key default gen_random_uuid(),
    session_day text not null,
    session_date date not null,
    session_time text not null,
    subject text not null,
    location text not null,
    status text not null check (status in ('effectué', 'à venir', 'planifié')) default 'planifié',
    teacher_id text not null,
    teacher_name text not null,
    student_id text not null,
    student_name text not null,
    parent_id text not null,
    parent_name text not null,
    created_at timestamptz not null default now()
);

create index if not exists sessions_teacher_idx on public.sessions (teacher_id);
create index if not exists sessions_parent_idx on public.sessions (parent_id);
create index if not exists sessions_student_idx on public.sessions (student_id);

-- Synthese parent
create table if not exists public.parent_overviews (
    parent_id text primary key,
    parent_name text not null,
    student_id text not null,
    child_name text not null,
    child_level text not null,
    focus_subject text not null,
    sessions_this_month integer not null,
    current_avg numeric(5,2) not null,
    previous_avg numeric(5,2) not null,
    total_paid_this_month integer not null
);

create index if not exists parent_overviews_student_idx on public.parent_overviews (student_id);

create table if not exists public.student_progress_points (
    id uuid primary key default gen_random_uuid(),
    parent_id text not null,
    month_label text not null,
    month_order integer not null,
    maths numeric(4,1) not null,
    francais numeric(4,1) not null,
    anglais numeric(4,1) not null
);

create index if not exists progress_parent_idx on public.student_progress_points (parent_id, month_order);

create table if not exists public.parent_invoices (
    id uuid primary key default gen_random_uuid(),
    parent_id text not null,
    invoice_date date not null,
    description text not null,
    amount integer not null,
    status text not null check (status in ('paid', 'pending')) default 'pending',
    created_at timestamptz not null default now()
);

create index if not exists invoices_parent_idx on public.parent_invoices (parent_id);
create index if not exists invoices_status_idx on public.parent_invoices (status);

-- Gestion des cours
create table if not exists public.courses (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null,
    subject text not null,
    level text not null,
    status text not null check (status in ('draft', 'published')) default 'draft',
    cover_url text,
    created_by text,
    created_at timestamptz not null default now()
);

create index if not exists courses_status_idx on public.courses (status);

create table if not exists public.course_lessons (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    title text not null,
    content text not null,
    video_url text,
    order_index integer not null default 1
);

create index if not exists lessons_course_idx on public.course_lessons (course_id);

create table if not exists public.course_enrollments (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    student_id text not null,
    student_name text not null,
    assigned_by text,
    assigned_at timestamptz not null default now()
);

create index if not exists enrollments_course_idx on public.course_enrollments (course_id);
create index if not exists enrollments_student_idx on public.course_enrollments (student_id);

create table if not exists public.quizzes (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    lesson_id uuid references public.course_lessons(id) on delete set null,
    title text not null,
    instructions text,
    total_points integer not null default 0,
    created_at timestamptz not null default now()
);

create index if not exists quizzes_course_idx on public.quizzes (course_id);

create table if not exists public.quiz_questions (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references public.quizzes(id) on delete cascade,
    prompt text not null,
    choices jsonb not null default '[]'::jsonb,
    correct_answer text not null,
    points integer not null default 1
);

create index if not exists questions_quiz_idx on public.quiz_questions (quiz_id);

create table if not exists public.quiz_attempts (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references public.quizzes(id) on delete cascade,
    student_id text not null,
    student_name text not null,
    answers jsonb not null default '[]'::jsonb,
    score integer not null,
    created_at timestamptz not null default now()
);

create index if not exists attempts_quiz_idx on public.quiz_attempts (quiz_id);
create index if not exists attempts_student_idx on public.quiz_attempts (student_id);
