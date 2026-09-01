import fs from 'fs';
import path from 'path';

const folders = [
  'src/pages/admin',
  'src/pages/teacher',
  'src/pages/parent',
  'src/pages/student',
  'src/pages/advisor',
  'src/pages/common'
];

folders.forEach(folder => {
  const dirPath = path.join(process.cwd(), folder);
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx'));
  
  files.forEach(f => {
    const filePath = path.join(dirPath, f);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace p-8 with responsive p-4 md:p-8
    content = content.replace(/\bp-8\b/g, 'p-4 md:p-8');
    
    // Replace p-6 with responsive p-4 md:p-6 (some pages use p-6)
    content = content.replace(/\bp-6\b/g, 'p-4 md:p-6');
    
    // Replace grid-cols-2 to grid-cols-1 sm:grid-cols-2 where appropriate
    // But only if it doesn't already have sm: or md:
    content = content.replace(/\bgrid-cols-2\b(?![^"]*sm:)(?![^"]*md:)/g, 'grid-cols-1 sm:grid-cols-2');
    
    fs.writeFileSync(filePath, content);
  });
});

console.log('Responsive utility classes updated across all pages.');
