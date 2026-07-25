const fs = require('fs');
const content = fs.readFileSync('src/pages/ChildDashboardModal.jsx', 'utf8');

const RATING_FULL = ["Can't do", "1", "2", "3", "Does Independently"];
const RATING_NO_INDEPENDENT = ["Can't do", "1", "2", "3"];

const match = content.match(/const SECTIONS = (\[[\s\S]*?\]);\n\n/);
if (match) {
  let code = match[1];
  const getSections = new Function('RATING_FULL', 'RATING_NO_INDEPENDENT', 'return ' + code);
  const sections = getSections(RATING_FULL, RATING_NO_INDEPENDENT);
  
  let md = '# Assessment Question to Activity Mapping\n\n';
  md += 'As mentioned, this mapping is hardcoded in the frontend codebase (`src/pages/ChildDashboardModal.jsx`) rather than in the database. Below is the complete mapping of every assessment question to its 3 targeted activities:\n\n';
  
  sections.forEach(sec => {
    md += `## ${sec.title}\n\n`;
    sec.items.forEach(item => {
      md += `**${item.id}: ${item.text}**\n`;
      item.activities.forEach((act, idx) => {
        md += `- **Activity ${idx + 1}:** ${act}\n`;
      });
      md += '\n';
    });
  });
  
  fs.writeFileSync('/Users/murtuzaali/.gemini/antigravity-ide/brain/cfa08aee-f763-45be-8086-ca226e86810d/activity_mapping.md', md);
  console.log('Successfully generated activity_mapping.md');
} else {
  console.log('Could not find SECTIONS');
}
