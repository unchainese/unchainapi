
import { ExecutionContext, ForwardableEmailMessage } from "@cloudflare/workers-types";



export async function mailHandler(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    const fromEmailAddr = `email:from:${message.from}`
    //set kv email address in another worker
    const dstEmailAddr:string = await env.KV.get(fromEmailAddr) || ""
    if (!dstEmailAddr) {
        console.info(`No forwarding address found for ${message.from}`);
        return;
    }
    try {
        await message.forward(dstEmailAddr);
    } catch (e) {
        console.error(`Error forwarding email: ${e}`);
    }
}