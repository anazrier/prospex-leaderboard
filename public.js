// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  databaseURL: "https://prospex-if-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Global State Data
let publicKelompokData = {};
let publicPesertaData = {};
let activeUserTab = 'kelompok'; // 'kelompok' atau 'individu'
let searchQueryUser = '';

// ==========================================
// 2. REALTIME LISTENERS
// ==========================================
db.ref('kelompok').on('value', (snapshot) => {
  publicKelompokData = snapshot.val() || {};
  renderUserPage();
});

db.ref('peserta').on('value', (snapshot) => {
  publicPesertaData = snapshot.val() || {};
  renderUserPage();
});

// Switch Tab Handler
function switchUserTab(tab) {
  activeUserTab = tab;

  // Toggle Tab Styling
  const btnK = document.getElementById('tab-btn-kelompok');
  const btnI = document.getElementById('tab-btn-individu');

  if (tab === 'kelompok') {
    btnK.className = "py-3 px-6 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 border-indigo-500 text-indigo-400 bg-slate-800/60";
    btnI.className = "py-3 px-6 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 border-transparent text-slate-400 hover:text-white";
  } else {
    btnI.className = "py-3 px-6 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 border-indigo-500 text-indigo-400 bg-slate-800/60";
    btnK.className = "py-3 px-6 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 border-transparent text-slate-400 hover:text-white";
  }

  renderUserPage();
}

// Main Render Handler
function renderUserPage() {
  const container = document.getElementById('user-content-area');
  if (!container) return;

  if (activeUserTab === 'kelompok') {
    container.innerHTML = renderPublicKelompokView();
  } else {
    container.innerHTML = renderPublicIndividuView();
  }
}

