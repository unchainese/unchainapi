import { createMiddleware } from 'hono/factory';
import { jwtVerify } from './utils';


export const mwAuth = createMiddleware<{
	Bindings: Env,
	Variables: Variables
}>(async (c, next) => {
	const token = c.req.header('Authorization');
	if (!token) {
		return c.json({ msg: 'No token is found', code: 401 });
	}
	try {
		const user = await jwtVerify(token, c.env.APP_SECRET);
		if (user && user.email) {
			c.set('email', user.email);
			await next();
		}
	} catch (e) {
		return c.json({ msg: `JWT is invalid: ${e}`, code: 401 });
	}
});



