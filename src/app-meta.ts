import { Hono } from "hono";

export const apiMeta = new Hono<{ Bindings: Env }>()

apiMeta.get('/ping', (c) => c.text('pong'))

apiMeta.get('/ip', (c) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') || c.req.header('x-client-ip') || c.req.header('x-remote-ip') ||
        c.req.header('x-originating-ip') || c.req.header('x-remote-addr') || c.req.header('x-remote-address') ||
        c.req.header('x-remote-host') || c.req.header('x-remote-addr') || '';
    const geo = c.req.header('cf-ipcountry');
    return c.json({ ip, geo })
})
