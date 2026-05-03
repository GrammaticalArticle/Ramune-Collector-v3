-- ============================================================
-- RAMUNE CATCHER — Supabase Setup
-- Paste this entire file into Supabase SQL Editor and click Run
-- ============================================================

-- ─── TABLES ──────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.flavors (
  id serial primary key,
  japanese_name text not null,
  name text not null,
  barcode text unique,
  color text not null default '#4FC3F7',
  brand text not null default 'Hata Kosen',
  category text not null default 'standard',
  sort_order integer not null default 0,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.flavor_barcodes (
  id serial primary key,
  flavor_id integer not null references public.flavors(id) on delete cascade,
  barcode text not null unique,
  region text not null default 'JP',
  added_by text,
  added_at timestamptz not null default now()
);

create table if not exists public.caught_flavors (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  flavor_id integer not null references public.flavors(id) on delete cascade,
  caught_at timestamptz not null default now(),
  unique(user_id, flavor_id)
);

create table if not exists public.locations (
  id serial primary key,
  name text not null,
  city text not null,
  country text not null,
  lat double precision not null,
  lng double precision not null,
  added_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  verified boolean not null default false,
  verified_by uuid references auth.users(id)
);

create table if not exists public.location_flavors (
  id serial primary key,
  location_id integer not null references public.locations(id) on delete cascade,
  flavor_id integer not null references public.flavors(id) on delete cascade,
  price double precision,
  currency text,
  added_by uuid references auth.users(id),
  added_at timestamptz not null default now(),
  unique(location_id, flavor_id)
);

create table if not exists public.friendships (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, friend_id)
);

-- ─── TRIGGER: auto-create profile on sign-up ─────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── ADMIN HELPER ────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.flavors enable row level security;
alter table public.flavor_barcodes enable row level security;
alter table public.caught_flavors enable row level security;
alter table public.locations enable row level security;
alter table public.location_flavors enable row level security;
alter table public.friendships enable row level security;

-- profiles
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- flavors
drop policy if exists "flavors_select" on public.flavors;
drop policy if exists "flavors_insert" on public.flavors;
drop policy if exists "flavors_update" on public.flavors;
drop policy if exists "flavors_delete" on public.flavors;
create policy "flavors_select" on public.flavors for select using (true);
create policy "flavors_insert" on public.flavors for insert with check (auth.uid() is not null);
create policy "flavors_update" on public.flavors for update using (public.is_admin());
create policy "flavors_delete" on public.flavors for delete using (public.is_admin());

-- flavor_barcodes
drop policy if exists "barcodes_select" on public.flavor_barcodes;
drop policy if exists "barcodes_insert" on public.flavor_barcodes;
drop policy if exists "barcodes_delete" on public.flavor_barcodes;
create policy "barcodes_select" on public.flavor_barcodes for select using (true);
create policy "barcodes_insert" on public.flavor_barcodes for insert with check (auth.uid() is not null);
create policy "barcodes_delete" on public.flavor_barcodes for delete using (public.is_admin());

-- caught_flavors
drop policy if exists "caught_select" on public.caught_flavors;
drop policy if exists "caught_insert" on public.caught_flavors;
drop policy if exists "caught_delete" on public.caught_flavors;
create policy "caught_select" on public.caught_flavors for select using (true);
create policy "caught_insert" on public.caught_flavors for insert with check (auth.uid() = user_id);
create policy "caught_delete" on public.caught_flavors for delete using (auth.uid() = user_id);

-- locations
drop policy if exists "locations_select" on public.locations;
drop policy if exists "locations_insert" on public.locations;
drop policy if exists "locations_update" on public.locations;
drop policy if exists "locations_delete" on public.locations;
create policy "locations_select" on public.locations for select using (true);
create policy "locations_insert" on public.locations for insert with check (auth.uid() is not null);
create policy "locations_update" on public.locations for update using (public.is_admin());
create policy "locations_delete" on public.locations for delete using (public.is_admin());

-- location_flavors
drop policy if exists "loc_flavors_select" on public.location_flavors;
drop policy if exists "loc_flavors_insert" on public.location_flavors;
create policy "loc_flavors_select" on public.location_flavors for select using (true);
create policy "loc_flavors_insert" on public.location_flavors for insert with check (auth.uid() is not null);

