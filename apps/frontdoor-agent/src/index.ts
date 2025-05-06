import express from 'express';

const app = express();

// Add JSON parsing middleware
app.use(express.json());

console.log('Frontdoor agent is running');

app.post('/ask', (req, res) => {
  const { prompt } = req.body;
  console.log(prompt);
  res.send('Hello World');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
