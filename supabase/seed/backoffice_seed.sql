-- Nettoyage
truncate table public.sessions;
truncate table public.assignments;
truncate table public.requests;
truncate table if exists public.parent_invoices;
truncate table if exists public.student_progress_points;
truncate table if exists public.parent_overviews;
truncate table if exists public.quiz_attempts;
truncate table if exists public.quiz_questions;
truncate table if exists public.quizzes;
truncate table if exists public.course_enrollments;
truncate table if exists public.course_lessons;
truncate table if exists public.courses;

-- Demandes
insert into public.requests (parent_name, child_name, level, subject, phone, status, request_date) values
('Mariama Bah', 'Salif Bah', '6e', 'Maths', '+237 682 111 222', 'reçu', '2026-03-03'),
('Patrick Etundi', 'Grace Etundi', '2de', 'SVT', '+237 677 333 444', 'en traitement', '2026-03-02'),
('Cécile Mbassi', 'Junior Mbassi', 'CM1', 'Lecture', '+237 695 222 333', 'assigné', '2026-03-01'),
('Roger Tabi', 'Nadège Tabi', 'Terminale D', 'Physique', '+237 678 444 555', 'clôturé', '2026-02-28'),
('Hélène Noa', 'Christelle Noa', '3e', 'Français', '+237 691 555 666', 'reçu', '2026-03-04');

-- Assignations
insert into public.assignments (child_name, level, subject, needs, schedule, candidates, status) values
(
    'Ibrahima Konaté',
    '5e',
    'Anglais',
    array['Oral', 'Compréhension écrite'],
    'Mar/Jeu 14h-16h',
    '[
        {"name": "Rebecca Ateba", "rating": 5.0, "available": true},
        {"name": "Patrick Etundi", "rating": 4.7, "available": true}
    ]',
    'pending'
),
(
    'Salif Bah',
    '6e',
    'Mathématiques',
    array['Calcul', 'Géométrie'],
    'Lun/Mer 16h-18h',
    '[
        {"name": "Dr. Clémentine Abanda", "rating": 4.9, "available": false},
        {"name": "Serge Mbarga", "rating": 4.8, "available": true}
    ]',
    'pending'
);

-- Sessions
insert into public.sessions (
    session_day, session_date, session_time, subject, location, status,
    teacher_id, teacher_name, student_id, student_name, parent_id, parent_name
) values
('Lundi', '2026-03-02', '16h00-17h30', 'Mathématiques', 'Domicile', 'effectué', 't1', 'Dr. Clémentine Abanda', 's1', 'Koffi Diallo', 'p1', 'Aminata Diallo'),
('Mardi', '2026-03-03', '18h00-19h30', 'Physique', 'En ligne', 'planifié', 't1', 'Dr. Clémentine Abanda', 's1', 'Koffi Diallo', 'p1', 'Aminata Diallo'),
('Mercredi', '2026-03-05', '16h00-17h30', 'Mathématiques', 'Domicile', 'à venir', 't1', 'Dr. Clémentine Abanda', 's1', 'Koffi Diallo', 'p1', 'Aminata Diallo'),
('Jeudi', '2026-03-06', '15h00-16h30', 'Statistiques', 'En ligne', 'planifié', 't2', 'Brice Owona', 's2', 'Sandra Belinga', 'p2', 'Marie Belinga'),
('Vendredi', '2026-03-07', '17h00-18h30', 'Physique', 'En ligne', 'planifié', 't1', 'Dr. Clémentine Abanda', 's3', 'Rose Mbella', 'p3', 'Paul Mbella'),
('Samedi', '2026-03-08', '10h00-11h30', 'SVT', 'Centre Bonapriso', 'planifié', 't3', 'Rebecca Ateba', 's4', 'Ibrahima Konaté', 'p4', 'Fatou Konaté');

