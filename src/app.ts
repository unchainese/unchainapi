import { Hono } from 'hono'
import { apiUsers } from './app-users'
import { apiNodes } from './app-nodes'
import { apiUsages } from './app-usages'
import { apiMeta } from './app-meta'



export const app = new Hono<{ Bindings: Env }>()


app.route('/api/users', apiUsers)
app.route('/api/nodes', apiNodes)
app.route('/api/usages', apiUsages)
app.route('/api/meta', apiMeta)