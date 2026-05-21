const pageTitles = {
  dashboard: 'Dashboard Daerah',
  akses: 'Akses Pengguna',
  markah: 'Input Markah',
  laporan: 'Pusat Laporan',
  tetapan: 'Tetapan Sistem',
};

const schools = [
  { name: 'SRA Taman Permata', value: 84 },
  { name: 'SRA KG SG Tua Bharu', value: 79 },
  { name: 'KAFAI An-Nur', value: 76 },
  { name: 'KAFAI Al-Amaniah', value: 72 },
  { name: 'SRA Selayang Baru', value: 68 },
];

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => {
    const page = button.dataset.page;

    document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
    document.querySelectorAll('.page').forEach((item) => item.classList.remove('active'));

    button.classList.add('active');
    document.getElementById(page).classList.add('active');
    document.getElementById('page-title').textContent = pageTitles[page];
  });
});

const schoolBars = document.getElementById('school-bars');

schools.forEach((school) => {
  const row = document.createElement('div');
  row.className = 'bar-row';
  row.innerHTML = `
    <strong>${school.name}</strong>
    <div class="bar-track">
      <div class="bar-fill" style="width: ${school.value}%"></div>
    </div>
    <span>${school.value}</span>
  `;
  schoolBars.appendChild(row);
});

