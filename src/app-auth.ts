import { Hono } from "hono";
import {  User } from "./types";
import  bcrypt from "bcryptjs";
import { sign} from 'hono/jwt'



export const apiAuth = new Hono<{ Bindings: Env }>()



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
	const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(args.email).first<User>()
	if (!user) {
		return new Response("User not found", { status: 401 })
	}
	if (!user.password) {
		return new Response("User has no password set", { status: 401 })
	}
	const isMatch = await bcrypt.compare(args.password, user.password);
	if (!isMatch) {
		return new Response("Invalid password", { status: 401 })
	}
	const maxAge = 3600 * 24 * 30; // 30 days
	const payload = { id: user.id, email: user.email,exp: Math.floor(Date.now() / 1000) + maxAge };
	const token = await sign(payload, c.env.APP_SECRET);
	//set cookie
	c.header('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`); // 30 days
	return c.json({ token, user: { id: user.id, email: user.email, available_kb: user.available_kb, expire_ts: user.expire_ts } });

})


apiAuth.post('/register', async (c) => {
	const args = await c.req.json<ReqRegister>();
	const db = c.env.DB;
	const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(args.email).first<User>()
	if (user) {
		return new Response("User already exists", { status: 409 });
	}
	if(args.password && args.password.length < 8) {
		return new Response("Password must be at least 8 characters long", { status: 400 });
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
	const q = `INSERT INTO users (id, email, password,status) VALUES (?, ?, ?, ?)`;
	const result = await db.prepare(q).bind(newUser.id, newUser.email, newUser.password, 'inactive').run();
	if (result.success) {
		return new Response("Register is done", { status: 200 });
	} else {
		return new Response("Failed to create user", { status: 500 });
	}
})

apiAuth.post('/reset', async (c) => {
	const body = await c.req.json<ReqLogin>();
	const db = c.env.DB;

	//todo send the email to reset password
	return c.json({ msg: "Reset password email sent" });
})


apiAuth.get('/reset-verify', async (c) => {
	//todo send the email to reset password
	return c.json({ msg: "Reset password email sent" });
})
