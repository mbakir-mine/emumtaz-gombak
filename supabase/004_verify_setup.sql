-- e-Mumtaz Gombak setup verification

select 'schools' as item, count(*) as total from schools
union all
select 'app_users', count(*) from app_users
union all
select 'subjects', count(*) from subjects
union all
select 'subject_grade_rules', count(*) from subject_grade_rules
union all
select 'exams', count(*) from exams
union all
select 'classes', count(*) from classes
union all
select 'students', count(*) from students
union all
select 'marks', count(*) from marks;

select key, value, description
from system_settings
order by key;

select role, count(*) as total
from app_users
group by role
order by role;
