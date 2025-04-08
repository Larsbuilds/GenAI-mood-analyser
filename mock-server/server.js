import express from 'express';
import cors from 'cors';

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// In-memory storage
const entries = [];
const notes = [];

// Diary entries endpoints
app.get('/entries', (req, res) => {
  res.json(entries);
});

app.post('/entries', (req, res) => {
  const entry = {
    _id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  entries.push(entry);
  res.status(201).json(entry);
});

app.put('/entries/:id', (req, res) => {
  const index = entries.findIndex(e => e._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  entries[index] = { ...entries[index], ...req.body };
  res.json(entries[index]);
});

// School notes endpoints
app.get('/notes', (req, res) => {
  res.json(notes);
});

app.post('/notes', (req, res) => {
  const note = {
    _id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  notes.push(note);
  res.status(201).json(note);
});

app.put('/notes/:id', (req, res) => {
  const index = notes.findIndex(n => n._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Note not found' });
  }
  notes[index] = { ...notes[index], ...req.body };
  res.json(notes[index]);
});

app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
}); 