import { Hono } from "hono";



export const apiVLESS = new Hono<{ Bindings: Env }>()

apiVLESS.get('/ws/:uuid', (c) => {
    const uuid = c.req.param('uuid')||'';
    

    return c.text('vless')
})