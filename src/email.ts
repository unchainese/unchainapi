
import { D1Database, KVNamespace, ExecutionContext, ForwardableEmailMessage, EmailMessage } from "@cloudflare/workers-types";

interface Env {
    DB: D1Database;
    KV: KVNamespace;
    DST_MAIL: string;//eg : xxxx@gmail.com
}



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