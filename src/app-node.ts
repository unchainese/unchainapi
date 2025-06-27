import { Hono } from 'hono';
import { User } from './types';


export const apiNode = new Hono<{ Bindings: Env }>();


interface AppStat {
	traffic: { [key: string]: number };//uuid -> KB number
	hostname: string;
	goroutine: number;
	version_info: string,
}



apiNode.post('/', async (c) => {
	const body = await c.req.json<AppStat>();
	const db = c.env.DB;
	const nowTs = Math.floor(Date.now() / 1000);
	const clientIP = c.req.header('cf-connecting-ip') || '';
	await db.prepare('DELETE FROM nodes WHERE ip = ?').bind(clientIP).run();
	const qq = 'INSERT INTO nodes (hostname, ip, active_ts, goroutine, version_info) VALUES (?, ?, ?, ?, ?)';
	await db.prepare(qq).bind(body.hostname, clientIP, nowTs, body.goroutine, body.version_info).run();

	const qqq = 'SELECT * FROM users WHERE expire_ts > ? AND available_kb > ?';
	const { results } = await db.prepare(qqq).bind(nowTs, 0).all<User>();

	const allowUsers: { [key: string]: number } = {};
	const stmtList: D1PreparedStatement[] = [];
	const nowDate = new Date().toISOString().slice(0, 10);
	for (const u of results) {
		const id = u.id;
		let usedKB = body.traffic[id] || 0;
		if (usedKB < 0) {
			usedKB = 0;
		}
		u.available_kb = u.available_kb - usedKB;
		if (u.available_kb < 0) {
			u.available_kb = 0;
		} else {
			allowUsers[id] = u.available_kb;
		}
		if (usedKB < 1) continue;
		// console.log("set uid",id,u.available_kb)
		const userKbUpdate = db.prepare('UPDATE users SET available_kb = ? WHERE id = ?').bind(u.available_kb, id);
		const stmtUsageInsert = db.prepare('INSERT INTO usages (uid,kb,created_date,category) VALUES (?,?,?,?)').bind(id, usedKB, nowDate, 'raw');

		stmtList.push(userKbUpdate);
		stmtList.push(stmtUsageInsert);
	}
	if (stmtList.length > 0) {
		await db.batch(stmtList);
	}
	return c.json(allowUsers);
});
