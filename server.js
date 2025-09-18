const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

const DATA_FILE = './countryStats.json';

// Initialize file if not exists
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}');

app.get('/stats', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(data);
});

app.post('/stats', (req, res) => {
  const { country } = req.body;
  if (!country) return res.status(400).send('Country required');

  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  data[country] = (data[country] || 0) + 1;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
  res.json(data);
});

app.listen(3000, () => console.log('Server running on port 3000'));