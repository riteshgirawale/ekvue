const fs = require('fs');
const content = fs.readFileSync('c:/Users/DELL/Downloads/Create_a_Website/ekvue/dashboards/company/company.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('salaryMin') || line.includes('salaryMax') || line.includes('pj-salary')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
