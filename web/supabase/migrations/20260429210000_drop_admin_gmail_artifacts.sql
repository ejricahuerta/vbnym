-- Drop admin Gmail artifacts: only host:<email> connections are used now.

drop table if exists "6ixback".game_email_sync_config cascade;

delete from "6ixback".gmail_connections
where id not like 'host:%';
