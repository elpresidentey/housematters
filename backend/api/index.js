// Vercel serverless entry point. Vercel routes every request for this project
// here, and Express handles the paths from there.
const app = require('../app');

// maxDuration cannot live in vercel.json while `builds` is in use, and the
// Hobby default of 10s is tight for queries against a pooled Postgres.
module.exports = app;
module.exports.config = { maxDuration: 30 };