import { Hono } from 'hono';
import { User } from './types';
import bcrypt from 'bcryptjs';
import { authCookieSet } from './utils';

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
	const db = c.env.DB;
	const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(args.email).first<User>();
	if (user) {
		return c.json({ msg: 'Email已经被占用,请到登录页面找回密码', code: 409 });
	}
	if (args.password && args.password.length < 8) {
		return c.json({ msg: '密码长度必须超过8字符', code: 400 });
	}
	const hashedPassword = await bcrypt.hash(args.password, 10);
	// Create new user in the database
	const newUser: User = {
		id: crypto.randomUUID(),
		email: args.email,
		password: hashedPassword,
		available_kb: 0, // 5 MB
		expire_ts: 0,
		active_ts: 0,
		role: 'user',
		sub_txt: ''
	};
	const q = `INSERT INTO users (id, email, password, status)
						 VALUES (?, ?, ?, ?)`;
	const result = await db.prepare(q).bind(newUser.id, newUser.email, newUser.password, 'inactive').run();
	if (result.success) {
		return c.json({ msg: '用户注册成功', code: 200 });
	} else {
		return c.json({ msg: '用户注册失败', code: 500 });
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

