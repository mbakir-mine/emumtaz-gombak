from pathlib import Path
import re

import pandas as pd


SOURCE = Path(r"D:\Downloads\laporan (7).xls")
OUTDIR = Path("outputs")
OUTDIR.mkdir(exist_ok=True)

KOD_SEKOLAH = "BYP7010"
TAHUN_AKADEMIK = 2026


def clean_text(value: object) -> str:
    if pd.isna(value):
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def parse_tahun(kelas: str) -> int | None:
    match = re.match(r"^\s*(\d+)", kelas)
    if not match:
        return None
    tahun = int(match.group(1))
    return tahun if 1 <= tahun <= 6 else None


tables = pd.read_html(SOURCE)
raw = tables[1].copy()
raw.columns = raw.iloc[0].astype(str).map(clean_text)
raw = raw.iloc[1:].copy()

students = pd.DataFrame(
    {
        "mykid": raw["Kp Baru"].map(clean_text),
        "nama_murid": raw["Nama Pelajar"].map(clean_text).str.upper(),
        "jantina": raw["Jantina"].map(clean_text).map({"Lelaki": "L", "Perempuan": "P"}),
        "kod_sekolah": KOD_SEKOLAH,
        "nama_kelas": raw["Kelas"].map(clean_text).str.upper(),
        "status": "AKTIF",
    }
)
students["tahun"] = students["nama_kelas"].map(parse_tahun)

invalid = students[
    ~(
        (students["mykid"] != "")
        & (students["nama_murid"] != "")
        & students["tahun"].notna()
    )
].copy()

students = students[
    (students["mykid"] != "")
    & (students["nama_murid"] != "")
    & students["tahun"].notna()
].copy()
students["tahun"] = students["tahun"].astype(int)

classes = (
    students[["kod_sekolah", "tahun", "nama_kelas"]]
    .drop_duplicates()
    .sort_values(["tahun", "nama_kelas"])
    .copy()
)
classes.insert(1, "tahun_akademik", TAHUN_AKADEMIK)
classes["status"] = "AKTIF"

students_export = students[["mykid", "nama_murid", "jantina", "kod_sekolah", "nama_kelas", "status"]].copy()

classes_path = OUTDIR / "byp7010_classes.csv"
students_path = OUTDIR / "byp7010_students.csv"
invalid_path = OUTDIR / "byp7010_students_excluded_review.csv"
classes.to_csv(classes_path, index=False, encoding="utf-8-sig")
students_export.to_csv(students_path, index=False, encoding="utf-8-sig")
invalid.to_csv(invalid_path, index=False, encoding="utf-8-sig")

print("source", SOURCE)
print("students", len(students_export), students_path)
print("excluded", len(invalid), invalid_path)
print("classes", len(classes), classes_path)
print("students by tahun")
print(students.groupby("tahun").size().to_string())
print("classes")
print(classes.to_string(index=False))
