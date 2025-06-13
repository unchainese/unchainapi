import { Hono } from 'hono';
import { Ticket } from './types';
import { mwAuthFn } from './mw-auth';


export const apiTickets = new Hono<{ Bindings: Env }>().use(mwAuthFn(true));


apiTickets.get('/', async (c) => {
	const offset = parseInt(c.req.query('offset') || '0');
	const limit = parseInt(c.req.query('limit') || '10');
	const db = c.env.DB;
	const nowTs = Math.floor(Date.now() / 1000) - 3600 * 24*30;
	const qq = `SELECT * FROM tickets WHERE created_ts > ? ORDER BY active_ts DESC LIMIT ? OFFSET ?`;
	const { results } = await db.prepare(qq).bind(nowTs, limit, offset).all<Ticket>();
	return c.json({ data: results, code: 200 });
});
