-- Correction urgente : Insérer MANJIA ETHAN dans student_teacher
-- (table n'a que student_id et teacher_id, pas de created_at)
INSERT IGNORE INTO student_teacher (student_id, teacher_id)
VALUES (
  '88130c0e-d35e-496b-b50d-691e5d507af8',
  '67f50c41-c3ab-4ad3-868e-1051f07c26ce'
);

-- Vérification finale : les 2 élèves doivent maintenant apparaitre
SELECT st.student_id, st.teacher_id, u_s.name as student_name, u_t.name as teacher_name
FROM student_teacher st
JOIN users u_s ON u_s.id = st.student_id
JOIN users u_t ON u_t.id = st.teacher_id
WHERE st.teacher_id = '67f50c41-c3ab-4ad3-868e-1051f07c26ce';
