--
-- PostgreSQL database dump
--

-- Dumped from database version 12.9 (Ubuntu 12.9-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.9 (Ubuntu 12.9-0ubuntu0.20.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner:
--

-- COMMENT ON EXTENSION pg_stat_statements IS 'track execution statistics of all SQL statements executed';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner:
--

-- COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.files (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    type character varying,
    message_id character varying,
    mime_type character varying,
    size bigint,
    uploaded_at timestamp with time zone,
    upload_progress double precision,
    user_id uuid NOT NULL,
    parent_id uuid,
    deleted_at timestamp with time zone,
    sharing_options character varying[],
    signed_key character varying,
    file_id character varying,
    link_id uuid,
    forward_info character varying
);


-- ALTER TABLE public.files OWNER TO postgres;

--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rate_limits (
    key character varying(255) NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    expire bigint
);


-- ALTER TABLE public.rate_limits OWNER TO postgres;

--
-- Name: usages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usages (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    key character varying NOT NULL,
    usage bigint NOT NULL,
    expire timestamp with time zone NOT NULL
);


-- ALTER TABLE public.usages OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying NOT NULL,
    name character varying,
    email character varying,
    tg_id character varying,
    plan character varying,
    subscription_id character varying,
    midtrans_id character varying,
    plan_expired_at timestamp without time zone,
    settings jsonb
);


-- ALTER TABLE public.users OWNER TO postgres;

--
-- Name: waitings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.waitings (
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL
);


-- ALTER TABLE public.waitings OWNER TO postgres;

--
-- Name: files PK_6c16b9093a142e0e7613b04a3d9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY (id);


--
-- Name: usages PK_7d8e95b6dd4c0e87cad4972da13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usages
    ADD CONSTRAINT "PK_7d8e95b6dd4c0e87cad4972da13" PRIMARY KEY (key);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: waitings PK_f0cfe98441cf0fb92db66ae71c4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waitings
    ADD CONSTRAINT "PK_f0cfe98441cf0fb92db66ae71c4" PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (key);


--
-- Name: files_message_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX files_message_id_idx ON public.files USING btree (message_id);


--
-- Name: files_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX files_parent_id_idx ON public.files USING btree (parent_id);


--
-- Name: files_link_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX files_link_id_idx ON public.files USING btree (link_id);


--
-- Name: files_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX files_user_id_idx ON public.files USING btree (user_id);


--
-- Name: tg_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tg_id ON public.users USING btree (tg_id);


--
-- Name: files files_files_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_files_fkey FOREIGN KEY (parent_id) REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: files files_links_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_links_fkey FOREIGN KEY (link_id) REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: files files_users_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_users_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--