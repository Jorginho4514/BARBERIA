create table citas (
  id bigint generated always as identity primary key,
  fecha text not null,
  hora text not null,
  servicio text,
  nombre text,
  telefono text,
  estado text not null default 'reservada',
  unique (fecha, hora)
);
alter table citas enable row level security;
create policy "acceso publico" on citas for all to anon using (true) with check (true);
