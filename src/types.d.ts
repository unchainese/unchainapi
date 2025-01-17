export interface User {
    id: string
    email: string
    available_kb: number
    expire_ts: number,
    active_ts: number,
    role: string,//admin,'user' for normal user
    sub_txt: string,//not a column in db, just for VLESS URL
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
    uid: string
    kb: number//KB
    created_date: string//eg 2024-09-28
    category: string//eg 'raw','daily'
}


export interface TempEmail {
    email: string//temp email address  
    forward_email: string // forward to this email address
    expire_ts: number//second
}


export const cfg = {
    limit: "120",
    offset: "0",
}