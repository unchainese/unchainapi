import { Node, User } from './types';
import { Hono } from 'hono';
import { mwAuthFn } from './mw-auth';
import { genVLESS, removeDuplicates } from './utils';


export const apiUsers = new Hono<{ Bindings: Env }>().use(mwAuthFn(true));


apiUsers.get('/:id', async (c) => {
	const id = c.req.param('id');
	const db = c.env.DB;
	const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
	if (!user) {
		return new Response('User not found', { status: 404 });
	}
	const nowTs = Math.floor(Date.now() / 1000) - 3600 * 24;
	const qq = 'SELECT DISTINCT ip FROM nodes WHERE active_ts > ? LIMIT 100';
	const { results } = await db.prepare(qq).bind(nowTs).all<Node>();
	const ips = results.map((r) => {
		return r.ip.trim();
	}).flat().map((addr) => addr.trim());
	const domain = c.env.APP_DOMAIN || 'jp.aliyun.com';
	const subUrls = removeDuplicates(ips).map((ip) => {
		return genVLESS(id, ip + ':80', domain, false);
	});
	user.sub_txt = subUrls.join('\n');
	return c.json(user);
});

apiUsers.get('/', async (c) => {
	const limit = parseInt(c.req.query('size') || '120');
	const offset = (parseInt(c.req.query('page') || '1') - 1) * limit;
	const email = c.req.query('email') || '';
	const db = c.env.DB;
	const q = `SELECT * FROM users LIMIT ?1 OFFSET ?2`;
	const { results } = await db.prepare(q).bind(limit, offset).all<User>();
	return c.json({ data: results, code: 200 });
});

apiUsers.post('/', async (c) => {
	const body = await c.req.json<User>();
	body.id = crypto.randomUUID();
	body.active_ts = Math.floor(Date.now() / 1000);
	if (body.expire_ts < 3600) {
		body.expire_ts = Math.floor(Date.now() / 1000) + 3600 * 24 * 30;
	}
	const db = c.env.DB;
	// language=SQL format=false
	const q = `INSERT INTO users (id,email,available_kb,expire_ts,active_ts) VALUES (?,?,?,?,?)`;
	await db.prepare(q).bind(body.id, body.email, body.available_kb, body.expire_ts, body.active_ts).run();
	return c.json({ data: body, code: 200 });
});


apiUsers.patch('/', async (c) => {
	const body = await c.req.json<User>();
	body.active_ts = Math.floor(Date.now() / 1000);
	if (body.expire_ts < 3600) {
		body.expire_ts = Math.floor(Date.now() / 1000) + 3600 * 24 * 30;
	}
	const db = c.env.DB;

	// language=SQL format=false
	const q = `UPDATE users SET email=?,available_kb=?,expire_ts=? WHERE id=?`;
	await db.prepare(q).bind(body.email, body.available_kb, body.expire_ts, body.id).run();
	return c.json({ data: body, code: 200 });
});


apiUsers.delete('/', async (c) => {
	const body = await c.req.json<User>();
	const db = c.env.DB;

	// language=SQL format=false
	const q = `DELETE FROM users WHERE id=?`;
	await db.prepare(q).bind(body.id).run();
	return c.json(body);
});





