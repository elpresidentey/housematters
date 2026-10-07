// Vercel serverless entry point. Vercel serves this file at /api and the
// rewrite in vercel.json sends every other path here, so Express routes the
// whole surface from one function.
//
// maxDuration cannot go in vercel.json alongside `functions`, and the Hobby
// default of 10s is tight for queries against a pooled Postgres connection.
const app = require('../app');

module.exports = app;
module.exports.config = { maxDuration: 30 };