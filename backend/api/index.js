// Vercel serverless entry point. Vercel serves this file at /api and the
// rewrite in vercel.json sends every other path here, so Express routes the
// whole surface from one function.
const app = require('../app');

module.exports = app;