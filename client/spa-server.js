const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the React app build directory
const staticDir = path.join(__dirname, 'dist');
app.use(express.static(staticDir));

// Handle SPA routing - send all requests to index.html
// except for actual files (js, css, images, etc)
app.get('*', (req, res) => {
  // Don't rewrite requests for actual files with extensions
  if (path.extname(req.path)) {
    res.status(404).send('Not found');
    return;
  }
  
  // Send index.html for all other routes (SPA routing)
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`SPA Server running on port ${PORT}`);
  console.log(`Serving React app from: ${staticDir}`);
});
