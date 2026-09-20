const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const session = require('express-session');

process.env.NODE_ENV = 'test';
process.env.APP_ORIGINS = 'http://localhost:5173';
const { requireTrustedOrigin, sessionStore } = require('../src/config/session');
sessionStore.stopExpiringSessions();

test('session cookie and origin protection', async context => {
  const app = express();
  app.use(requireTrustedOrigin);
  app.use(session({
    name: 'booknest.sid', secret: 'a-test-only-secret-with-at-least-32-characters',
    resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 10000 }
  }));
  app.post('/login', (req, res) => { req.session.userID = 'test'; res.sendStatus(204); });
  app.get('/private', (req, res) => res.sendStatus(req.session.userID ? 200 : 401));
  const { logout } = require('../src/controllers/authController');
  app.post('/logout', logout);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  context.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  for (const origin of [undefined, 'https://untrusted.example']) {
    const res = await fetch(`${base}/login`, { method: 'POST', headers: origin ? { Origin: origin } : {} });
    assert.equal(res.status, 403);
  }
  const login = await fetch(`${base}/login`, { method: 'POST', headers: { Origin: 'http://localhost:5173' } });
  assert.equal(login.status, 204);
  const cookieHeader = login.headers.get('set-cookie');
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /SameSite=Lax/);
  const cookie = cookieHeader.split(';')[0];
  assert.equal((await fetch(`${base}/private`, { headers: { Cookie: cookie } })).status, 200);
  assert.equal((await fetch(`${base}/logout`, { method: 'POST', headers: { Cookie: cookie, Origin: 'http://localhost:5173' } })).status, 204);
  assert.equal((await fetch(`${base}/private`, { headers: { Cookie: cookie } })).status, 401);
});