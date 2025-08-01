import { Hono } from 'hono';
import { apiUsers } from './app-users';
import { apiNodes } from './app-nodes';
import { apiUsages } from './app-usages';
import { apiMeta } from './app-meta';
import { apiOAuth } from './app-oauth';
import { apiTelegram } from './app-telegram';
import { apiAuth } from './app-auth';
import { apiUser } from './app-user';
import { apiNode } from './app-node';
import { apiTickets } from './app-tickets';
import { apiLinks, apiS } from './app-short';


export const app = new Hono<{ Bindings: Env, Variables: Variables }>();

app.route('/api/node', apiNode);//for unchain-node register
app.route('/api/meta', apiMeta);

app.route('/api/users', apiUsers);//admin
app.route('/api/nodes', apiNodes);//admin
app.route('/api/usages', apiUsages);//admin
app.route('/api/tickets', apiTickets);//admin

app.route('/api/user', apiUser);//user auth


app.route('/api/auth', apiAuth);
app.route('/api/oauth', apiOAuth);
app.route('/api/telegram', apiTelegram);


app.route('/links', apiLinks);//for interviews
app.route('/s', apiS);//for interviews
