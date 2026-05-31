create table if not exists canvas_strokes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  layer_type text not null check (layer_type in ('background', 'overlay')),
  tool text not null check (tool in ('pencil', 'brush', 'eraser')),
  color text not null default '#ffffff',
  size numeric not null default 4,
  opacity numeric not null default 1 check (opacity >= 0 and opacity <= 1),
  brush_intensity numeric not null default 1 check (brush_intensity >= 0 and brush_intensity <= 1),
  brush_softness numeric not null default 0.25 check (brush_softness >= 0 and brush_softness <= 1),
  brush_smoothing numeric not null default 0.35 check (brush_smoothing >= 0 and brush_smoothing <= 1),
  points jsonb not null,
  created_at timestamp with time zone default now()
);

alter table canvas_strokes
add column if not exists brush_intensity numeric not null default 1 check (brush_intensity >= 0 and brush_intensity <= 1),
add column if not exists brush_softness numeric not null default 0.25 check (brush_softness >= 0 and brush_softness <= 1),
add column if not exists brush_smoothing numeric not null default 0.35 check (brush_smoothing >= 0 and brush_smoothing <= 1);

alter table canvas_strokes enable row level security;

drop policy if exists "canvas_strokes_select_all" on canvas_strokes;
drop policy if exists "canvas_strokes_insert_all" on canvas_strokes;
drop policy if exists "canvas_strokes_delete_all" on canvas_strokes;

create policy "canvas_strokes_select_all"
on canvas_strokes for select
using (true);

create policy "canvas_strokes_insert_all"
on canvas_strokes for insert
with check (true);

create policy "canvas_strokes_delete_all"
on canvas_strokes for delete
using (true);

alter publication supabase_realtime add table canvas_strokes;
