-- These staging, legacy, and internal tables intentionally have no direct caller access.
-- Explicit false policies document that design and keep security audits unambiguous.

create policy registration_attempts_explicit_deny
  on private.registration_attempts for all to public
  using (false) with check (false);

create policy import_guru_explicit_deny
  on public.import_byp7010_guru_app_users for all to public
  using (false) with check (false);

create policy import_students_explicit_deny
  on public.import_byp7010_students for all to public
  using (false) with check (false);

create policy psra_trial_marks_explicit_deny
  on public.psra_trial_marks for all to public
  using (false) with check (false);
