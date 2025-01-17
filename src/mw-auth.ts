

import { createMiddleware } from 'hono/factory'
import {
	getSignedCookie,
} from 'hono/cookie'

export const mwAuth = createMiddleware<{
	Bindings: Env,
	// Variables: {
	// 	echo: (str: string) => string
	// }
}>(async (c, next) => {
	let email = await getSignedCookie(c,c.env.APP_SECRET,"token")||""
	if	(email != "neochau@gmail.com"){
		return c.json({error: "Forbidden"}, 403)
	}
	await next()
})
