from pathlib import Path

import pandas as pd


html_path = Path("outputs/simpeni_sekolah.html")
tables = pd.read_html(html_path)
print("tables", len(tables))
table = tables[0]
table.columns = table.iloc[0].astype(str).str.strip()
table = table.iloc[1:].copy()
table = table.rename(
    columns={
        "KOD SEKOLAH": "kod_sekolah",
        "NAMA SEKOLAH AGAMA": "nama_sekolah",
        "ALAMAT SEKOLAH AGAMA": "alamat",
        "DAERAH NEGERI": "daerah_negeri",
        "STATUS": "status_pendaftaran",
    }
)
for col in table.columns:
    table[col] = table[col].astype(str).str.strip()

gombak = table[table["daerah_negeri"].str.upper().str.contains("GOMBAK", na=False)].copy()
print("gombak rows", len(gombak))
print(gombak[["kod_sekolah", "nama_sekolah", "daerah_negeri", "status_pendaftaran"]].to_string(index=False))

existing = pd.read_csv("outputs/senarai_sekolah_supabase.csv", dtype=str, encoding="utf-8-sig")
missing = gombak[~gombak["kod_sekolah"].isin(set(existing["kod_sekolah"]))].copy()
print("missing vs csv", len(missing))
print(missing[["kod_sekolah", "nama_sekolah", "daerah_negeri", "status_pendaftaran"]].to_string(index=False))

out = gombak[["kod_sekolah", "nama_sekolah"]].copy()
out["kategori"] = out["kod_sekolah"].map(lambda x: "SRA" if x.startswith(("BYP", "BYR")) else "KAFAI")
out["daerah"] = "GOMBAK"
out["status"] = "AKTIF"
out.to_csv("outputs/simpeni_gombak_schools.csv", index=False, encoding="utf-8-sig")
