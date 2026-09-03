import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/admin/AdminLayout.tsx',
  'src/pages/advisor/AdvisorLayout.tsx',
  'src/pages/parent/ParentLayout.tsx',
  'src/pages/student/StudentLayout.tsx',
  'src/pages/teacher/TeacherLayout.tsx',
  'src/pages/tutor/TutorLayout.tsx'
];

files.forEach(f => {
  const filePath = path.join(process.cwd(), f);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(
      'className="flex-1 ml-72 min-h-screen overflow-y-auto"', 
      'className="flex-1 md:ml-72 ml-0 min-h-screen pt-16 md:pt-0 overflow-y-auto w-full"'
    );
    // Just in case it has flex instead of w-full, but flex-1 already handles it.
    // Also change <div className="min-h-screen bg-gray-50 flex"
    content = content.replace(
      'className="min-h-screen bg-gray-50 flex"',
      'className="min-h-screen bg-gray-50 flex flex-col md:flex-row"'
    );
    fs.writeFileSync(filePath, content);
  }
});
console.log('Layouts updated successfully.');
