import { Hono } from 'hono';
import { Ticket } from './types';
import { mwAuthFn } from './mw-auth';


export const apiTickets = new Hono<{ Bindings: Env }>().use(mwAuthFn(true));


apiTickets.get('/', async (c) => {
	const offset = parseInt(c.req.query('offset') || '0');
	const limit = parseInt(c.req.query('limit') || '10');
	const db = c.env.DB;
	const nowTs = Math.floor(Date.now() / 1000) - 3600 * 24*30;
	const qq = "SELECT * FROM tickets WHERE created_ts > ? ORDER BY updated_ts DESC LIMIT ? OFFSET ?";
	const { results } = await db.prepare(qq).bind(nowTs, limit, offset).all<Ticket>();
	return c.json({ data: results, code: 200 });
});

apiTickets.patch('/', async (c) => {
	const args = await c.req.json<Ticket>();
	const nowTs = Math.floor(Date.now() / 1000);
	const db = c.env.DB;
	const q = "UPDATE tickets SET feedback =?,updated_ts = ? WHERE id = ?";
	const result = await db.prepare(q).bind(args.feedback, nowTs, args.id).run();
	if (!result.success) {
		return c.json({ code: 500, msg: 'DB更新失败' });
		}
	return c.json({ code: 200, msg: '更新成功' });
});
