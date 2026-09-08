begin;

-- Akaun sedia ada mungkin mempunyai senarai menu tersimpan sebelum modul
-- Percubaan UPKK diperkenalkan. Tambahkan kunci navigasi baharu tanpa
-- menukar senarai menu lain. Penapisan school_module_access masih menentukan
-- sama ada sekolah dibenarkan melihat dan menggunakan modul ini.
update public.app_users
set allowed_nav = array_append(allowed_nav, 'upkkTrial')
where status = 'AKTIF'
  and role in ('ADMIN_DAERAH', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK')
  and allowed_nav is not null
  and not ('upkkTrial' = any(allowed_nav));

commit;

select count(*) as akaun_dengan_menu_percubaan_upkk
from public.app_users
where allowed_nav is null
   or 'upkkTrial' = any(allowed_nav);
