USE care4success;

DELETE FROM quiz_attempts;
DELETE FROM quiz_questions;
DELETE FROM quizzes;
DELETE FROM course_enrollments;
DELETE FROM course_lessons;
DELETE FROM courses;
DELETE FROM parent_invoices;
DELETE FROM student_progress_points;
DELETE FROM parent_overviews;
DELETE FROM teacher_feedback;
DELETE FROM teacher_applications;
DELETE FROM sessions;
DELETE FROM assignments;
DELETE FROM requests;
DELETE FROM platform_settings;

INSERT INTO requests (parent_name, child_name, level, subject, phone, status, request_date) VALUES
('Mariama Bah', 'Salif Bah', '6e', 'Maths', '+237 682 111 222', 'reçu', '2026-03-03'),
('Patrick Etundi', 'Grace Etundi', '2de', 'SVT', '+237 677 333 444', 'en traitement', '2026-03-02'),
('Cécile Mbassi', 'Junior Mbassi', 'CM1', 'Lecture', '+237 695 222 333', 'assigné', '2026-03-01'),
('Roger Tabi', 'Nadège Tabi', 'Terminale D', 'Physique', '+237 678 444 555', 'clôturé', '2026-02-28'),
('Hélène Noa', 'Christelle Noa', '3e', 'Français', '+237 691 555 666', 'reçu', '2026-03-04');

INSERT INTO assignments (child_name, level, subject, needs, schedule, candidates, status) VALUES
(
  'Ibrahima Konaté',
  '5e',
  'Anglais',
  JSON_ARRAY('Oral', 'Compréhension écrite'),
  'Mar/Jeu 14h-16h',
  JSON_ARRAY(
    JSON_OBJECT('name', 'Rebecca Ateba', 'rating', 5.0, 'available', TRUE),
    JSON_OBJECT('name', 'Patrick Etundi', 'rating', 4.7, 'available', TRUE)
  ),
  'pending'
),
(
  'Salif Bah',
  '6e',
  'Mathématiques',
  JSON_ARRAY('Calcul', 'Géométrie'),
  'Lun/Mer 16h-18h',
  JSON_ARRAY(
    JSON_OBJECT('name', 'Dr. Clémentine Abanda', 'rating', 4.9, 'available', FALSE),
    JSON_OBJECT('name', 'Serge Mbarga', 'rating', 4.8, 'available', TRUE)
  ),
  'pending'
);

INSERT INTO sessions (
  session_day, session_date, session_time, subject, location, status,
  teacher_id, teacher_name, student_id, student_name, parent_id, parent_name
) VALUES
('Lundi', '2026-03-02', '16h00-17h30', 'Mathématiques', 'Domicile', 'effectué', 't1', 'Dr. Clémentine Abanda', 's1', 'Koffi Diallo', 'p1', 'Aminata Diallo'),
('Mardi', '2026-03-03', '18h00-19h30', 'Physique', 'En ligne', 'planifié', 't1', 'Dr. Clémentine Abanda', 's1', 'Koffi Diallo', 'p1', 'Aminata Diallo'),
('Mercredi', '2026-03-05', '16h00-17h30', 'Mathématiques', 'Domicile', 'à venir', 't1', 'Dr. Clémentine Abanda', 's1', 'Koffi Diallo', 'p1', 'Aminata Diallo'),
('Jeudi', '2026-03-06', '15h00-16h30', 'Statistiques', 'En ligne', 'planifié', 't2', 'Brice Owona', 's2', 'Sandra Belinga', 'p2', 'Marie Belinga'),
('Vendredi', '2026-03-07', '17h00-18h30', 'Physique', 'En ligne', 'planifié', 't1', 'Dr. Clémentine Abanda', 's3', 'Rose Mbella', 'p3', 'Paul Mbella'),
('Samedi', '2026-03-08', '10h00-11h30', 'SVT', 'Centre Bonapriso', 'planifié', 't3', 'Rebecca Ateba', 's4', 'Ibrahima Konaté', 'p4', 'Fatou Konaté');