insert into public.parent_overviews (
    parent_id, parent_name, student_id, child_name, child_level, focus_subject,
    sessions_this_month, current_avg, previous_avg, total_paid_this_month
) values
('p1', 'Aminata Diallo', 's1', 'Koffi Diallo', '3e', 'Mathématiques', 8, 14.5, 11.0, 144000);

insert into public.student_progress_points (
    parent_id, month_label, month_order, maths, francais, anglais
) values
('p1', 'Oct', 1, 8.0, 11.0, 12.0),
('p1', 'Nov', 2, 9.0, 11.0, 13.0),
('p1', 'Déc', 3, 10.0, 12.0, 13.0),
('p1', 'Jan', 4, 12.0, 13.0, 14.0),
('p1', 'Fév', 5, 13.0, 13.0, 14.0),
('p1', 'Mar', 6, 14.5, 14.0, 15.0);

insert into public.parent_invoices (
    id, parent_id, invoice_date, description, amount, status
) values
('inv1', 'p1', '2026-02-28', '4 séances Mathématiques (février S4)', 72000, 'paid'),
('inv2', 'p1', '2026-02-14', '4 séances Mathématiques (février S2)', 72000, 'paid'),
('inv3', 'p1', '2026-01-31', '8 séances Mathématiques (janvier)', 144000, 'paid'),
('inv4', 'p1', '2026-03-05', '4 séances Mathématiques (mars S1)', 72000, 'pending');

insert into public.courses (
    id, title, description, subject, level, status, cover_url, created_by
) values
('course-math-1',
 'Parcours Maths : Fractions et Statistiques',
 'Programme interactif sur les fractions, la proportionnalité et les graphiques statistiques.',
 'Mathématiques',
 '3e',
 'published',
 'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=900&q=80',
 't1');

insert into public.course_lessons (id, course_id, title, content, video_url, order_index) values
('lesson-math-1', 'course-math-1', 'Comprendre les fractions', 'Décomposition des fractions et simplification pas à pas.', 'https://www.youtube.com/watch?v=3pQQ7DjXJ0Y', 1),
('lesson-math-2', 'course-math-1', 'Proportionnalité et ratios', 'Méthodologie pour résoudre des problèmes de proportion.', null, 2),
('lesson-math-3', 'course-math-1', 'Lire un graphique', 'Identifier médiane, moyenne et tendance sur un graphique.', null, 3);

insert into public.quizzes (id, course_id, lesson_id, title, instructions, total_points) values
('quiz-lesson-math-1', 'course-math-1', 'lesson-math-1', 'Quiz fractions', 'Répondez aux questions suivantes.', 6);

insert into public.quiz_questions (id, quiz_id, prompt, choices, correct_answer, points) values
('quizq1', 'quiz-lesson-math-1', 'Quelle est la fraction équivalente à 2/4 ?', '[
    {"id":"A","label":"1/2"},
    {"id":"B","label":"2/2"},
    {"id":"C","label":"3/4"}
]', 'A', 2),
('quizq2', 'quiz-lesson-math-1', 'Combien font 3/5 + 1/5 ?', '[
    {"id":"A","label":"5/5"},
    {"id":"B","label":"4/5"},
    {"id":"C","label":"6/5"}
]', 'B', 2),
('quizq3', 'quiz-lesson-math-1', 'Simplifiez 9/12.', '[
    {"id":"A","label":"3/4"},
    {"id":"B","label":"1/4"},
    {"id":"C","label":"2/3"}
]', 'C', 2);

insert into public.course_enrollments (course_id, student_id, student_name, assigned_by) values
('course-math-1', 's1', 'Koffi Diallo', 't1');

insert into public.quiz_attempts (quiz_id, student_id, student_name, answers, score) values
('quiz-lesson-math-1', 's1', 'Koffi Diallo', '[
    {"questionId":"quizq1","answer":"A"},
    {"questionId":"quizq2","answer":"B"},
    {"questionId":"quizq3","answer":"C"}
]', 6);
