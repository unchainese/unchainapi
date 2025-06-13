export interface User {
	id: string
	email: string
	available_kb: number
	expire_ts: number,
	active_ts: number,
	sub_txt: string,//not a column in db, just for VLESS URL
	password?: string,//optional, for login  bcrypt-hashed
	status?: string,//optional, 'active', 'inactive', 'banned'
	isExistInDB?: boolean,//not a db column, for check if user exists in DB
}



export interface Ticket {
	id: number;
	email: string; // user email
	title: string; // ticket title
	content: string; // ticket content
	feedback: string; // admin feedback
	created_ts: number; // timestamp of creation
	updated_ts: number; // timestamp of last update
}

export interface Node {
	hostname: string
	ip: string
	active_ts: number
	goroutine: number;
	version_info: string,
	sub_addresses: string,// eg a.ex.com:90,b.ex.com:443,c.ex.com:8080
}


export interface Usage {
	uid: string;
	kb: number;//KB
	created_date: string;//eg 2024-09-28
	category: string;//eg 'raw','daily'
}


export interface TempEmail {
	email: string;//temp email address
	forward_email: string; // forward to this email address
	expire_ts: number;//second
}


export const cfg = {
	limit: '120',
	offset: '0'
};
