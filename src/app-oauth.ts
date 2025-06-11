import { Hono } from 'hono';
import { User } from './types';
import { authCookieSet } from './utils';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = 'openid email';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';


export const apiOAuth = new Hono<{ Bindings: Env }>();


apiOAuth.get('/google', async (c) => {
	const params = new URLSearchParams({
		client_id: c.env.GOOGLE_CLIENT_ID,
		redirect_uri: c.env.REDIRECT_URI,//https://unchainadmin.pages.dev/api/oauth/google-cb
		response_type: 'code',
		scope: SCOPES,
		access_type: 'offline',
		prompt: 'consent'
	});

	c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});


apiOAuth.get('/google-cb', async (c) => {
	const code = c.req.query('code') || '';
	const tokenResponse = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: c.env.GOOGLE_CLIENT_ID,
			client_secret: c.env.GOOGLE_CLIENT_SECRET,
			redirect_uri: c.env.REDIRECT_URI,
			grant_type: 'authorization_code'
		})
	});

	const tokens = await tokenResponse.json<{ access_token: string }>();
	const userInfoResponse = await fetch(USERINFO_URL, {
		headers: { Authorization: `Bearer ${tokens.access_token}` }
	});

	const userInfo: {
		email: string,
		email_verified: true,
		picture: string,
		sub: string
	} = await userInfoResponse.json();
	const userEmail = userInfo.email || '';
	if (!userEmail) {
		console.error('email not found');
		console.error(userInfo);
		return new Response('email not found', { status: 400 });//todo:: fix this
	}
	let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(userEmail).first<User>();
	if (!user) {
		user = {
			id: crypto.randomUUID(),
			email: userEmail,
			available_kb: 1024 * 1024 * 5,
			expire_ts: Math.floor(Date.now() / 1000) + 3600 * 24 * 90,
			active_ts: Math.floor(Date.now() / 1000)
		} as User;
		const q = 'INSERT INTO users (id,email, available_kb, expire_ts, active_ts) VALUES (?, ?, ?, ?, ?)';
		await c.env.DB.prepare(q).bind(user.id, user.email, user.available_kb, user.expire_ts, user.active_ts).run();
	}
	//write cookie
	const redirectUrl = `https://${c.req.header('host')}/`;

	await authCookieSet(c, user.email);

	return c.redirect(redirectUrl, 302);
});