-- friendships
drop policy if exists "friendships_select" on public.friendships;
drop policy if exists "friendships_insert" on public.friendships;
drop policy if exists "friendships_delete" on public.friendships;
create policy "friendships_select" on public.friendships for select using (true);
create policy "friendships_insert" on public.friendships for insert with check (auth.uid() = user_id);
create policy "friendships_delete" on public.friendships for delete using (auth.uid() = user_id);

-- ─── SEED: 61 Flavors ────────────────────────────────────────

insert into public.flavors (id, japanese_name, name, barcode, color, brand, category, sort_order, description) values
(1,  'オリジナルラムネ',          'Original Ramune',            null, '#4FC3F7', 'Hata Kosen', 'standard',  1,   'The classic original ramune'),
(2,  'いちごラムネ',              'Strawberry Ramune',          null, '#E91E8C', 'Hata Kosen', 'standard',  2,   'Sweet strawberry'),
(3,  'メロンラムネ',              'Melon Ramune',               null, '#4CAF50', 'Hata Kosen', 'standard',  3,   'Refreshing melon'),
(4,  'ブルーベリーラムネ',        'Blueberry Ramune',           null, '#5C6BC0', 'Hata Kosen', 'standard',  4,   'Fruity blueberry'),
(5,  'パインラムネ',              'Pineapple Ramune',           null, '#FDD835', 'Hata Kosen', 'standard',  5,   'Tropical pineapple'),
(6,  'ライチラムネ',              'Lychee Ramune',              null, '#F8BBD0', 'Hata Kosen', 'standard',  6,   'Delicate lychee'),
(7,  'オレンジラムネ',            'Orange Ramune',              null, '#FF7043', 'Hata Kosen', 'standard',  7,   'Tangy orange'),
(8,  '白桃ラムネ',                'White Peach Ramune',         null, '#FFAB91', 'Hata Kosen', 'standard',  8,   'Juicy white peach'),
(9,  'グレープラムネ',            'Grape Ramune',               null, '#9C27B0', 'Hata Kosen', 'standard',  9,   'Rich grape'),
(10, 'スイカラムネ',              'Watermelon Ramune',          null, '#F44336', 'Hata Kosen', 'standard',  10,  'Summer watermelon'),
(11, '抹茶ラムネ',                'Matcha Ramune',              null, '#388E3C', 'Hata Kosen', 'standard',  11,  'Earthy matcha green tea'),
(12, 'コーララムネ',              'Cola Ramune',                null, '#3E2723', 'Hata Kosen', 'standard',  12,  'Cola flavored'),
(13, 'ゆずラムネ',                'Yuzu Ramune',                null, '#F9A825', 'Hata Kosen', 'standard',  13,  'Japanese yuzu citrus'),
(14, 'アップルラムネ',            'Apple Ramune',               null, '#8BC34A', 'Hata Kosen', 'standard',  14,  'Crisp apple'),
(15, 'マンゴーラムネ',            'Mango Ramune',               null, '#FF8F00', 'Hata Kosen', 'standard',  15,  'Tropical mango'),
(16, 'もものラムネ',              'Peach Ramune',               null, '#FF8A65', 'Hata Kosen', 'standard',  16,  'Sweet peach'),
(17, 'バナナラムネ',              'Banana Ramune',              null, '#FFF176', 'Hata Kosen', 'standard',  17,  'Sweet banana'),
(18, 'キウイラムネ',              'Kiwi Ramune',                null, '#9CCC65', 'Hata Kosen', 'standard',  18,  'Tangy kiwi'),
(19, 'マスカットラムネ',          'Muscat Grape Ramune',        null, '#C5E1A5', 'Hata Kosen', 'standard',  19,  'Fragrant muscat grape'),
(20, 'ミルクラムネ',              'Milk Ramune',                null, '#B3E5FC', 'Hata Kosen', 'standard',  20,  'Creamy milk flavor'),
(21, 'はちみつレモンラムネ',      'Honey Lemon Ramune',         null, '#FFF59D', 'Hata Kosen', 'standard',  21,  'Sweet honey lemon'),
(22, 'なしラムネ',                'Japanese Pear Ramune',       null, '#DCEDC8', 'Hata Kosen', 'standard',  22,  'Crisp Japanese pear'),
(23, 'キャラメルラムネ',          'Caramel Ramune',             null, '#D4A017', 'Hata Kosen', 'standard',  23,  'Rich caramel'),
(24, 'チェリーラムネ',            'Cherry Ramune',              null, '#C62828', 'Hata Kosen', 'standard',  24,  'Sweet cherry'),
(25, 'レモンラムネ',              'Lemon Ramune',               null, '#FFF9C4', 'Hata Kosen', 'standard',  25,  'Refreshing lemon'),
(26, 'ぶどうラムネ',              'Grape (Purple) Ramune',      null, '#7B1FA2', 'Hata Kosen', 'standard',  26,  'Dark grape'),
(27, 'クリームソーダラムネ',      'Cream Soda Ramune',          null, '#00BCD4', 'Hata Kosen', 'standard',  27,  'Classic cream soda flavor'),
(28, 'コーヒーラムネ',            'Coffee Ramune',              null, '#795548', 'Hata Kosen', 'standard',  28,  'Bold coffee flavor'),
(29, 'チョコレートラムネ',        'Chocolate Ramune',           null, '#5D4037', 'Hata Kosen', 'standard',  29,  'Sweet chocolate'),
(30, 'パッションフルーツラムネ',  'Passion Fruit Ramune',       null, '#FF6F00', 'Hata Kosen', 'standard',  30,  'Tropical passion fruit'),
(31, 'さくらラムネ',              'Sakura Ramune (Limited)',    null, '#F48FB1', 'Hata Kosen', 'limited',   101, 'Cherry blossom seasonal limited'),
(32, 'ハッピーターン味ラムネ',    'Happy Turn Flavor Ramune',  null, '#FFF9C4', 'Hata Kosen', 'limited',   102, 'Collaboration with Happy Turn snack'),
(33, 'みかんラムネ',              'Mandarin Orange Ramune',    null, '#FF8F00', 'Hata Kosen', 'limited',   103, 'Sweet mandarin orange'),
(34, 'りんごラムネ',              'Red Apple Ramune',          null, '#E53935', 'Hata Kosen', 'limited',   104, 'Red apple limited edition'),
(35, 'ピーチラムネ',              'Pink Peach Ramune',         null, '#F8BBD0', 'Hata Kosen', 'limited',   105, 'Pink peach limited'),
(36, 'カシスラムネ',              'Cassis Ramune',             null, '#4A148C', 'Hata Kosen', 'limited',   106, 'Blackcurrant cassis'),
(37, 'たこ焼風ラムネ',            'Takoyaki Style Ramune',     null, '#8D6E63', 'Hata Kosen', 'savory',    201, 'Savory takoyaki flavored ramune'),
(38, 'キムチ風ラムネ',            'Kimchi Style Ramune',       null, '#BF360C', 'Hata Kosen', 'savory',    202, 'Spicy kimchi style'),
(39, 'わさびラムネ',              'Wasabi Ramune',             null, '#2E7D32', 'Hata Kosen', 'savory',    203, 'Hot wasabi flavor'),
(40, 'カレー風ラムネ',            'Curry Style Ramune',        null, '#F57F17', 'Hata Kosen', 'savory',    204, 'Indian curry style'),
(41, 'ピザ味ラムネ',              'Pizza Flavor Ramune',       null, '#EF5350', 'Hata Kosen', 'savory',    205, 'Unique pizza flavored'),
(42, 'うめラムネ',                'Ume (Plum) Ramune',         null, '#BA68C8', 'Hata Kosen', 'savory',    206, 'Sour Japanese plum'),
(43, 'ドラえもんラムネ',                  'Doraemon Ramune',             null, '#1565C0', 'Doraemon', 'doraemon', 301, 'Official Doraemon limited edition original flavor'),
(44, 'ドラえもんラムネ いちご',           'Doraemon Strawberry Ramune',  null, '#E91E63', 'Doraemon', 'doraemon', 302, 'Doraemon limited strawberry'),
(45, 'ドラえもんラムネ りんご',           'Doraemon Apple Ramune',       null, '#8BC34A', 'Doraemon', 'doraemon', 303, 'Doraemon limited apple'),
(46, 'ドラえもんラムネ グレープ',         'Doraemon Grape Ramune',       null, '#7B1FA2', 'Doraemon', 'doraemon', 304, 'Doraemon limited grape'),
(47, 'ドラえもんラムネ オレンジ',         'Doraemon Orange Ramune',      null, '#EF6C00', 'Doraemon', 'doraemon', 305, 'Doraemon limited orange'),
(48, 'ドラえもんラムネ メロン',           'Doraemon Melon Ramune',       null, '#43A047', 'Doraemon', 'doraemon', 306, 'Doraemon limited melon'),
(49, 'ドラえもんラムネ パイン',           'Doraemon Pineapple Ramune',   null, '#FDD835', 'Doraemon', 'doraemon', 307, 'Doraemon limited pineapple'),
(50, 'ドラえもんラムネ スイカ',           'Doraemon Watermelon Ramune',  null, '#F44336', 'Doraemon', 'doraemon', 308, 'Doraemon limited watermelon'),
(51, 'サンガリア ラムネ',         'Sangaria Original Ramune',  null, '#29B6F6', 'Sangaria', 'sangaria', 401, 'Classic Sangaria original ramune'),
(52, 'サンガリア いちごラムネ',   'Sangaria Strawberry Ramune',null, '#E91E63', 'Sangaria', 'sangaria', 402, 'Sangaria strawberry flavor'),
(53, 'サンガリア メロンラムネ',   'Sangaria Melon Ramune',     null, '#4CAF50', 'Sangaria', 'sangaria', 403, 'Sangaria melon flavor'),
(54, 'サンガリア グレープラムネ', 'Sangaria Grape Ramune',     null, '#9C27B0', 'Sangaria', 'sangaria', 404, 'Sangaria grape flavor'),
(55, 'サンガリア ゆずラムネ',     'Sangaria Yuzu Ramune',      null, '#F9A825', 'Sangaria', 'sangaria', 405, 'Sangaria yuzu flavor'),
(56, 'サンガリア マスカットラムネ','Sangaria Muscat Ramune',   null, '#C5E1A5', 'Sangaria', 'sangaria', 406, 'Sangaria muscat flavor'),
(57, 'シラキク ラムネ',           'Shirakiku Original Ramune', null, '#64B5F6', 'Shirakiku', 'other',    501, 'Shirakiku brand classic ramune'),
(58, 'シラキク いちごラムネ',     'Shirakiku Strawberry Ramune',null,'#F06292', 'Shirakiku', 'other',    502, 'Shirakiku strawberry'),
(59, 'シラキク メロンラムネ',     'Shirakiku Melon Ramune',    null, '#66BB6A', 'Shirakiku', 'other',    503, 'Shirakiku melon'),
(60, 'ニッスイ ラムネ',           'Nissui Original Ramune',    null, '#4FC3F7', 'Nissui',    'other',    504, 'Nissui brand ramune'),
(61, 'アサヒ ラムネ',             'Asahi Ramune',              null, '#42A5F5', 'Asahi',     'other',    505, 'Asahi brand ramune')
on conflict (id) do nothing;

