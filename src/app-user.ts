import { Node, User } from './types';
import { Hono } from 'hono';
import { mwAuth } from './mw-auth';
import { genVLESS, removeDuplicates } from './utils';


export const apiUser = new Hono<{ Bindings: Env, Variables: Variables }>().use(mwAuth);


apiUser.get('/', async (c) => {
	const email = c.var.email || '';
	const db = c.env.DB;
	const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
	if (!user) {
		return c.json({ code: 404, msg: 'User not found' });
	}
	user.password=''; // Don't return password in response
	const nowTs = Math.floor(Date.now() / 1000) - 3600 * 24;
	const qq = 'SELECT DISTINCT ip FROM nodes WHERE active_ts > ? LIMIT 100';
	const { results } = await db.prepare(qq).bind(nowTs).all<Node>();
	const ips = results.map((r) => {
		return r.ip.trim();
	}).flat().map((addr) => addr.trim());

	const subUrls = removeDuplicates(ips).map((ip) => {
		return genVLESS(user.id, ip + ':80', 'ip', false);
	});
	user.sub_txt = subUrls.join('\n');
	return c.json({ code:200,data: user });
});
