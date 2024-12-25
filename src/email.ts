
import { ExecutionContext, ForwardableEmailMessage } from "@cloudflare/workers-types";
import { TempEmail } from "./types";



export async function mailHandler(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    const { DB: db } = env;
    const q = `SELECT * FROM temp_emails WHERE email = ? AND expire_ts > ?`;
    const nowTs = Math.floor(Date.now() / 1000);
    const tempEmail = await db.prepare(q).bind(message.to, nowTs).first<TempEmail>();
    if (!tempEmail) {
        console.info(`No temp email found for ${message.to}`);
        message.setReject("Address not allowed");
        return;
    }
    try {
        await message.forward(tempEmail.forward_email);
    } catch (e) {
        console.error(`Error forwarding email: ${e}`);
    }
}