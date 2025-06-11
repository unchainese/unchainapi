import { ExecutionContext, ForwardableEmailMessage } from '@cloudflare/workers-types';
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';
import { User } from './types';

// npm install mimetext

export async function mailRouteHandler(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
	const to = message.to || '';
	if (to.startsWith('ai@')) {
		await mailAi(message, env);
		return;
	}
	//邮件注册
	if (to.startsWith('register@')) {
		await mailRegisterFree(message, env)
		return;
	}
	await mailFall(message, env);
}

async function mailFall(message: ForwardableEmailMessage, env: Env): Promise<void> {
	const forward = 'neochau@gmail.com';
	try {
		await message.forward(forward);
	} catch (e) {
		console.error(`Error forwarding email: ${e}`);
	}
}

async function mailAi(message: ForwardableEmailMessage, env: Env): Promise<void> {
	const { AI } = env;
	const emailSubject = message.headers.get('Subject') || '';
	const result = await AI.run('@cf/meta/llama-3-8b-instruct', {
		prompt: emailSubject
	});
	const subject = `AI 回复`;
	const body = JSON.stringify(result, null, 4);
	await emailSend(message, env, subject, body);
}

async function emailSend(message: ForwardableEmailMessage, env: Env, subject: string, body: string) {
	const msg = createMimeMessage();
	const emailSubject = message.headers.get('Subject') || '';
	//keep sender's email content
	const { KV } = env;
	const mailPair = `${emailSubject}  \n\n ---- \n\n${subject}\n\n ${body}`;
	await KV.put(`${message.from}:to:${message.to}`, mailPair, {
		expirationTtl: 3600 * 24 * 30
	});

	msg.setHeader('In-Reply-To', message.headers.get('Message-ID') || 'unknown');
	msg.setSender({ name: '尊敬unchain-VPN用户', addr: message.to });
	msg.setRecipient(message.from);
	msg.setSubject(subject);
	msg.addMessage({
		contentType: 'text/plain',
		data: body
	});
	const replyMessage = new EmailMessage(
		message.to,
		message.from,
		msg.asRaw()
	);
	await message.reply(replyMessage);
}

function randStr(length: number): string {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function mailRegisterFree(message: ForwardableEmailMessage, env: Env): Promise<void> {
	const senderEmail = message.from;
	//1. check if the sender is already registered
	const db = env.DB;
	const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(senderEmail).first<User>();
	let subject = '';
	let body = '';
	if (user) {
		user.password = ''; // Don't return password in response
		subject = '您已经注册了';
		body = `您好, ${user.email} 您已经注册了,请不要重复注册\\n ${JSON.stringify(user, null, 2)}`;
		await emailSend(message, env, subject, body);
		return;
	}
	//create new user
	const randomPassword = randStr(10);
	try {
		subject = '注册成功';
		body = `您好, ${senderEmail} 您的账号已经创建成功,请妥善保存密码 \\r\\n密码:  ${randomPassword} \\r\\n 同时你将活动永久 10GB 免费流量`;
		await emailSend(message, env, subject, body);
		return;
	} catch (e) {
		console.error(`邮件注册用户失败: ${e}`);
		subject = '注册失败';
		body = `您好, ${senderEmail} 您的账号注册失败,请稍后再试或联系管理员.\\n 错误信息: ${e}`;
		await emailSend(message, env, subject, body);
	}
}
