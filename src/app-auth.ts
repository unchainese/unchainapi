import { Hono } from 'hono';
import { User } from './types';
import bcrypt from 'bcryptjs';
import {  jwtCreate } from './utils';
import { bizUserCreate } from './biz';

export const apiAuth = new Hono<{ Bindings: Env }>();

interface ReqLogin {
	email: string,
	password: string,
}

interface ReqRegister {
	email: string,
	password: string,
}


apiAuth.post('/login', async (c) => {
	const args = await c.req.json<ReqLogin>();
	const db = c.env.DB;
	const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(args.email).first<User>();
	if (!user) {
		return c.json({ code: 401, msg: '无效用户' });
	}
	if (!user.password) {
		return c.json({ code: 401, msg: '用户没有设置密码,请使用Google-Oauth2登录' });
	}
	const isMatch = await bcrypt.compare(args.password, user.password);
	if (!isMatch) {
		return c.json({ code: 401, msg: '密码错误' });
	}
	const token = await jwtCreate(user.email, c.env.APP_SECRET);
	return c.json({ code: 200, data: { token, id: user.id, email: user.email, available_kb: user.available_kb, expire_ts: user.expire_ts } });
});


apiAuth.post('/register', async (c) => {
	const args = await c.req.json<ReqRegister>();
	try {
		const user = await bizUserCreate(c.env, args.email, args.password,10,'inactive');
		if (user.isExistInDB) {
			return c.json({ msg: '用户已存在', code: 409 });
		}
		return c.json({ msg: '用户注册成功', code: 200 });
	} catch (error) {
		return c.json({ msg: '用户注册失败: ' + error, code: 500 });
	}
});

