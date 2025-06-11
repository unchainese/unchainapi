import { Hono } from "hono";
import { Usage } from "./types";
import { mwAuth } from './mw-auth';


export const apiUsages = new Hono<{ Bindings: Env }>().use(mwAuth)


apiUsages.get('/', async (c) => {
    const offset = parseInt(c.req.query("offset") || '0')
    const limit = parseInt(c.req.query("limit") || '10')
    const db = c.env.DB;
    const nowDate = new Date().toISOString().slice(0, 10);
    const qq = `SELECT * FROM usages WHERE created_date <= ? ORDER BY created_date DESC LIMIT ? OFFSET ?`
    const { results } = await db.prepare(qq).bind(nowDate, limit, offset).all<Usage>();
    return c.json(results)
})
