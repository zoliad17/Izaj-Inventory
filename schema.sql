-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user uuid,
  quantity bigint NOT NULL,
  action text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at date,
  CONSTRAINT audit logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit logs_user_fkey FOREIGN KEY (user) REFERENCES public.user(user_id)
);
CREATE TABLE public.branch (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  location text NOT NULL,
  address text,
  CONSTRAINT branch_pkey PRIMARY KEY (id)
);
CREATE TABLE public.category (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  category_name text NOT NULL,
  CONSTRAINT category_pkey PRIMARY KEY (id)
);
CREATE TABLE public.centralized_product (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  product_name text NOT NULL,
  quantity bigint,
  price real,
  category_id integer,
  status character varying,
  branch_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT centralized_product_pkey PRIMARY KEY (id),
  CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES public.category(id),
  CONSTRAINT fk_branch FOREIGN KEY (branch_id) REFERENCES public.branch(id)
);
CREATE TABLE public.pending_user (
  pending_user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  contact numeric NOT NULL,
  role_id integer NOT NULL,
  branch_id integer,
  status text DEFAULT 'Pending'::text,
  setup_token text NOT NULL UNIQUE,
  token_expiry timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pending_user_pkey PRIMARY KEY (pending_user_id),
  CONSTRAINT pending_user_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id),
  CONSTRAINT pending_user_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id)
);
CREATE TABLE public.product_requisition (
  request_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_from uuid NOT NULL,
  request_to uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  notes text,
  CONSTRAINT product_requisition_pkey PRIMARY KEY (request_id),
  CONSTRAINT product_requisition_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user(user_id),
  CONSTRAINT product_requisition_request_to_fkey FOREIGN KEY (request_to) REFERENCES public.user(user_id),
  CONSTRAINT product_requisition_request_from_fkey FOREIGN KEY (request_from) REFERENCES public.user(user_id)
);
CREATE TABLE public.product_requisition_items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  request_id bigint NOT NULL,
  product_id integer NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  CONSTRAINT product_requisition_items_pkey PRIMARY KEY (id),
  CONSTRAINT product_requisition_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.centralized_product(id),
  CONSTRAINT product_requisition_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.product_requisition(request_id)
);
CREATE TABLE public.role (
  id integer NOT NULL DEFAULT nextval('role_id_seq'::regclass),
  role_name character varying NOT NULL UNIQUE,
  CONSTRAINT role_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user (
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password text,
  role_id integer,
  created_at timestamp with time zone DEFAULT now(),
  name character varying,
  contact numeric,
  status text,
  branch_id integer,
  setup_token text UNIQUE,
  token_expiry timestamp with time zone,
  CONSTRAINT user_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branch(id),
  CONSTRAINT user_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id)
);