import { Node, User } from './types';
import { Hono } from 'hono';
import { mwAuthFn } from './mw-auth';
import { genVLESS, removeDuplicates } from './utils';
import bcrypt from 'bcryptjs';


export const apiUser = new Hono<{ Bindings: Env, Variables: Variables }>().use(mwAuthFn(false));


apiUser.get('/', async (c) => {
	const email = c.var.email || '';
	const db = c.env.DB;
	const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
	if (!user) {
		return c.json({ code: 404, msg: 'User not found' });
	}
	user.password = ''; // Don't return password in response
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
	return c.json({ code: 200, data: user });
});


interface ReqChangePassword {
	password: string,
	passwordNew: string,
}

apiUser.post('/change-password', async (c) => {
	const email = c.var.email || '';
	const db = c.env.DB;
	const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
	if (!user) {
		return c.json({ code: 404, msg: 'User not found' });
	}
	const args = await c.req.json<ReqChangePassword>();
	if (user.password) {
		//check old password
		const isMatch = await bcrypt.compare(args.password, user.password);
		if (!isMatch) {
			return c.json({ code: 401, msg: '旧密码错误' });
		}
	}
	const hashedPassword = await bcrypt.hash(args.passwordNew, 10);
	const result = await db.prepare('UPDATE users SET password = ? WHERE email = ?').bind(hashedPassword, email).run();
	if (!result.success) {
		return c.json({ code: 500, msg: 'DB更新密码失败' });
	}
	return c.json({ code: 200, msg: '密码修改成功' });
});


apiUser.post('/ticket', async (c) => {
	const email = c.var.email || '';
	const db = c.env.DB;
	const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
	if (!user) {
		return c.json({ code: 404, msg: 'User not found' });
	}
	const args = await c.req.json<{ title: string, content: string }>();

	if (!args.title || !args.content) {
		return c.json({ code: 400, msg: '标题和内容不能为空' });
	}

	const result = await db.prepare('INSERT INTO tickets (email, title, content) VALUES (?, ?, ?)')
		.bind(email, args.title, args.content).run();
	if (!result.success) {
		return c.json({ code: 500, msg: '数据库写入工单失败' });
	}
	return c.json({ code: 200, msg: '工单创建成功' });
});
