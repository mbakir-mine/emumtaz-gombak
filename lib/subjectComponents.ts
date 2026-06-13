export type SubjectComponentDefinition = {
  kod_subjek: string;
  kod_komponen: string;
  nama_komponen: string;
  markah_penuh: number;
  susunan: number;
  status: string;
};

export const defaultSubjectComponents: SubjectComponentDefinition[] = [
  {
    kod_subjek: 'TF04',
    kod_komponen: 'TAUHID',
    nama_komponen: 'Tauhid',
    markah_penuh: 50,
    susunan: 1,
    status: 'AKTIF',
  },
  {
    kod_subjek: 'TF04',
    kod_komponen: 'FEKAH',
    nama_komponen: 'Fekah',
    markah_penuh: 50,
    susunan: 2,
    status: 'AKTIF',
  },
  {
    kod_subjek: 'AS01',
    kod_komponen: 'AKHLAK',
    nama_komponen: 'Akhlak',
    markah_penuh: 50,
    susunan: 1,
    status: 'AKTIF',
  },
  {
    kod_subjek: 'AS01',
    kod_komponen: 'SIRAH',
    nama_komponen: 'Sirah',
    markah_penuh: 50,
    susunan: 2,
    status: 'AKTIF',
  },
  {
    kod_subjek: 'JIK03',
    kod_komponen: 'JAWI',
    nama_komponen: 'Jawi',
    markah_penuh: 60,
    susunan: 1,
    status: 'AKTIF',
  },
  {
    kod_subjek: 'JIK03',
    kod_komponen: 'IMLAK',
    nama_komponen: 'Imlak',
    markah_penuh: 10,
    susunan: 2,
    status: 'AKTIF',
  },
  {
    kod_subjek: 'JIK03',
    kod_komponen: 'KHAT',
    nama_komponen: 'Khat',
    markah_penuh: 30,
    susunan: 3,
    status: 'AKTIF',
  },
];

export function defaultComponentsForSubject(kodSubjek: string) {
  return defaultSubjectComponents
    .filter((component) => component.kod_subjek === kodSubjek && component.status === 'AKTIF')
    .sort((left, right) => left.susunan - right.susunan);
}

export function hasDefaultComponents(kodSubjek: string) {
  return defaultComponentsForSubject(kodSubjek).length > 0;
}

export function mergeSubjectComponents(rows: SubjectComponentDefinition[]) {
  const byKey = new Map<string, SubjectComponentDefinition>();

  defaultSubjectComponents.forEach((component) => {
    byKey.set(`${component.kod_subjek}|${component.kod_komponen}`, component);
  });

  rows.forEach((component) => {
    byKey.set(`${component.kod_subjek}|${component.kod_komponen}`, component);
  });

  return [...byKey.values()].sort((left, right) => {
    if (left.kod_subjek !== right.kod_subjek) {
      return left.kod_subjek.localeCompare(right.kod_subjek);
    }
    return left.susunan - right.susunan;
  });
}