select setval('public.flavors_id_seq', (select max(id) from public.flavors));

-- ─── SEED: 17 Alternate Barcodes ─────────────────────────────

insert into public.flavor_barcodes (flavor_id, barcode, region, added_by) values
(3,  '8718053594743', 'EU', 'system'),
(4,  '4902494110042', 'JP', 'system'),
(6,  '8718053594736', 'EU', 'system'),
(6,  '4902494190334', 'JP', 'system'),
(8,  '4902494210070', 'JP', 'system'),
(9,  '4902494210209', 'JP', 'system'),
(10, '4902494130002', 'JP', 'system'),
(11, '4902494160085', 'JP', 'system'),
(12, '4902494250618', 'JP', 'system'),
(13, '4902494190358', 'JP', 'system'),
(14, '4902494230047', 'JP', 'system'),
(15, '074601176266',  'US', 'system'),
(17, '074601176280',  'US', 'system'),
(18, '074601176334',  'US', 'system'),
(19, '074601176297',  'US', 'system'),
(19, '4902494210186', 'JP', 'system'),
(22, '4901742201785', 'JP', 'system')
on conflict (barcode) do nothing;

-- ─── AFTER SIGN-UP: make yourself admin ──────────────────────
-- Run this AFTER you create your account in the app:
--   UPDATE public.profiles SET is_admin = true WHERE username = 'your_username';
