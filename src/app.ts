import { D1Database, KVNamespace } from "@cloudflare/workers-types";
import { Hono } from 'hono'
import { setUpWebhook, webhookHandler } from './telegrambot'



export const app = new Hono<{ Bindings: Env }>()


app.get('/ping', (c) => c.text('pong'))

app.get('/ip', (c) => {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') || c.req.header('x-client-ip') || c.req.header('x-remote-ip') ||
        c.req.header('x-originating-ip') || c.req.header('x-remote-addr') || c.req.header('x-remote-address') ||
        c.req.header('x-remote-host') || c.req.header('x-remote-addr') || '';
    const geo = c.req.header('cf-ipcountry');
    return c.json({ ip, geo })
})

app.get('/telegram/setup', async (c) => {
    const host = new URL(c.req.url).host;
    const webhookToken = c.env.TELEGRAM_WEBHOOK_TOKEN;
    const telegramToken = c.env.TELEGRAM_TOKEN;
    await setUpWebhook(host, telegramToken, webhookToken)
    return c.text('done')
})

app.post('/telegram/webhook', async (c, next) => {
    const hh = webhookHandler(c.env.TELEGRAM_TOKEN, c.env.TELEGRAM_WEBHOOK_TOKEN)
    return await hh(c)
})