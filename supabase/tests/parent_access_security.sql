begin;

do $$
declare
  target_student public.students%rowtype;
  code_id uuid;
begin
  select * into target_student from public.students where status = 'AKTIF' order by id limit 1;
  if target_student.id is null then raise exception 'Ujian memerlukan murid aktif'; end if;

  insert into public.parent_access_codes (
    student_id, kod_sekolah, code_hash, expires_at, created_by
  ) values (
    target_student.id, target_student.kod_sekolah, repeat('a', 64), now() + interval '1 day', gen_random_uuid()
  ) returning id into code_id;

  insert into public.parent_access_sessions (
    access_code_id, student_id, kod_sekolah, token_hash, expires_at
  ) values (
    code_id, target_student.id, target_student.kod_sekolah, repeat('b', 64), now() + interval '30 minutes'
  );

  insert into public.parent_access_events (
    kod_sekolah, student_id, event_type, identifier_hash, network_hash
  ) values (
    target_student.kod_sekolah, target_student.id, 'BERJAYA', repeat('c', 64), repeat('d', 64)
  );
end;
$$;

rollback;

select 'parent access constraints and audit trigger passed; transaction rolled back' as result;
