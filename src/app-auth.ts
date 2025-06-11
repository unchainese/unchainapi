import { Hono } from 'hono';
import { User } from './types';
import bcrypt from 'bcryptjs';
import { authCookieSet } from './utils';
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
		return c.json({ code: 401, msg: '用户没有设置密码,请使用GoogleOauth2登录' });
	}
	const isMatch = await bcrypt.compare(args.password, user.password);
	if (!isMatch) {
		return c.json({ code: 401, msg: '密码错误' });
	}
	await authCookieSet(c,user.email)
	return c.json({ code: 200, data: { id: user.id, email: user.email, available_kb: user.available_kb, expire_ts: user.expire_ts } });

});


apiAuth.post('/register', async (c) => {
	const args = await c.req.json<ReqRegister>();
	try {
		const user = await bizUserCreate(c.env, args.email, args.password);
		return c.json({ msg: '用户注册成功', code: 200 });
	}catch (error) {
		return c.json({ msg: '用户注册失败: ' + error, code: 500 });
	}
});

apiAuth.post('/reset', async (c) => {
	const body = await c.req.json<ReqLogin>();
	const db = c.env.DB;

	//todo send the email to reset password
	return c.json({ msg: 'Reset password email sent' });
});


apiAuth.get('/reset-verify', async (c) => {
	//todo send the email to reset password
	return c.json({ msg: '密码重置邮件已经发送,请登录你的邮箱完成密码重置' });
});

apiAuth.get('/logout', async (c) => {
	c.header('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'); // Clear the cookie
	return c.json({ msg: '已登出', code: 200 });
});

