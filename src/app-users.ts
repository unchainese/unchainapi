import { Node, User } from "./types";
import { Hono } from "hono";


export const apiUsers = new Hono<{ Bindings: Env }>()


apiUsers.get('/:id', async (c) => {
    const  id  = c.req.param('id');
		console.error("user detail id",id)
    const db = c.env.DB;
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<User>()
    if (!user) {
        return new Response("User not found", { status: 404 })
    }

    const nowTs = Math.floor(Date.now() / 1000) - 3600 * 24
    const qq = "SELECT DISTINCT sub_addresses FROM nodes WHERE active_ts > ? LIMIT 100"
    const { results } = await db.prepare(qq).bind(nowTs).all<Node>();
		console.error("user detail results",results)
    const hostPorts = results.map((r) => {
        return r.sub_addresses.split(",")
    }).flat().map((addr) => addr.trim());

    const subUrls = removeDuplicates(hostPorts).map((addrPort) => {
        const isTLS = addrPort.endsWith(":443")
        return genVLESS(id, addrPort, "", isTLS)
    })
    user.sub_txt = subUrls.join("\n")
    c.json(user)
})

apiUsers.get('/', async (c) => {
    const limit = parseInt(c.req.query("size") || '120')
    const offset = (parseInt(c.req.query("page") || '1') - 1) * limit
    const email = c.req.query("email") || ''

    const db = c.env.DB;
    const q = `SELECT * FROM users LIMIT ?1 OFFSET ?2`
    const users = await db.prepare(q).bind(limit, offset).all<User>();
    return c.json(users.results)
})

apiUsers.post("/", async (c) => {
    const body = await c.req.json<User>();
    body.id = crypto.randomUUID();
    body.active_ts = Math.floor(Date.now() / 1000);
    if (body.expire_ts < 3600) {
        body.expire_ts = Math.floor(Date.now() / 1000) + 3600 * 24 * 30;
    }
    const db = c.env.DB;
    // language=SQL format=false
    const q = `INSERT INTO users (id,email,available_kb,expire_ts,active_ts) VALUES (?,?,?,?,?)`
    await db.prepare(q).bind(body.id, body.email, body.available_kb, body.expire_ts, body.active_ts).run();
    return c.json(body)
})


apiUsers.patch("/", async (c) => {
    const body = await c.req.json<User>();
    body.active_ts = Math.floor(Date.now() / 1000);
    if (body.expire_ts < 3600) {
        body.expire_ts = Math.floor(Date.now() / 1000) + 3600 * 24 * 30;
    }
    const db = c.env.DB;

    // language=SQL format=false
    const q = `UPDATE users SET email=?,available_kb=?,expire_ts=? WHERE id=?`
    await db.prepare(q).bind(body.email, body.available_kb, body.expire_ts, body.id).run();
    return c.json(body)
})



apiUsers.delete("/", async (c) => {
    const body = await c.req.json<User>();
    const db = c.env.DB;

    // language=SQL format=false
    const q = `DELETE FROM users WHERE id=?`
    await db.prepare(q).bind(body.id).run();
    return c.json(body)
})



function genVLESS(userID: string, addrWithPort: string, hostName: string, tls: boolean): string {
    const path = encodeURIComponent("/wsv/v1?ed=2560");
    return `vless://${userID}@${addrWithPort}?encryption=none&security=${tls ? "tls" : "none"}&type=ws&host=${hostName}&sni=${hostName}&fp=random&path=${path}#${addrWithPort}`;
}

function removeDuplicates(arr: string[]): string[] {
    const map = new Map<string, boolean>();
    const result: string[] = [];

    for (const str of arr) {
        if (!map.has(str)) {
            map.set(str, true);
            result.push(str);
        }
    }

    return result;
}



