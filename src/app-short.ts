import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'


export const apiLinks = new Hono<{ Bindings: Env }>();
export const apiS = new Hono<{ Bindings: Env }>();

const mwCheckJsonUrl = zValidator(
	'json',
	z.object({
		url: z.string().url().describe('The URL to shorten'),
	})
)

function randomSlug(length: number): string {
	// Unicode ranges for emoji: faces (U+1F600–U+1F64F), objects (U+1F680–U+1F6FF)
	const emojiRanges = [
		[0x1F600, 0x1F64F], // Emoticons (faces)
		[0x1F680, 0x1F6FF], // Transport & map symbols (objects)
	];
	function randomEmoji() {
		const [start, end] = emojiRanges[Math.floor(Math.random() * emojiRanges.length)];
		const codePoint = start + Math.floor(Math.random() * (end - start + 1));
		return String.fromCodePoint(codePoint);
	}
	let slug = '';
	for (let i = 0; i < length; i++) {
		slug += randomEmoji();
	}
	return slug;
}

apiLinks.post('/', mwCheckJsonUrl,async (c) => {
	const {KV} = c.env
	const { url } = c.req.valid('json')

	let slug = randomSlug(6);
	let existingUrl = await KV.get(slug);
	while (existingUrl) {
		slug = randomSlug(6);
		existingUrl = await KV.get(slug);
	}

	await KV.put(slug, url, { expirationTtl: 60 * 60 * 24 * 365 }); // Store for 365 days
	const host = c.req.header('host') || 'localhost';
	const shortUrl = `https://${host}/s/${slug}`;
	return c.json({ shortUrl, slug });
})

apiS.get('/:slug', async (c) => {
	const {KV} = c.env
	const slug = c.req.param('slug');
	if (!slug || slug.length < 6) {
		return c.json({ error: 'Invalid slug' }, 400);
	}
	const url = await KV.get(slug);
	if (!url) {
		return c.json({ error: 'Short link not found' }, 404);
	}
	return c.redirect(url, 301);
})
