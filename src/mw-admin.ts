

import { createMiddleware } from 'hono/factory'
import { authCookieGet } from './utils';

export const mwAdmin = createMiddleware<{
	Bindings: Env,
	Variables: Variables
}>(async (c, next) => {
	let email = await authCookieGet(c)
	if(email !== c.env.ADMIN_EMAIL) {
		return c.json({ msg: "Unauthorized Not Admin",code:401 })
	}
	c.set('email', email)
	await next()
})

