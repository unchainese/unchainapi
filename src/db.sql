


CREATE TABLE nodes ("hostname" text,"ip" text,"req_count" integer,"active_ts" integer, version_info text, goroutine INTEGER, sub_addresses text)

CREATE TABLE users ("id" text,"email" text PRIMARY KEY,"available_kb" integer DEFAULT 0,"expire_ts" integer DEFAULT 0,"active_ts" integer DEFAULT 0,"role" text DEFAULT 'user')

CREATE TABLE usages ("uid" integer,"kb" integer,"created_date" text, category text DEFAULT 'raw')


CREATE TABLE temp_emails (
    email VARCHAR(255) PRIMARY KEY,
    forward_email VARCHAR(255) NOT NULL,
    expire_ts INT NOT NULL
);