

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
	const email = await getSignedCookie(c,c.env.APP_SECRET,"token")
	console.log("token",email)
	if	(email != "neochau@gamil.com"){
		return c.json({error: "Forbidden"}, 403)
	}
	await next()
})
