
import { D1Database, KVNamespace, ExecutionContext, ForwardableEmailMessage, EmailMessage } from "@cloudflare/workers-types";


interface EmailUser {
    email: string;
    forwardEmail: string;
}//todo add database


export async function mailHandler(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    const dstAddr = env.DST_MAIL || '';
    console.log('dstAddr:', dstAddr);
    if (!dstAddr) {
        return;
    }
    try {
        await message.forward(dstAddr);
    } catch (e) {
        console.error(e);
    }
}