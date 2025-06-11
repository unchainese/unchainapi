import { ExecutionContext, ForwardableEmailMessage } from '@cloudflare/workers-types';
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';
import { User } from './types';
import { jwtCreate, randStr } from './utils';
import { bizUserCreate } from './biz';

// npm install mimetext

export async function mailRouteHandler(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
	const to = message.to || '';
	//ai 问答
	if (to.startsWith('ai@')) {
		await mailAi(message, env);
		return;
	}
	//邮件注册
	if (to.startsWith('register@')) {
		await mailRegisterFree(message, env);
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


async function mailRegisterFree(message: ForwardableEmailMessage, env: Env): Promise<void> {
	const randomPassword = randStr(10);
	try {
		await bizUserCreate(env, message.from, randomPassword, 10); // Create user with 10GB free traffic
		const token = await jwtCreate(message.from, env.APP_SECRET);
		const userURL = `https://unchain.libragen.cn/#/user?token=${token}`;
		const subject = '注册成功';
		const body = `您好, ${message.from} 您的账号已经创建成功,请妥善保存密码 \r\n密码:  ${randomPassword} \r\n 同时你将活动永久 10GB 免费流量\r\n 请访问以下链接查看您的账号信息: ${userURL}`;
		await emailSend(message, env, subject, body);
		return;
	} catch (e) {
		console.error(`邮件注册用户失败: ${e}`);
		const subject = '注册失败';
		const body = `您好, ${message.from} 您的账号注册失败,请稍后再试或联系管理员.\r\n 错误信息: ${e}`;
		await emailSend(message, env, subject, body);
	}
}