// ==========================================
// 3. TAB 1: KLASEMEN KELOMPOK
// ==========================================
function renderPublicKelompokView() {
  const keys = Object.keys(publicKelompokData);

  if (keys.length === 0) {
    return `<div class="bg-slate-800/60 border border-slate-700 rounded-xl p-8 text-center text-slate-400 text-xs">Belum ada data kelompok.</div>`;
  }

  // Sort berdasarkan total_skor tertinggi
  const sortedKelompok = keys.map(k => publicKelompokData[k]).sort((a, b) => (Number(b.total_skor) || 0) - (Number(a.total_skor) || 0));

  return `
    <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
      <div class="flex justify-between items-center border-b border-slate-700 pb-3">
        <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-ranking-star text-amber-400"></i> Peringkat Kelompok
        </h3>
        <span class="text-[10px] bg-slate-700 text-slate-300 font-bold px-2.5 py-1 rounded-full">${sortedKelompok.length} Kelompok</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm text-slate-300">
          <thead class="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-700 text-[10px] sm:text-xs">
            <tr>
              <th class="py-3 px-4 text-center w-16">Rank</th>
              <th class="py-3 px-4">Nama Kelompok</th>
              <th class="py-3 px-4 text-center">Poin Plus</th>
              <th class="py-3 px-4 text-center">Poin Pelanggaran</th>
              <th class="py-3 px-4 text-right">Total Skor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/60">
            ${sortedKelompok.map((k, index) => {
              const rankIcon = index === 0 ? '🏆 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `#${index + 1}`;
              const rowBg = index === 0 ? 'bg-amber-500/10 font-bold' : index < 3 ? 'bg-indigo-950/20 font-semibold' : 'hover:bg-slate-750';
              
              return `
                <tr class="${rowBg} transition">
                  <td class="py-3.5 px-4 text-center font-mono font-bold ${index === 0 ? 'text-amber-400' : ''}">${rankIcon}</td>
                  <td class="py-3.5 px-4 font-semibold text-white">${k.nama_kelompok || '-'}</td>
                  <td class="py-3.5 px-4 text-center font-mono text-emerald-400">+${k.poin_plus || 0}</td>
                  <td class="py-3.5 px-4 text-center font-mono text-rose-400">-${k.poin_minus || 0}</td>
                  <td class="py-3.5 px-4 text-right font-mono font-bold text-indigo-400 text-sm sm:text-base">${k.total_skor || 0} Poin</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ==========================================
// 4. TAB 2: DAFTAR & SKOR INDIVIDU (SEARCHABLE)
// ==========================================
function renderPublicIndividuView() {
  const keys = Object.keys(publicPesertaData);

  if (keys.length === 0) {
    return `<div class="bg-slate-800/60 border border-slate-700 rounded-xl p-8 text-center text-slate-400 text-xs">Belum ada data peserta.</div>`;
  }

  // Filter berdasarkan search query
  let filteredKeys = keys;
  if (searchQueryUser.trim() !== '') {
    const q = searchQueryUser.toLowerCase().trim();
    filteredKeys = keys.filter(k => {
      const p = publicPesertaData[k];
      return (p.nim && p.nim.toLowerCase().includes(q)) || (p.nama && p.nama.toLowerCase().includes(q));
    });
  }

  // Sort berdasarkan total skor tertinggi
  const sortedPeserta = filteredKeys.map(k => publicPesertaData[k]).sort((a, b) => (Number(b.total_skor) || 0) - (Number(a.total_skor) || 0));

  return `
    <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
      
      <!-- Search Bar & Header -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-700 pb-4">
        <h3 class="text-sm sm:text-base font-bold text-white flex items-center gap-2 w-full sm:w-auto">
          <i class="fa-solid fa-users-viewfinder text-indigo-400"></i> Daftar Peserta
        </h3>

        <!-- Search Bar Instant -->
        <div class="relative w-full sm:w-72">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
          <input type="text" id="input-search-user" placeholder="Cari NIM atau Nama Peserta..." value="${searchQueryUser}"
            oninput="handleUserSearch(this.value)"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
        </div>
      </div>

      <!-- Tabel Data Peserta -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs sm:text-sm text-slate-300">
          <thead class="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-700 text-[10px] sm:text-xs">
            <tr>
              <th class="py-3 px-4 text-center w-14">No</th>
              <th class="py-3 px-4">NIM</th>
              <th class="py-3 px-4">Nama Lengkap</th>
              <th class="py-3 px-4">Kelompok</th>
              <th class="py-3 px-4 text-center">Kelas</th>
              <th class="py-3 px-4 text-right">Total Skor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-700/60">
            ${sortedPeserta.map((p, index) => {
              const namaKelompok = (p.kelompok_id && publicKelompokData[p.kelompok_id]) ? publicKelompokData[p.kelompok_id].nama_kelompok : 'Tanpa Kelompok';
              
              return `
                <tr class="hover:bg-slate-750 transition">
                  <td class="py-3 px-4 text-center font-mono text-slate-400">${index + 1}</td>
                  <td class="py-3 px-4 font-mono font-bold text-indigo-300">${p.nim || '-'}</td>
                  <td class="py-3 px-4 font-semibold text-white">${p.nama || '-'}</td>
                  <td class="py-3 px-4 text-slate-400">${namaKelompok}</td>
                  <td class="py-3 px-4 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.kelas === 'Reguler' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'} uppercase">
                      ${p.kelas || '-'}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right font-mono font-bold text-indigo-400 text-sm">${p.total_skor || 0} Poin</td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="6" class="py-8 text-center text-slate-500">Tidak ada peserta yang cocok.</td></tr>`}
          </tbody>
        </table>
      </div>

    </div>
  `;
}

// Search Handler Instant (Update Table Content Dynamic)
function handleUserSearch(val) {
  searchQueryUser = val;
  renderUserPage();
  
  // Re-focus kursor di search bar setelah re-render
  const inputElem = document.getElementById('input-search-user');
  if (inputElem) {
    inputElem.focus();
    inputElem.setSelectionRange(val.length, val.length);
  }
}