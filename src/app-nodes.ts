import { Hono } from 'hono';
import { Node } from './types';
import { mwAuthFn } from './mw-auth';


export const apiNodes = new Hono<{ Bindings: Env }>().use(mwAuthFn(true));





apiNodes.get('/', async (c) => {
	const offset = parseInt(c.req.query('offset') || '0');
	const limit = parseInt(c.req.query('limit') || '10');
	const db = c.env.DB;
	const nowTs = Math.floor(Date.now() / 1000) - 3600 * 24;
	const qq = `SELECT * FROM nodes WHERE active_ts > ?	 ORDER BY active_ts DESC LIMIT ? OFFSET ?`;
	const { results } = await db.prepare(qq).bind(nowTs, limit, offset).all<Node>();
	return c.json({ data: results, code: 200 });
});





apiNodes.delete('/', async (c) => {
	const body = await c.req.json<Node>();
	const db = c.env.DB;
	const q = 'DELETE FROM nodes WHERE ip = ? AND hostname = ?';
	await db.prepare(q).bind(body.ip, body.hostname).run();
	return c.json({ data: body, code: 200 });
});
