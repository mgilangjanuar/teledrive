CREATE TABLE public.config (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invitation_code character varying,
    disable_signup boolean DEFAULT false NOT NULL
);

ALTER TABLE public.users ADD role character varying DEFAULT NULL;

ALTER TABLE public.config ADD allow_server_storage_use boolean DEFAULT false NOT NULL;