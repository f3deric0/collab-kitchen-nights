-- Roles
create type public.app_role as enum ('admin', 'user');
create type public.booking_status as enum ('pending', 'confirmed', 'rejected');
create type public.ingredient_category as enum ('base', 'spice', 'fresh', 'condiment', 'other');

-- Shared updated_at helper
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

-- User roles (roles MUST be separate from profiles)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Collab types for future expansion
create table public.collab_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.collab_types enable row level security;

create trigger update_collab_types_updated_at
before update on public.collab_types
for each row
execute function public.update_updated_at_column();

-- Pantry ingredients
create table public.pantry_ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.ingredient_category not null default 'other',
  notes text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pantry_ingredients enable row level security;

create trigger update_pantry_ingredients_updated_at
before update on public.pantry_ingredients
for each row
execute function public.update_updated_at_column();

-- Booking requests
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  participants integer not null check (participants >= 2 and participants <= 20),
  notes text,
  collab_type_id uuid references public.collab_types(id) on delete set null,
  requested_date date not null,
  requested_time time,
  status public.booking_status not null default 'pending',
  admin_notes text,
  calendar_event_id text,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_requests enable row level security;

create trigger update_booking_requests_updated_at
before update on public.booking_requests
for each row
execute function public.update_updated_at_column();

create index idx_booking_requests_requested_date on public.booking_requests(requested_date);
create index idx_booking_requests_status on public.booking_requests(status);
create index idx_pantry_ingredients_display_order on public.pantry_ingredients(display_order);

-- Seed default collab types
insert into public.collab_types (slug, title, description)
values
  ('general', 'Open Collab', 'A flexible shared dinner night.'),
  ('pasta-night', 'Pasta Night', 'Fresh pasta, sauces and a communal table.'),
  ('veggie-night', 'Veggie Night', 'Vegetarian dishes made together.');

-- Profiles policies
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Admins can view all profiles"
on public.profiles
for select
using (public.has_role(auth.uid(), 'admin'));

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can update all profiles"
on public.profiles
for update
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- User roles policies
create policy "Users can view their own roles"
on public.user_roles
for select
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles
for select
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert roles"
on public.user_roles
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles"
on public.user_roles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Collab types policies
create policy "Anyone can view active collab types"
on public.collab_types
for select
using (is_active = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert collab types"
on public.collab_types
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update collab types"
on public.collab_types
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete collab types"
on public.collab_types
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Pantry policies
create policy "Anyone can view pantry ingredients"
on public.pantry_ingredients
for select
using (true);

create policy "Admins can insert pantry ingredients"
on public.pantry_ingredients
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update pantry ingredients"
on public.pantry_ingredients
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete pantry ingredients"
on public.pantry_ingredients
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Booking policies
create policy "Admins can view all booking requests"
on public.booking_requests
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Logged in users can view their own booking requests"
on public.booking_requests
for select
to authenticated
using (created_by_user_id = auth.uid());

create policy "Logged in users can create their own booking requests"
on public.booking_requests
for insert
to authenticated
with check (created_by_user_id = auth.uid());

create policy "Admins can update booking requests"
on public.booking_requests
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete booking requests"
on public.booking_requests
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));