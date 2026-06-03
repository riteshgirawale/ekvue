const fs = require('fs');
let content = fs.readFileSync('c:\\Users\\DELL\\Downloads\\Create_a_Website\\ekvue\\api\\server.js', 'utf8');

const proxyCode = `
// --- OPENAI PROXY ---
app.post('/api/generate-challenge', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is missing on the server' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
`;

if (!content.includes('/api/generate-challenge')) {
  content = content.replace('const PORT = 3000;', proxyCode + '\nconst PORT = 3000;');
  fs.writeFileSync('c:\\Users\\DELL\\Downloads\\Create_a_Website\\ekvue\\api\\server.js', content, 'utf8');
  console.log('Added proxy to server.js');
}
