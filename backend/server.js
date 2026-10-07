// Local development entry point. The Express app itself lives in app.js so the
// Vercel serverless function (api/index.js) can import it without binding a port.
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('House Matters API server running on port ' + PORT);
  console.log('Health check: http://localhost:' + PORT + '/health');
  const { testConnection } = require('./config/database');
  testConnection();
});

process.on('SIGTERM', async () => { const { closePool } = require('./config/database'); await closePool(); process.exit(0); });
process.on('SIGINT', async () => { const { closePool } = require('./config/database'); await closePool(); process.exit(0); });

module.exports = app;