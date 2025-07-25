import { User } from './types';
import bcrypt from 'bcryptjs';


export async function bizUserCreate(env: Env, email: string, password: string, gb: number = 10, status = 'inactive'): Promise<User> {


	const db = env.DB;
	const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
	if (user) {
		user.isExistInDB = true; // Mark user as existing in the database
		return user;
	}
	//oauth2 注册的用户 不设置密码,密码为空
	let hashedPassword = '';
	if (password) {
		hashedPassword = await bcrypt.hash(password, 10);
	}
	// Create new user in the database
	const newUser: User = {
		id: crypto.randomUUID(),
		email: email,
		password: hashedPassword,
		available_kb: gb << 20, // 5 MB
		expire_ts: Math.floor(Date.now() / 1000) + 3600 * 24 * 30 * 12 * 2,// 2 years
		active_ts: Math.floor(Date.now() / 1000),
		status: status,
		sub_txt: ''//ignore this field,not in database
	};
	const query = `INSERT INTO users (id, email, password, available_kb, expire_ts, active_ts, status)
								 VALUES (?, ?, ?, ?, ?, ?, ?)`;
	const result = await db.prepare(query)
		.bind(newUser.id, newUser.email, newUser.password, newUser.available_kb, newUser.expire_ts, newUser.active_ts, newUser.status)
		.run();

	if (result.success) {
		return newUser;
	} else {
		throw new Error('数据库写入用户失败');
	}
}
