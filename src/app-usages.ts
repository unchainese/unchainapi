import { Hono } from 'hono';
import { Usage } from './types';
import { mwAuthFn } from './mw-auth';


export const apiUsages = new Hono<{ Bindings: Env }>().use(mwAuthFn(true));


apiUsages.get('/', async (c) => {
	const uid = c.req.query('uid');
	const db = c.env.DB;

	if (uid) {
		const { results } = await db.prepare("SELECT * FROM usages WHERE uid = ? ORDER BY created_date DESC").bind(uid).all<Usage>();
		return c.json({ data: results, code: 200 });
	}


	const offset = parseInt(c.req.query('offset') || '0');
	const limit = parseInt(c.req.query('limit') || '10');
	const nowDate = new Date().toISOString().slice(0, 10);
	const qq = `SELECT * FROM usages WHERE created_date <= ? ORDER BY created_date DESC LIMIT ? OFFSET ?`;
	const { results } = await db.prepare(qq).bind(nowDate, limit, offset).all<Usage>();
	return c.json({ data: results, code: 200 });
});