INSERT INTO teacher_applications (
  full_name, email, phone, subjects, experience_years, availability, motivation, cv_url, status, reviewed_by, reviewer_role, review_notes, reviewed_at
) VALUES
(
  'Rebecca Ndzana',
  'rebecca.ndzana@example.com',
  '+237 699 112 233',
  JSON_ARRAY('Mathématiques', 'Physique'),
  6,
  'Soirs & week-end',
  'Ancienne enseignante de lycée passionnée par la pédagogie active. Je souhaite rejoindre Care4Success pour accompagner davantage de familles.',
  NULL,
  'pending',
  NULL,
  NULL,
  NULL,
  NULL
),
(
  'Pauline Tchoumi',
  'pauline.tchoumi@example.com',
  '+237 677 889 000',
  JSON_ARRAY('Français', 'Philosophie'),
  10,
  'Journée et samedi',
  'Formatrice en expression écrite avec une solide expérience en terminale. Je peux prendre en charge les élèves préparant le BAC.',
  'https://example.com/cv/pauline.pdf',
  'approved',
  'Directeur Ngono',
  'admin',
  'Très bon profil confirmé lors de l’entretien de mars.',
  NOW()
);

INSERT INTO teacher_feedback (
  teacher_id, teacher_name, reviewer_name, reviewer_type, rating, comment, session_id
) VALUES
('t1', 'Dr. Clémentine Abanda', 'Aminata Diallo', 'parent', 5, 'Progrès impressionnant de Koffi, très à l’écoute.', 's1'),
('t1', 'Dr. Clémentine Abanda', 'Paul Mbella', 'parent', 4, 'Bonne pédagogie, quelques retards à corriger.', 's3'),
('t2', 'Brice Owona', 'Marie Belinga', 'parent', 5, 'Sandra adore ses séances, excellent suivi.', 's2'),
('t3', 'Rebecca Ateba', 'Fatou Konaté', 'parent', 4, 'Sessions dynamiques, parfait pour l’oral.', 's4');

INSERT INTO parent_overviews (
  parent_id, parent_name, student_id, child_name, child_level, focus_subject,
  sessions_this_month, current_avg, previous_avg, total_paid_this_month
) VALUES
('p1', 'Aminata Diallo', 's1', 'Koffi Diallo', '3e', 'Mathématiques', 8, 14.5, 11.0, 144000);

INSERT INTO student_progress_points (
  parent_id, month_label, month_order, maths, francais, anglais
) VALUES
('p1', 'Oct', 1, 8.0, 11.0, 12.0),
('p1', 'Nov', 2, 9.0, 11.0, 13.0),
('p1', 'Déc', 3, 10.0, 12.0, 13.0),
('p1', 'Jan', 4, 12.0, 13.0, 14.0),
('p1', 'Fév', 5, 13.0, 13.0, 14.0),
('p1', 'Mar', 6, 14.5, 14.0, 15.0);

INSERT INTO parent_invoices (
  id, parent_id, invoice_date, description, amount, status
) VALUES
('inv1', 'p1', '2026-02-28', '4 séances Mathématiques (février S4)', 72000, 'paid'),
('inv2', 'p1', '2026-02-14', '4 séances Mathématiques (février S2)', 72000, 'paid'),
('inv3', 'p1', '2026-01-31', '8 séances Mathématiques (janvier)', 144000, 'paid'),
('inv4', 'p1', '2026-03-05', '4 séances Mathématiques (mars S1)', 72000, 'pending');

INSERT INTO courses (
  id, title, description, subject, level, status, cover_url, created_by
) VALUES
('course-math-1',
  'Parcours Maths : Fractions et Statistiques',
  'Programme interactif sur les fractions, la proportionnalité et les graphiques statistiques.',
  'Mathématiques',
  '3e',
  'published',
  'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=900&q=80',
  't1'
);

INSERT INTO course_lessons (
  id, course_id, title, content, video_url, order_index
) VALUES
('lesson-math-1', 'course-math-1', 'Comprendre les fractions', 'Décomposition des fractions et simplification pas à pas.', 'https://www.youtube.com/watch?v=3pQQ7DjXJ0Y', 1),
('lesson-math-2', 'course-math-1', 'Proportionnalité et ratios', 'Méthodologie pour résoudre des problèmes de proportion.', NULL, 2),
('lesson-math-3', 'course-math-1', 'Lire un graphique', 'Identifier médiane, moyenne et tendance sur un graphique.', NULL, 3);

