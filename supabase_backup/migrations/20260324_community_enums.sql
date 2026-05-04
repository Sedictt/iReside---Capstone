-- community enums
create type post_type_enum as enum ('announcement', 'poll', 'photo_album', 'discussion');
create type post_status_enum as enum ('draft', 'published', 'archived');
create type reaction_type_enum as enum ('like', 'heart', 'thumbs_up', 'clap', 'celebration');
create type report_status_enum as enum ('pending', 'reviewed', 'dismissed', 'escalated');
