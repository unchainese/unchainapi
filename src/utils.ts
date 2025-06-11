import { setSignedCookie, getSignedCookie } from 'hono/cookie';

const COOKIE_NAME = 'token';

export async function authCookieSet(c: any, email: string) {
	const maxAge = 3600 * 24 * 30; // 30 days
	await setSignedCookie(c, COOKIE_NAME, email, c.env.APP_SECRET, {
		expires: new Date(Date.now() + maxAge * 1000),
		secure: true,
		sameSite: 'Strict',
		httpOnly: true
	});
}

export async function authCookieGet(c: any) {
	const email = await getSignedCookie(c, c.env.APP_SECRET, COOKIE_NAME) || '';
	return email as string;
}


export function genVLESS(userID: string, addrWithPort: string, hostName: string, tls: boolean): string {
	//vless://dd5749eb-4114-49d4-bc26-eaf792cef029@ipOrDomain:80?encryption=none&security=none&allowInsecure=1&type=ws&host=fake.host.com&path=%2Fwsv%2Frandom%3Fed%3D2560#remarks
	const path = encodeURIComponent('/wsv/v1?ed=2560');
	return `vless://${userID}@${addrWithPort}?encryption=none&security=${tls ? 'tls' : 'none'}&type=ws&host=${hostName}&sni=${hostName}&fp=random&path=${path}#${addrWithPort}`;
}


interface VLESS {
	uuid: string;
	ipOrDomain: string;
	port: number;
	hostName: string;
	tls: boolean;
	remark: string;
	nonce?: string;
}

export function vlessURL(v: VLESS): string {
	//vless://dd5749eb-4114-49d4-bc26-eaf792cef029@ipOrDomain:80?encryption=none&security=none&allowInsecure=1&type=ws&host=fake.host.com&path=%2Fwsv%2Frandom%3Fed%3D2560#remarks
	const path = encodeURIComponent(`/wsv/${v.nonce||'v1'}?ed=2560`);
	return `vless://${v.uuid}@${v.ipOrDomain}:${v.port}?encryption=none&security=${v.tls ? 'tls' : 'none'}&type=ws&host=${v.hostName}&sni=${v.hostName}&fp=random&path=${path}#${v.remark}`;
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

