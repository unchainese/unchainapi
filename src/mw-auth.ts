

import { createMiddleware } from 'hono/factory'

const logger = createMiddleware<{
	Variables: {
		echo: (str: string) => string
	}
}>(async (c, next) => {
	console.log(`[${c.req.method}] ${c.req.url}`)
	await next()
})
