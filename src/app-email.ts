import { Hono } from "hono"
import { TempEmail } from "./types"




export const apiEmails = new Hono<{ Bindings: Env }>()



apiEmails.get('/', async (c) => {
    const { DB: db } = c.env
    const qq = `SELECT * FROM temp_emails`
    const { results } = await db.prepare(qq).all<TempEmail>()
    return c.json(results)
})




apiEmails.post("/", async (c) => {
    const body = await c.req.json<TempEmail>();
    body.expire_ts = Math.floor(Date.now() / 1000) + 3600 * 24 * 30;

    const { DB: db } = c.env
    const qq = `INSERT INTO temp_emails (email,forward_email,expire_ts) VALUES (?,?,?)`
    await db.prepare(qq).bind(body.email, body.forward_email, body.expire_ts).run()
    return c.json(body)
})


apiEmails.delete("/", async (c) => {
    const body = await c.req.json<TempEmail>();
    const { DB: db } = c.env
    const qq = `DELETE FROM temp_emails WHERE email=?`
    const { results } = await db.prepare(qq).bind(body.email).run()
    return c.json(results)
})