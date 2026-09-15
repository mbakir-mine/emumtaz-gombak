begin;

do $$
declare
  target_mark public.marks%rowtype;
  was_blocked boolean := false;
begin
  select * into target_mark from public.marks order by id limit 1;
  if target_mark.id is null then
    raise exception 'Ujian memerlukan sekurang-kurangnya satu rekod markah';
  end if;

  insert into public.mark_submission_workflows (
    kod_sekolah, exam_id, class_id, kod_subjek, status, updated_by
  ) values (
    target_mark.kod_sekolah, target_mark.exam_id, target_mark.class_id,
    target_mark.kod_subjek, 'DIHANTAR', gen_random_uuid()
  )
  on conflict (kod_sekolah, exam_id, class_id, kod_subjek)
  do update set status = 'DIHANTAR';

  begin
    update public.marks set markah = markah where id = target_mark.id;
  exception when others then
    was_blocked := position('Markah tidak boleh diubah' in sqlerrm) > 0;
  end;

  if not was_blocked then
    raise exception 'Trigger gagal menghalang edit markah yang telah dihantar';
  end if;

  insert into public.report_verifications (
    reference_number, report_type, scope_label, snapshot_hash, issued_by
  ) values (
    concat('TEST-', replace(gen_random_uuid()::text, '-', '')),
    'Ujian laporan', 'Skop ujian transaksi', repeat('a', 64), gen_random_uuid()
  );
end;
$$;

rollback;

select 'mark workflow lock and report audit triggers passed; transaction rolled back' as result;
