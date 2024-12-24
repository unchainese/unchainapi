import { Hono } from "hono"




export const apiEmails = new Hono<{ Bindings: Env }>()



apiEmails.get('/', async (c) => {
    const results = await  c.env.KV.list({prefix: "email:from:"})
    return c.json(results)
})


apiEmails.post("/", async (c) => {
    const results = await  c.env.KV.list({prefix: "email:from:"})
    return c.json(results)

})