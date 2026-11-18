-- Banco do jogo IES DAY no Supabase.
-- Cole tudo no SQL Editor do Supabase e clique em Run (pode rodar de novo sem problema).
-- A API (api/jogo.js) chama ies_pipe por HTTPS, com a chave secreta (service_role),
-- e executa vários comandos numa transação só.

create table if not exists public.ies_kv (
  k text primary key,
  v jsonb not null,
  expira timestamptz
);
alter table public.ies_kv enable row level security; -- sem políticas: só a chave secreta acessa

create or replace function public.ies_lista(l jsonb, ini int, fim int)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(e order by i), '[]'::jsonb)
  from jsonb_array_elements(coalesce(l, '[]'::jsonb)) with ordinality t(e, i)
  where i - 1 between ini and fim
$$;

create or replace function public.ies_pipe(cmds jsonb)
returns jsonb language plpgsql as $$
declare
  c jsonb;
  op text;
  chave text;
  atual jsonb;
  res jsonb;
  saida jsonb := '[]'::jsonb;
  n bigint;
  i int;
  px bigint;
  nx boolean;
begin
  for c in select value from jsonb_array_elements(cmds) loop
    op := upper(c->>0);
    chave := c->>1;
    delete from ies_kv where k = chave and expira <= now();
    res := null;
    case op
      when 'GET' then
        select case when jsonb_typeof(v) = 'string' then v end into res from ies_kv where k = chave;
      when 'SET' then
        nx := false; px := null;
        for i in 3 .. jsonb_array_length(c) - 1 loop
          if upper(c->>i) = 'NX' then nx := true; end if;
          if upper(c->>i) = 'PX' then px := (c->>(i + 1))::bigint; end if;
        end loop;
        if nx then
          insert into ies_kv (k, v, expira)
          values (chave, c->2, case when px is not null then now() + px * interval '1 millisecond' end)
          on conflict (k) do nothing;
          if found then res := '"OK"'; end if;
        else
          insert into ies_kv (k, v, expira)
          values (chave, c->2, case when px is not null then now() + px * interval '1 millisecond' end)
          on conflict (k) do update set v = excluded.v, expira = excluded.expira;
          res := '"OK"';
        end if;
      when 'INCR' then
        insert into ies_kv (k, v) values (chave, '"1"')
        on conflict (k) do update set v = to_jsonb(((ies_kv.v #>> '{}')::bigint + 1)::text)
        returning (v #>> '{}')::bigint into n;
        res := to_jsonb(n);
      when 'DEL' then
        delete from ies_kv where k in (select value #>> '{}' from jsonb_array_elements(c) with ordinality t(value, p) where p > 1);
        get diagnostics n = row_count;
        res := to_jsonb(n);
      when 'HGET' then
        select v -> (c->>2) into res from ies_kv where k = chave and jsonb_typeof(v) = 'object';
      when 'HSET' then
        insert into ies_kv (k, v) values (chave, '{}') on conflict (k) do nothing;
        select v into atual from ies_kv where k = chave for update;
        update ies_kv set v = v || jsonb_build_object(c->>2, c->3) where k = chave;
        res := to_jsonb(case when atual ? (c->>2) then 0 else 1 end);
      when 'HGETALL' then
        select v into res from ies_kv where k = chave and jsonb_typeof(v) = 'object';
        res := coalesce(res, '{}');
      when 'HLEN' then
        select count(*) into n from ies_kv, jsonb_object_keys(v) where k = chave and jsonb_typeof(v) = 'object';
        res := to_jsonb(coalesce(n, 0));
      when 'LPUSH' then
        insert into ies_kv (k, v) values (chave, '[]') on conflict (k) do nothing;
        for i in 2 .. jsonb_array_length(c) - 1 loop
          update ies_kv set v = jsonb_build_array(c->i) || v where k = chave;
        end loop;
        select jsonb_array_length(v) into n from ies_kv where k = chave;
        res := to_jsonb(n);
      when 'LTRIM' then
        update ies_kv set v = ies_lista(v, (c->>2)::int, (c->>3)::int) where k = chave and jsonb_typeof(v) = 'array';
        res := '"OK"';
      when 'LRANGE' then
        select ies_lista(v, (c->>2)::int, (c->>3)::int) into res from ies_kv where k = chave and jsonb_typeof(v) = 'array';
        res := coalesce(res, '[]');
      else
        raise exception 'Comando não suportado: %', op;
    end case;
    saida := saida || jsonb_build_array(res);
  end loop;
  return saida;
end
$$;

-- só o servidor (chave secreta) pode chamar; a chave pública (anon) não acessa nada
revoke all on function public.ies_pipe(jsonb) from public, anon, authenticated;
grant execute on function public.ies_pipe(jsonb) to service_role;
revoke all on table public.ies_kv from anon, authenticated;
grant all on table public.ies_kv to service_role;
