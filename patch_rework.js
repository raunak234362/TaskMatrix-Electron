const fs = require('fs');
const path = './src/renderer/src/components/project/MeasDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    'const hasRework = (t.workingHourTask || []).some(w => String(w.type).toUpperCase() === \'REWORK\');',
    'const hasRework = String(t.status).toUpperCase() === "REWORK" || (t.workingHourTask || []).some(w => String(w.type).toUpperCase() === "REWORK");'
);

fs.writeFileSync(path, content);
