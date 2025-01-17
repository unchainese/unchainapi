import { Hono } from "hono";
import { Node, User } from "./types";


export const apiNodes = new Hono<{ Bindings: Env }>()


interface AppStat {
    traffic: { [key: string]: number };//uuid -> KB number
    hostname: string;
    sub_addresses: string[];
    req_count: number;
    goroutine: number;
    version_info: string,
}




apiNodes.get('/', async (c) => {
    const offset = parseInt(c.req.query("offset") || '0')
    const limit = parseInt(c.req.query("limit") || '10')
    const db = c.env.DB;
    const nowTs = Math.floor(Date.now() / 1000) - 3600 * 24
    const qq = `SELECT * FROM nodes WHERE active_ts > ? ORDER BY active_ts DESC LIMIT ? OFFSET ?`
    const { results } = await db.prepare(qq).bind(nowTs, limit, offset).all<Node>();
    return c.json(results)

})


apiNodes.post('/', async (c) => {
    const body = await c.req.json<AppStat>();
    console.log("push body")
    console.error(body)
    const db = c.env.DB;
    const nowTs = Math.floor(Date.now() / 1000)
    const clientIP = c.req.header("cf-connecting-ip") || '';
    const sub_addresses = body.sub_addresses.join(",")
    await db.prepare("DELETE FROM nodes WHERE ip = ?").bind(clientIP).run();
    const qq = "INSERT INTO nodes (hostname, ip, req_count, active_ts, goroutine, version_info,sub_addresses) VALUES (?, ?, ?, ?, ?, ?, ?)"
    await db.prepare(qq).bind(body.hostname, clientIP, body.req_count, nowTs, body.goroutine, body.version_info, sub_addresses).run();

    const qqq = "SELECT * FROM users WHERE expire_ts > ? AND available_kb > ?"
    const {results} = await db.prepare(qqq).bind(nowTs, 0).all<User>();

    const allowUsers: { [key: string]: number } = {}
    const stmtList: D1PreparedStatement[] = []
    const nowDate = new Date().toISOString().slice(0, 10);
    for (const u of results) {
        const id = u.id
        let usedKB = body.traffic[id] || 0;
        if (usedKB < 0) {
            usedKB = 0
        }
        u.available_kb = u.available_kb - usedKB
        if (u.available_kb < 0) {
            u.available_kb = 0
        }else{
            allowUsers[id] = u.available_kb
        }
        if (usedKB<1) continue;
        console.log("set uid",id,u.available_kb)
        const userKbUpdate = db.prepare("UPDATE users SET available_kb = ? WHERE id = ?").bind(u.available_kb,id)
        const stmtUsageInsert = db.prepare("INSERT INTO usages (uid,kb,created_date,category) VALUES (?,?,?,?)").bind(id, usedKB, nowDate, 'raw')

        stmtList.push(userKbUpdate)
        stmtList.push(stmtUsageInsert)
    }
    if(stmtList.length>0){
        await db.batch(stmtList)
    }
    return c.json(allowUsers)
})


apiNodes.delete('/', async (c) => {
    const body = await c.req.json<Node>();
    const db = c.env.DB;
    const q = "DELETE FROM nodes WHERE ip = ? AND hostname = ?";
    await db.prepare(q).bind(body.ip, body.hostname).run();
    return c.json(body)
})
