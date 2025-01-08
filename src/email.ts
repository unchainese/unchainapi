import { ExecutionContext, ForwardableEmailMessage } from '@cloudflare/workers-types';
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';// npm install mimetext


export async function mailHandler(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {


	const to = message.to || '';
	if (to.startsWith('ai.')) {
		await mailHandlerReply(message, env, ctx);
		return;
	}

	const forward = to.startsWith('n') ? 'neochau@gmail.com' : 'neochau@foxmail.com';
	try {
		await message.forward(forward);
	} catch (e) {
		console.error(`Error forwarding email: ${e}`);
	}
}



async function mailHandlerReply(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
	const senderAddr = message.to;
	const msg = createMimeMessage();
	const emailBody = await new Response(message.raw).text();
	const { KV, AI } = env;
	await KV.put(`${message.from}:to:${message.to}`, emailBody, {
		expirationTtl: 3600 * 24 * 30
	});

	const result = await AI.run("@cf/meta/llama-3-8b-instruct", {
		prompt: emailBody,
	})

	msg.setHeader('In-Reply-To', message.headers.get('Message-ID') || 'unknown');
	msg.setSender({ name: 'Thank you for your contact', addr: senderAddr });
	msg.setRecipient(message.from);
	msg.setSubject('Email Routing Auto-reply');
	msg.addMessage({
		contentType: 'text/plain',
		data: JSON.stringify(result, null, 2),
	});

	const replyMessage = new EmailMessage(
		senderAddr,
		message.from,
		msg.asRaw()
	);
	await message.reply(replyMessage);
}
