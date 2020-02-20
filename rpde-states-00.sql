CREATE TABLE `rpde_state` (
	`publisher_id`	TEXT NOT NULL UNIQUE,
	`last_id`	TEXT NOT NULL,
	`last_timestamp`	INTEGER NOT NULL,
	PRIMARY KEY(`publisher_id`)
);