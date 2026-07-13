'use client';

import { useActionState, useMemo, useState } from 'react';
import type {
  ClassRecord,
  School,
  SubjectRecord,
  SubjectComponentRecord,
  TakwimEvent,
  TeacherSubjectAssignment,
  TeacherSubjectComponentAssignment,
  TimetableEntry,
  TimetableRequirement,
  TimetableSlot,
  UserRecord,
} from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeUsers } from '../ui/scopedData';
import {
  addTimetableSlotSetting,
  deleteTimetableSlotSetting,
  generateAutoTimetable,
  generateDefaultTimetableSlots,
  saveTimetableSlotSettings,
  saveTimetableRequirements,
  type TimetableActionState,
} from './actions';

const initialState: TimetableActionState = { ok: false, message: '' };
const days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

function compactTimeRange(slot: Pick<TimetableSlot, 'waktu_mula' | 'waktu_tamat'>) {
  const format = (value: string) => value.slice(0, 5).replace(/^0/, '').replace(':', '.');
  return `${format(slot.waktu_mula)} - ${format(slot.waktu_tamat)}`;
}

function isTeachingSlot(slot: TimetableSlot) {
  return !(slot.label ?? '').toUpperCase().includes('REHAT');
}

function breakLabel(dayIndex: number) {
  return 'REHAT'[dayIndex] ?? 'R';
}

function yearOptions(classes: ClassRecord[]) {
  return [...new Set(classes.map((item) => item.tahun_akademik))].sort((a, b) => b - a);
}