INSERT INTO quizzes (
  id, course_id, lesson_id, title, instructions, total_points
) VALUES
('quiz-lesson-math-1', 'course-math-1', 'lesson-math-1', 'Quiz fractions', 'Répondez aux questions suivantes.', 6);

INSERT INTO quiz_questions (id, quiz_id, prompt, choices, correct_answer, points) VALUES
('quizq1', 'quiz-lesson-math-1', 'Quelle est la fraction équivalente à 2/4 ?', JSON_ARRAY(
    JSON_OBJECT('id','A','label','1/2'),
    JSON_OBJECT('id','B','label','2/2'),
    JSON_OBJECT('id','C','label','3/4')
), 'A', 2),
('quizq2', 'quiz-lesson-math-1', 'Combien font 3/5 + 1/5 ?', JSON_ARRAY(
    JSON_OBJECT('id','A','label','5/5'),
    JSON_OBJECT('id','B','label','4/5'),
    JSON_OBJECT('id','C','label','6/5')
), 'B', 2),
('quizq3', 'quiz-lesson-math-1', 'Simplifiez 9/12.', JSON_ARRAY(
    JSON_OBJECT('id','A','label','3/4'),
    JSON_OBJECT('id','B','label','1/4'),
    JSON_OBJECT('id','C','label','2/3')
), 'C', 2);

INSERT INTO course_enrollments (course_id, student_id, student_name, assigned_by) VALUES
('course-math-1', 's1', 'Koffi Diallo', 't1');

INSERT INTO quiz_attempts (
  quiz_id, student_id, student_name, answers, score
) VALUES
('quiz-lesson-math-1', 's1', 'Koffi Diallo', JSON_ARRAY(
    JSON_OBJECT('questionId','quizq1', 'answer','A'),
    JSON_OBJECT('questionId','quizq2', 'answer','B'),
    JSON_OBJECT('questionId','quizq3', 'answer','C')
), 6);

INSERT INTO platform_settings (id, data) VALUES
('platform', JSON_OBJECT(
  'hourlyRates', JSON_ARRAY(
    JSON_OBJECT('id','math','label','Mathématiques','baseRate',10000,'premiumRate',15000),
    JSON_OBJECT('id','physics','label','Physique-Chimie','baseRate',10000,'premiumRate',15000),
    JSON_OBJECT('id','french','label','Français / Philosophie','baseRate',8000,'premiumRate',12000),
    JSON_OBJECT('id','english','label','Anglais','baseRate',8000,'premiumRate',12000),
    JSON_OBJECT('id','svt','label','SVT / Sciences','baseRate',8000,'premiumRate',12000),
    JSON_OBJECT('id','it','label','Informatique','baseRate',12000,'premiumRate',18000)
  ),
  'centers', JSON_ARRAY(
    JSON_OBJECT('id','ctr-dla','name','Care4Success Douala Akwa','city','Douala','address','Rue Bonanjo, face Hôtel Ibis','active',true),
    JSON_OBJECT('id','ctr-yde','name','Care4Success Yaoundé Centre','city','Yaoundé','address','Av. Ahmadou Ahidjo, Bastos','active',true),
    JSON_OBJECT('id','ctr-online','name','Care4Success En ligne','city','Tous','address','Plateforme digitale','active',true)
  ),
  'notifications', JSON_ARRAY(
    JSON_OBJECT('key','course_reminder','label','Rappel de cours (SMS, 2h avant)','enabled',true),
    JSON_OBJECT('key','registration','label','Confirmation d\'inscription','enabled',true),
    JSON_OBJECT('key','invoice','label','Facture générée automatiquement en fin de mois','enabled',true),
    JSON_OBJECT('key','lead','label','Nouvelle demande de bilan reçue','enabled',true),
    JSON_OBJECT('key','weekly_report','label','Rapport hebdomadaire admin','enabled',false)
  ),
  'security', JSON_OBJECT(
    'sessionTimeout','1h',
    'passwordPolicy','strong',
    'enforce2FA',true
  )
));

