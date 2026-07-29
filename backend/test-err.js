const fs = require('fs');
const content = fs.readFileSync('src/server.js', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('app.post("/api/teacher/children/:id/assessments"'));
console.log(lines.slice(start, start + 50).join('\n'));