export default function TimetableManager({
  schools,
  classes,
  subjects,
  users,
  slots,
  entries,
  requirements,
  subjectAssignments,
  componentAssignments,
  subjectComponents,
  takwimEvents,
}: {
  schools: School[];
  classes: ClassRecord[];
  subjects: SubjectRecord[];
  users: UserRecord[];
  slots: TimetableSlot[];
  entries: TimetableEntry[];
  requirements: TimetableRequirement[];
  subjectAssignments: TeacherSubjectAssignment[];
  componentAssignments: TeacherSubjectComponentAssignment[];
  subjectComponents: SubjectComponentRecord[];
  takwimEvents: TakwimEvent[];
}) {
  const profile = useAccessProfile();
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedUsers = useMemo(() => scopeUsers(profile, users, schools), [profile, schools, users]);
  const [selectedSchool, setSelectedSchool] = useState(profile?.kod_sekolah ?? scopedSchools[0]?.kod_sekolah ?? '');
  const schoolClasses = scopedClasses
    .filter((item) => item.kod_sekolah === selectedSchool && item.status === 'AKTIF')
    .sort((a, b) => a.tahun_akademik - b.tahun_akademik || a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas));
  const years = yearOptions(schoolClasses);
  const [selectedYear, setSelectedYear] = useState(years[0] ?? new Date().getFullYear());
  const yearClasses = schoolClasses.filter((item) => item.tahun_akademik === selectedYear);
  const [selectedClass, setSelectedClass] = useState(yearClasses[0]?.id ?? '');
  const [scheduleView, setScheduleView] = useState<'kelas' | 'guru' | 'induk'>('kelas');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const selectedClassRecord = yearClasses.find((item) => item.id === selectedClass) ?? yearClasses[0] ?? null;
  const schoolSlots = slots
    .filter((slot) => slot.kod_sekolah === selectedSchool)
    .sort((a, b) => days.indexOf(a.hari) - days.indexOf(b.hari) || a.susunan - b.susunan || a.waktu_mula.localeCompare(b.waktu_mula));
  const slotSettings = useMemo(() => {
    const byOrder = new Map<number, TimetableSlot>();
    schoolSlots.forEach((slot) => {
      if (!byOrder.has(slot.susunan)) {
        byOrder.set(slot.susunan, slot);
      }
    });
    return [...byOrder.values()].sort((a, b) => a.susunan - b.susunan || a.waktu_mula.localeCompare(b.waktu_mula));
  }, [schoolSlots]);
  const slotColumns = useMemo(() => {
    const byTime = new Map<string, TimetableSlot>();
    schoolSlots.forEach((slot) => {
      const key = `${slot.susunan}|${slot.waktu_mula}|${slot.waktu_tamat}`;
      if (!byTime.has(key)) {
        byTime.set(key, slot);
      }
    });

    return [...byTime.entries()]
      .map(([key, slot]) => ({ key, slot }))
      .sort((a, b) => a.slot.susunan - b.slot.susunan || a.slot.waktu_mula.localeCompare(b.slot.waktu_mula));
  }, [schoolSlots]);
  const slotByDayAndColumn = useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    schoolSlots.forEach((slot) => {
      const columnKey = `${slot.susunan}|${slot.waktu_mula}|${slot.waktu_tamat}`;
      map.set(`${slot.hari}|${columnKey}`, slot);
    });
    return map;
  }, [schoolSlots]);
  const teachingSlots = schoolSlots.filter(isTeachingSlot);
  const classEntries = entries.filter((entry) => entry.class_id === selectedClass);
  const entryBySlot = new Map(classEntries.map((entry) => [entry.slot_id, entry]));
  const subjectMap = new Map(subjects.map((subject) => [subject.kod_subjek, subject.nama_subjek]));
  const userMap = new Map(scopedUsers.map((user) => [user.id, user.nama]));
  const classMap = new Map(yearClasses.map((item) => [item.id, item]));
  const teachers = scopedUsers
    .filter(
      (user) =>
        ['GURU_KELAS', 'GURU_SUBJEK', 'ADMIN_SEKOLAH'].includes(user.role) &&
        user.status === 'AKTIF' &&
        user.kod_sekolah === selectedSchool,
    )
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const classRequirements = requirements
    .filter((requirement) => requirement.class_id === selectedClass)
    .sort((a, b) =>
      (a.nama_paparan ?? subjectMap.get(a.kod_subjek) ?? a.kod_subjek).localeCompare(
        b.nama_paparan ?? subjectMap.get(b.kod_subjek) ?? b.kod_subjek,
      ),
    );
  const schoolYearClassIds = new Set(yearClasses.map((item) => item.id));
  const schoolYearRequirements = requirements.filter((requirement) => schoolYearClassIds.has(requirement.class_id));
  const schoolYearEntries = entries.filter((entry) => schoolYearClassIds.has(entry.class_id));
  const selectedTeacherId = teachers.some((teacher) => teacher.id === selectedTeacher)
    ? selectedTeacher
    : teachers[0]?.id || '';
  const teacherEntries = schoolYearEntries.filter((entry) => entry.teacher_id === selectedTeacherId);
  const teacherEntryGroups = new Map<string, TimetableEntry[]>();
  teacherEntries.forEach((entry) => {
    const group = teacherEntryGroups.get(entry.slot_id) ?? [];
    group.push(entry);
    teacherEntryGroups.set(entry.slot_id, group);
  });
  const masterEntryGroups = new Map<string, TimetableEntry[]>();
  schoolYearEntries.forEach((entry) => {
    const group = masterEntryGroups.get(entry.slot_id) ?? [];
    group.push(entry);
    masterEntryGroups.set(entry.slot_id, group);
  });
  const classesWithRequirements = new Set(schoolYearRequirements.map((requirement) => requirement.class_id));
  const completeClassCount = yearClasses.filter((item) => classesWithRequirements.has(item.id)).length;
  const incompleteClassCount = Math.max(0, yearClasses.length - completeClassCount);
  const totalRequiredSlots = schoolYearRequirements.reduce((sum, item) => sum + item.bil_slot_seminggu, 0);
  const schoolYearTakwimEvents = takwimEvents
    .filter(
      (event) =>
        event.tahun_akademik === selectedYear &&
        (event.scope === 'DAERAH' || event.kod_sekolah === selectedSchool),
    )
    .sort((a, b) => a.tarikh_mula.localeCompare(b.tarikh_mula));
  const [slotState, slotAction] = useActionState(generateDefaultTimetableSlots, initialState);
  const [slotSettingState, slotSettingAction] = useActionState(saveTimetableSlotSettings, initialState);
  const [slotAddState, slotAddAction] = useActionState(addTimetableSlotSetting, initialState);
  const [slotDeleteState, slotDeleteAction] = useActionState(deleteTimetableSlotSetting, initialState);
  const [requirementState, requirementAction] = useActionState(saveTimetableRequirements, initialState);
  const [autoState, autoAction] = useActionState(generateAutoTimetable, initialState);
  const canChangeSchool = profile?.role === 'OWNER';
  const componentsBySubject = useMemo(() => {
    const map = new Map<string, SubjectComponentRecord[]>();
    subjectComponents
      .filter((component) => component.status === 'AKTIF')
      .forEach((component) => {
        const list = map.get(component.kod_subjek) ?? [];
        list.push(component);
        map.set(component.kod_subjek, list.sort((left, right) => left.susunan - right.susunan));
      });
    return map;
  }, [subjectComponents]);
  const selectedClassSubjectAssignments = subjectAssignments.filter((assignment) => assignment.class_id === selectedClass);
  const selectedClassComponentAssignments = componentAssignments.filter((assignment) => assignment.class_id === selectedClass);
  const componentParentSubjects = new Set(selectedClassComponentAssignments.map((assignment) => assignment.kod_subjek));
  const requirementSources = [
    ...selectedClassSubjectAssignments
      .filter((assignment) => !componentParentSubjects.has(assignment.kod_subjek))
      .map((assignment) => ({
        key: `${assignment.kod_subjek}||${assignment.assignment_label ?? ''}`,
        kod_subjek: assignment.kod_subjek,
        kod_komponen: '',
        assignment_label: assignment.assignment_label ?? '',
        nama_paparan: assignment.assignment_label || subjectMap.get(assignment.kod_subjek) || assignment.kod_subjek,
        teacher_id: assignment.user_id,
        teacher_name: userMap.get(assignment.user_id) ?? assignment.users?.nama ?? '-',
        sub_note: assignment.assignment_label ? subjectMap.get(assignment.kod_subjek) ?? assignment.kod_subjek : 'Subjek',
      })),
    ...selectedClassComponentAssignments.map((assignment) => {
      const component = (componentsBySubject.get(assignment.kod_subjek) ?? []).find(
        (item) => item.kod_komponen === assignment.kod_komponen,
      );
      return {
        key: `${assignment.kod_subjek}|${assignment.kod_komponen}|`,
        kod_subjek: assignment.kod_subjek,
        kod_komponen: assignment.kod_komponen,
        assignment_label: '',
        nama_paparan: component?.nama_komponen ?? assignment.kod_komponen,
        teacher_id: assignment.user_id,
        teacher_name: userMap.get(assignment.user_id) ?? assignment.users?.nama ?? '-',
        sub_note: subjectMap.get(assignment.kod_subjek) ?? assignment.kod_subjek,
      };
    }),
  ].sort((a, b) => a.nama_paparan.localeCompare(b.nama_paparan));
  const requirementByKey = new Map(
    classRequirements.map((requirement) => [
      `${requirement.kod_subjek}|${requirement.kod_komponen ?? ''}|${requirement.assignment_label ?? ''}`,
      requirement,
    ]),
  );
  const scheduleTabs = [
    { id: 'kelas', label: 'Jadual Kelas' },
    { id: 'guru', label: 'Jadual Individu Guru' },
    { id: 'induk', label: 'Jadual Induk Sekolah' },
  ] as const;
  const selectedTeacherName = selectedTeacherId ? userMap.get(selectedTeacherId) ?? 'Guru' : 'Guru';
  const scheduleTitle =
    scheduleView === 'kelas'
      ? selectedClassRecord
        ? `Jadual Kelas ${classLabel(selectedClassRecord)} ${selectedClassRecord.tahun_akademik}`
        : 'Jadual Kelas'
      : scheduleView === 'guru'
        ? `Jadual Individu Guru ${selectedTeacherName} ${selectedYear}`
        : `Jadual Induk Sekolah ${selectedYear}`;
  const scheduleCount =
    scheduleView === 'kelas' ? classEntries.length : scheduleView === 'guru' ? teacherEntries.length : schoolYearEntries.length;

  function updateSchool(kodSekolah: string) {
    const nextClasses = scopedClasses
      .filter((item) => item.kod_sekolah === kodSekolah && item.status === 'AKTIF')
      .sort((a, b) => a.tahun_akademik - b.tahun_akademik || a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas));
    const nextYear = yearOptions(nextClasses)[0] ?? new Date().getFullYear();
    setSelectedSchool(kodSekolah);
    setSelectedYear(nextYear);
    setSelectedClass(nextClasses.find((item) => item.tahun_akademik === nextYear)?.id ?? '');
    setSelectedTeacher('');
  }

  function updateYear(tahun: number) {
    setSelectedYear(tahun);
    setSelectedClass(schoolClasses.find((item) => item.tahun_akademik === tahun)?.id ?? '');
  }

  return (
    <section className="panel optional-module-panel">
      <div className="panel-head">
        <div>
          <h2>Jadual Waktu Automatik</h2>
          <p className="table-note">
            Sistem menjana jadual semua kelas aktif dalam tahun akademik dipilih dan mengelakkan pertembungan guru.
          </p>
        </div>
        <span>{schoolYearEntries.length} / {totalRequiredSlots} slot dijana</span>
      </div>

      <div className="timetable-scope-summary">
        <div>
          <span>Kelas aktif</span>
          <strong>{yearClasses.length}</strong>
        </div>
        <div>
          <span>Kelas ada tetapan</span>
          <strong>{completeClassCount}</strong>
        </div>
        <div>
          <span>Belum lengkap</span>
          <strong>{incompleteClassCount}</strong>
        </div>
        <div>
          <span>Slot mengajar sehari</span>
          <strong>{teachingSlots.length / days.length || 0}</strong>
        </div>
      </div>

      <div className="module-toolbar timetable-auto-toolbar">
        <label>
          Sekolah
          <select value={selectedSchool} onChange={(event) => updateSchool(event.target.value)} disabled={!canChangeSchool}>
            {scopedSchools.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tahun Akademik
          <select value={selectedYear} onChange={(event) => updateYear(Number(event.target.value))}>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kelas Paparan
          <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
            <option value="">Pilih kelas</option>
            {yearClasses.map((item) => (
              <option key={item.id} value={item.id}>
                {classLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="timetable-action-row">
        <form action={slotAction}>
          <input type="hidden" name="kod_sekolah" value={selectedSchool} />
          <button className="button soft" type="submit">
            SEDIAKAN SLOT MASA
          </button>
        </form>
        <form action={autoAction}>
          <input type="hidden" name="kod_sekolah" value={selectedSchool} />
          <input type="hidden" name="tahun_akademik" value={selectedYear} />
          <button className="button" type="submit" disabled={schoolYearRequirements.length === 0 || teachingSlots.length === 0}>
            JANA JADUAL SEMUA KELAS
          </button>
        </form>
      </div>
      <p className="table-note timetable-scope-note">
        Kelas paparan hanya untuk semakan jadual dan tetapan masa subjek kelas tersebut. Butang jana akan menyusun semua kelas
        yang mempunyai tetapan subjek dalam sesi {selectedYear}.
      </p>
      {schoolYearTakwimEvents.length > 0 && (
        <div className="module-context-note">
          <strong>Rujukan Takwim:</strong>
          <span>{schoolYearTakwimEvents.filter((event) => event.kategori === 'CUTI').length} cuti</span>
          <span>{schoolYearTakwimEvents.filter((event) => event.kategori === 'PEPERIKSAAN').length} peperiksaan</span>
          <span>
            {schoolYearTakwimEvents.filter((event) => ['PROGRAM', 'AKTIVITI', 'MESYUARAT'].includes(event.kategori)).length}{' '}
            program/aktiviti
          </span>
        </div>
      )}
      {slotState.message && <p className={slotState.ok ? 'form-success' : 'form-message'}>{slotState.message}</p>}
      {autoState.message && <p className={autoState.ok ? 'form-success' : 'form-message'}>{autoState.message}</p>}

      {slotSettings.length > 0 && (
        <div className="timetable-slot-settings">
          <form id="timetable-slot-save-form" action={slotSettingAction} className="hidden-form">
            <input type="hidden" name="kod_sekolah" value={selectedSchool} />
          </form>
          <div className="panel-head compact-head">
            <div>
              <h3>Tetapan Waktu Slot Masa</h3>
              <p className="table-note">Susun label, waktu mula dan waktu tamat bagi jadual sekolah.</p>
            </div>
            <div className="timetable-slot-head-actions">
              <strong>{slotSettings.length} slot</strong>
              <form action={slotAddAction}>
                <input type="hidden" name="kod_sekolah" value={selectedSchool} />
                <button className="button soft" type="submit">
                  TAMBAH SLOT
                </button>
              </form>
            </div>
          </div>
          <div className="table-scroll">
            <table className="compact-table timetable-slot-table">
              <thead>
                <tr>
                  <th>Bil</th>
                  <th>Label</th>
                  <th>Waktu Mula</th>
                  <th>Waktu Tamat</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {slotSettings.map((slot, index) => (
                  <tr key={slot.susunan}>
                    <td>{index + 1}</td>
                    <td>
                      <input form="timetable-slot-save-form" type="hidden" name="slot_susunan" value={slot.susunan} />
                      <input form="timetable-slot-save-form" name="slot_label" defaultValue={slot.label ?? `Masa ${slot.susunan}`} />
                    </td>
                    <td>
                      <input
                        form="timetable-slot-save-form"
                        name="slot_waktu_mula"
                        type="time"
                        defaultValue={slot.waktu_mula.slice(0, 5)}
                      />
                    </td>
                    <td>
                      <input
                        form="timetable-slot-save-form"
                        name="slot_waktu_tamat"
                        type="time"
                        defaultValue={slot.waktu_tamat.slice(0, 5)}
                      />
                    </td>
                    <td>
                      <form action={slotDeleteAction} className="timetable-slot-delete-form">
                        <input type="hidden" name="kod_sekolah" value={selectedSchool} />
                        <input type="hidden" name="slot_susunan_target" value={slot.susunan} />
                        <button className="button danger soft" type="submit" disabled={slotSettings.length <= 1}>
                          BUANG
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="button" type="submit" form="timetable-slot-save-form">
            SIMPAN WAKTU SLOT
          </button>
          {slotSettingState.message && (
            <p className={slotSettingState.ok ? 'form-success' : 'form-message'}>{slotSettingState.message}</p>
          )}
          {slotAddState.message && <p className={slotAddState.ok ? 'form-success' : 'form-message'}>{slotAddState.message}</p>}
          {slotDeleteState.message && (
            <p className={slotDeleteState.ok ? 'form-success' : 'form-message'}>{slotDeleteState.message}</p>
          )}
        </div>
      )}

      <form action={requirementAction} className="timetable-requirement-form timetable-requirement-bulk">
          <input type="hidden" name="kod_sekolah" value={selectedSchool} />
          <input type="hidden" name="class_id" value={selectedClass} />
          <div className="panel-head compact-head">
            <div>
            <h3>{selectedClassRecord ? `Tetapan Masa Subjek ${classLabel(selectedClassRecord)}` : 'Tetapan Masa Subjek Kelas'}</h3>
            <p className="table-note">
              Senarai ini diambil daripada tetapan Guru Kelas & Guru Subjek. Isi bilangan masa dan pilihan gabung dua masa sahaja.
            </p>
          </div>
          <strong>{classRequirements.reduce((sum, item) => sum + item.bil_slot_seminggu, 0)} masa</strong>
        </div>

        {requirementSources.length === 0 ? (
          <p className="empty">
            Belum ada tetapan guru subjek untuk kelas ini. Tetapkan guru subjek dahulu di menu Guru Kelas & Guru Subjek.
          </p>
        ) : (
          <>
            <div className="table-scroll">
              <table className="compact-table timetable-requirement-table">
                <thead>
                  <tr>
                    <th>Bil</th>
                    <th>Subjek</th>
                    <th>Guru</th>
                    <th>Bilangan Masa</th>
                    <th>Gabung 2 Masa</th>
                  </tr>
                </thead>
                <tbody>
                  {requirementSources.map((source, index) => {
                    const saved = requirementByKey.get(source.key);
                    return (
                      <tr key={source.key}>
                        <td>{index + 1}</td>
                        <td>
                          <input type="hidden" name="requirement_kod_subjek" value={source.kod_subjek} />
                          <input type="hidden" name="requirement_kod_komponen" value={source.kod_komponen} />
                          <input type="hidden" name="requirement_assignment_label" value={source.assignment_label} />
                          <input type="hidden" name="requirement_nama_paparan" value={source.nama_paparan} />
                          <strong>{source.nama_paparan}</strong>
                          <small>{source.sub_note}</small>
                        </td>
                        <td>
                          <input type="hidden" name="requirement_teacher_id" value={source.teacher_id} />
                          {source.teacher_name}
                        </td>
                        <td>
                          <input
                            className="compact-number-input"
                            name="requirement_bil_slot"
                            type="number"
                            min="0"
                            max="40"
                            defaultValue={saved?.bil_slot_seminggu ?? 4}
                          />
                        </td>
                        <td>
                          <select name="requirement_boleh_gabung" defaultValue={saved?.boleh_gabung ? 'YA' : 'TIDAK'}>
                            <option value="TIDAK">Tidak</option>
                            <option value="YA">Ya</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button className="button" type="submit" disabled={!selectedClass}>
              SIMPAN TETAPAN
            </button>
          </>
        )}
        {requirementState.message && (
          <p className={requirementState.ok ? 'form-success' : 'form-message'}>{requirementState.message}</p>
        )}
      </form>

      <div className="panel-head module-subhead">
        <div>
          <h2>{scheduleTitle}</h2>
          <p className="table-note">Jadual di bawah dijana oleh sistem berdasarkan tetapan subjek dan guru.</p>
        </div>
        <span>{scheduleCount} slot diisi</span>
      </div>

      <div className="timetable-view-tabs" role="tablist" aria-label="Paparan jadual waktu">
        {scheduleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={scheduleView === tab.id ? 'active' : ''}
            onClick={() => setScheduleView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {scheduleView === 'guru' && (
        <div className="timetable-view-toolbar">
          <label>
            Guru
            <select value={selectedTeacherId} onChange={(event) => setSelectedTeacher(event.target.value)}>
              {teachers.length === 0 ? (
                <option value="">Tiada guru aktif</option>
              ) : (
                teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.nama}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
      )}

      {schoolSlots.length === 0 ? (
        <p className="empty">Belum ada slot masa. Klik SEDIAKAN SLOT MASA dahulu.</p>
      ) : (
        <div className="table-scroll">
          <table className="timetable-matrix">
            <thead>
              <tr>
                <th>Hari/Masa</th>
                {slotColumns.map(({ key, slot }) => (
                  <th key={key}>{compactTimeRange(slot)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) => {
                return (
                  <tr key={day}>
                    <th>{day.charAt(0) + day.slice(1).toLowerCase()}</th>
                    {slotColumns.map(({ key }) => {
                      const slot = slotByDayAndColumn.get(`${day}|${key}`);
                      const isBreak = slot ? !isTeachingSlot(slot) : false;
                      const slotEntries =
                        !slot || isBreak
                          ? []
                          : scheduleView === 'kelas'
                            ? entryBySlot.get(slot.id)
                              ? [entryBySlot.get(slot.id) as TimetableEntry]
                              : []
                            : scheduleView === 'guru'
                              ? teacherEntryGroups.get(slot.id) ?? []
                              : masterEntryGroups.get(slot.id) ?? [];

                      return (
                        <td key={`${day}|${key}`} className={isBreak ? 'timetable-matrix-break' : undefined}>
                          {isBreak ? (
                            <strong>{breakLabel(dayIndex)}</strong>
                          ) : slotEntries.length > 0 ? (
                            <div className="timetable-cell-list">
                              {slotEntries.map((entry) => {
                                const entrySubjectCode = entry.kod_subjek ?? '';
                                const subjectLabel =
                                  entry.nama_paparan ||
                                  (entrySubjectCode ? subjectMap.get(entrySubjectCode) : '') ||
                                  entrySubjectCode ||
                                  '-';
                                const entryClass = classMap.get(entry.class_id);
                                const entryClassLabel = entryClass ? classLabel(entryClass) : '-';
                                const entryTeacher = entry.teacher_id ? userMap.get(entry.teacher_id) ?? '-' : '-';

                                return (
                                  <span key={entry.id} className="timetable-cell-item">
                                    {scheduleView === 'induk' ? (
                                      <>
                                        <strong>{entryClassLabel}</strong>
                                        <small>
                                          {subjectLabel}
                                          {entryTeacher !== '-' ? ` - ${entryTeacher}` : ''}
                                        </small>
                                      </>
                                    ) : scheduleView === 'guru' ? (
                                      <>
                                        <strong>{subjectLabel}</strong>
                                        <small>{entryClassLabel}</small>
                                      </>
                                    ) : (
                                      <strong>{subjectLabel}</strong>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="timetable-empty-cell">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
