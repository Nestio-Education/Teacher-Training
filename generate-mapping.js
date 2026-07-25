const fs = require('fs');
const content = fs.readFileSync('src/pages/ChildDashboardModal.jsx', 'utf8');

// We need to extract the SECTIONS array.
// It starts with 'const SECTIONS = [' and ends before 'function scoreOf' or similar.
const match = content.match(/const SECTIONS = (\[[\s\S]*?\]);\n\n/);
if (match) {
  let code = match[1];
  // evaluate it safely to JSON.
  // since it's a JS object, we can use Function
  const getSections = new Function('return ' + code);
  const sections = getSections();
  
  let md = '# Assessment Question to Activity Mapping\n\n';
  md += 'This mapping is hardcoded in the frontend (`src/pages/ChildDashboardModal.jsx`) and is not stored in the database.\n\n';
  
  sections.forEach(sec => {
    md += `## ${sec.title}\n\n`;
    sec.items.forEach(item => {
      md += `**${item.id}: ${item.text}**\n`;
      item.activities.forEach((act, idx) => {
        md += `- Activity ${idx + 1}: ${act}\n`;
      });
      md += '\n';
    });
  });
  
  fs.writeFileSync('activity_mapping.md', md);
  console.log('Successfully generated activity_mapping.md');
} else {
  console.log('Could not find SECTIONS');
}
