-- Security baseline: make report views obey the caller's table permissions/RLS.
alter view public.v_school_exam_summary set (security_invoker = true);
alter view public.v_student_exam_summary set (security_invoker = true);
alter view public.v_subject_exam_summary set (security_invoker = true);
alter view public.v_student_enrollment_detail set (security_invoker = true);

-- Pin function resolution to the intended schema to prevent search-path hijacking.
alter function public.kira_gred() set search_path = public;
alter function public.create_next_year_class() set search_path = public;
alter function public.set_school_module_access_updated_at() set search_path = public;
alter function public.set_optional_module_updated_at() set search_path = public;
