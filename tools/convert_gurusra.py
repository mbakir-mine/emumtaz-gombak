from pathlib import Path
import re

import pandas as pd


SOURCE = Path(r"C:\Users\irsya\OneDrive\Mohamad Bakir\Documents\gurusra.xlsx")
OUTDIR = Path("outputs")
OUTDIR.mkdir(exist_ok=True)

KOD_SEKOLAH = "BYP7010"


def clean_text(value: object) -> str:
    if pd.isna(value):
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def slug_email_name(name: str, index: int) -> str:
    base = name.lower().replace("'", "")
    base = re.sub(r"[^a-z0-9]+", ".", base)
    base = re.sub(r"\.+", ".", base).strip(".")
    base = base[:38].strip(".") or f"guru{index}"
    return f"{base}.{KOD_SEKOLAH.lower()}@emumtaz.local"


raw = pd.read_excel(SOURCE, sheet_name=0, header=None, dtype=object)

# Header row contains "Bil", "Nama Guru", "email" etc.
header_idx = raw.index[raw.apply(lambda row: row.astype(str).str.contains("Nama Guru", case=False, na=False).any(), axis=1)][0]
headers = raw.iloc[header_idx].map(clean_text).tolist()
data = raw.iloc[header_idx + 1 :].copy()
data.columns = headers

data = data.rename(
    columns={
        "Nama Guru": "nama",
        "email": "email",
        "No. Tel": "telefon",
        "Jawatan": "jawatan",
        "kelas": "kelas",
        "Subjek": "subjek",
    }
)

data["nama"] = data["nama"].map(clean_text).str.upper()
data["email"] = data["email"].map(clean_text).str.lower()
data["telefon"] = data["telefon"].map(clean_text)
data["jawatan"] = data["jawatan"].map(clean_text).str.upper()
data["kelas"] = data["kelas"].map(clean_text).str.upper()
data["subjek"] = data["subjek"].map(clean_text).str.upper()

teachers = data[data["nama"] != ""].copy()
teachers = teachers.reset_index(drop=True)

teachers["email"] = [
    email if email and "@" in email else slug_email_name(name, i + 1)
    for i, (email, name) in enumerate(zip(teachers["email"], teachers["nama"]))
]

teachers["role"] = teachers["jawatan"].map(
    lambda value: "ADMIN_SEKOLAH" if "GURU BESAR" in value or "PENTADBIR" in value else "GURU_SUBJEK"
)
teachers["kod_sekolah"] = KOD_SEKOLAH
teachers["status"] = "AKTIF"

app_users = teachers[["email", "nama", "role", "kod_sekolah", "status"]].drop_duplicates("email")
review = teachers[["nama", "email", "telefon", "jawatan", "kelas", "subjek", "role", "kod_sekolah", "status"]]

app_users_path = OUTDIR / "byp7010_guru_app_users.csv"
review_path = OUTDIR / "byp7010_guru_review.csv"
app_users.to_csv(app_users_path, index=False, encoding="utf-8-sig")
review.to_csv(review_path, index=False, encoding="utf-8-sig")

print("source", SOURCE)
print("teachers", len(app_users), app_users_path)
print("review", review_path)
print("roles")
print(app_users.groupby("role").size().to_string())
print(app_users.head(10).to_string(index=False))

