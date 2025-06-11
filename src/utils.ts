import { getSignedCookie, setSignedCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';

const maxAge = 3600 * 24 * 14; // 30 days


export function randStr(length: number): string {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
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
	const path = encodeURIComponent(`/wsv/${v.nonce || 'v1'}?ed=2560`);
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

interface UserJWT {
	email: string;
	exp?: number; // Optional expiration time
}

export async function jwtCreate(email: string, secret: string): Promise<string> {
	// 当前时间 + 过期秒数
	const exp = Math.floor(Date.now() / 1000) + maxAge;
	return await sign({ email, exp }, secret);
}

export async function jwtVerify(token: string, secret: string): Promise<UserJWT> {
	token = token.trim();
	if (token.startsWith('Bearer ')) {
		token = token.slice(7);
	}


	const user = await verify(token, secret);
	if (!user || typeof user !== 'object' || !user.email) {
		throw new Error('Invalid JWT token');
	}
	return {
		email: user.email as string,
		exp: user.exp
	};
}
