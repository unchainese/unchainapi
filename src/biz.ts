import { User } from './types';
import bcrypt from 'bcryptjs';


export async function bizUserCreate(env: Env, email: string, password: string, gb: number = 10) {
	if (password && password.length < 8) {
		throw new Error('密码长度不能小于8位');
	}
	const db = env.DB;
	const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
	if (user) {
		throw new Error('Email已经被占用,请使用其他Email注册');
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	// Create new user in the database
	const newUser: User = {
		id: crypto.randomUUID(),
		email: email,
		password: hashedPassword,
		available_kb: 1 << 20 * gb, // 5 MB
		expire_ts: 0,
		active_ts: 0,
		role: 'user',
		sub_txt: ''
	};
	const q = `INSERT INTO users (id, email, password, status,available_kb) VALUES (?, ?, ?, ?,?)`;
	const result = await db.prepare(q).bind(newUser.id, newUser.email, newUser.password, 'inactive',newUser.available_kb).run();
	if (result.success) {
		return newUser;
	} else {
		throw new Error('数据库写入用户失败');
	}
}
