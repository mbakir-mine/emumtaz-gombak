import type {
  SchoolSubjectMarkSetting,
  SubjectComponentMarkSetting,
  SubjectComponentRecord,
  SubjectRecord,
} from './data';

export type MarkSettingScope = {
  kodSekolah: string;
  tahunAkademik: number;
  kodPeperiksaan: string;
  tahun: number;
  kodSubjek: string;
};

function sameScope(setting: {
  kod_sekolah?: string | null;
  tahun_akademik: number;
  kod_peperiksaan: string;
  tahun: number;
  kod_subjek: string;
}, scope: MarkSettingScope) {
  return (
    setting.kod_sekolah === scope.kodSekolah &&
    Number(setting.tahun_akademik) === Number(scope.tahunAkademik) &&
    setting.kod_peperiksaan === scope.kodPeperiksaan &&
    Number(setting.tahun) === Number(scope.tahun) &&
    setting.kod_subjek === scope.kodSubjek
  );
}

export function resolveSubjectFullMark(
  scope: MarkSettingScope,
  settings: SchoolSubjectMarkSetting[],
  subjects: SubjectRecord[],
) {
  const override = settings.find((setting) => sameScope(setting, scope));
  if (override) return Number(override.markah_penuh);
  return Number(subjects.find((subject) => subject.kod_subjek === scope.kodSubjek)?.markah_penuh ?? 100);
}

export function resolveComponentFullMark(
  scope: MarkSettingScope,
  kodKomponen: string,
  schoolSettings: SubjectComponentMarkSetting[],
  defaultSettings: SubjectComponentMarkSetting[],
  components: SubjectComponentRecord[],
) {
  const schoolOverride = schoolSettings.find(
    (setting) => sameScope(setting, scope) && setting.kod_komponen === kodKomponen,
  );
  if (schoolOverride) return Number(schoolOverride.markah_penuh);

  const examDefault = defaultSettings.find(
    (setting) =>
      !setting.kod_sekolah &&
      Number(setting.tahun_akademik) === Number(scope.tahunAkademik) &&
      setting.kod_peperiksaan === scope.kodPeperiksaan &&
      Number(setting.tahun) === Number(scope.tahun) &&
      setting.kod_subjek === scope.kodSubjek &&
      setting.kod_komponen === kodKomponen,
  );
  if (examDefault) return Number(examDefault.markah_penuh);

  return Number(
    components.find(
      (component) =>
        component.kod_subjek === scope.kodSubjek && component.kod_komponen === kodKomponen,
    )?.markah_penuh ?? 0,
  );
}

export function normalizeMark(markah: number | null | undefined, markahPenuh: number) {
  if (markah === null || markah === undefined || !Number.isFinite(Number(markah))) return null;
  if (!Number.isFinite(markahPenuh) || markahPenuh <= 0) return null;
  return Number(((Number(markah) / markahPenuh) * 100).toFixed(2));
}

export function validateRawMark(markah: number, markahPenuh: number) {
  if (!Number.isFinite(markah) || markah < 0) return 'Markah mestilah nombor positif.';
  if (!Number.isFinite(markahPenuh) || markahPenuh <= 0) return 'Tetapan markah penuh tidak sah.';
  if (markah > markahPenuh) return `Markah tidak boleh melebihi ${markahPenuh}.`;
  return null;
}

