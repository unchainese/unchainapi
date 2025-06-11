import { setSignedCookie ,getSignedCookie} from 'hono/cookie';

const COOKIE_NAME = 'token';
export async function  authCookieSet(c: any, email: string) {
	const maxAge = 3600 * 24 * 30; // 30 days
	await setSignedCookie(c, COOKIE_NAME, email, c.env.APP_SECRET, {
		expires: new Date(Date.now() + maxAge * 1000),
		secure: true,
		sameSite: 'Strict',
		httpOnly: true
	});
}

export async function  authCookieGet(c: any) {
	const email= await getSignedCookie(c, c.env.APP_SECRET, COOKIE_NAME) || "";
	return email as string
}




export function genVLESS(userID: string, addrWithPort: string, hostName: string, tls: boolean): string {
	const path = encodeURIComponent("/wsv/v1?ed=2560");
	return `vless://${userID}@${addrWithPort}?encryption=none&security=${tls ? "tls" : "none"}&type=ws&host=${hostName}&sni=${hostName}&fp=random&path=${path}#${addrWithPort}`;
}

export function removeDuplicates(arr: string[]): string[] {
	const map = new Map<string, boolean>();
	const result: string[] = [];

	for (const str of arr) {
		if (!map.has(str)) {
			map.set(str, true);
			result.push(str);
		}
	}
	return result;
}

