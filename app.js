// ==========================================
// 1. KONFIGURASI FIREBASE
// ==========================================
// Tempelkan firebaseConfig yang kamu salin dari Firebase Console di sini
const firebaseConfig = {
  apiKey: "AIzaSyDDsH4nKn5ur52zvAO7Zi5tieNxPPlvJGc",
  authDomain: "prospex-if-2026.firebaseapp.com",
  databaseURL: "https://prospex-if-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "prospex-if-2026",
  storageBucket: "prospex-if-2026.firebasestorage.app",
  messagingSenderId: "252303563115",
  appId: "1:252303563115:web:63ae27ebe65096c875142e",
  measurementId: "G-MJFPZ4BQ60"
};

// Inisialisasi Firebase & Realtime Database
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==========================================
// SWEETALERT TOAST HELPER (PASTI JALAN)
// ==========================================
function showToastSuccess(title) {
  if (typeof Swal !== "undefined") {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: title,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: '#1e293b',
      color: '#fff'
    });
  } else {
    console.log("SUKSES:", title);
  }
}

function showToastWarning(title) {
  if (typeof Swal !== "undefined") {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: title,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      background: '#1e293b',
      color: '#fff'
    });
  } else {
    alert(title);
  }
}


// ==========================================
// 2. CREDENTIALS ADMIN (HARDCODE)
// ==========================================
const ADMIN_CREDENTIALS = {
  username: "prospex.adminbaik",
  password: "sendyketuplak2026"
};


// ==========================================
// 3. LOGIKA AUTENTIKASI ADMIN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Cek apakah admin sudah login sebelumnya (Simpan di Session Storage)
  if (sessionStorage.getItem("isProspexAdminLoggedIn") === "true") {
    showDashboard();
  } else {
    showLogin();
  }

  // Handle Form Login Submit
  const formLogin = document.getElementById("form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const userInput = document.getElementById("login-username").value.trim();
      const passInput = document.getElementById("login-password").value.trim();
      const errorMsg = document.getElementById("login-error");

      if (userInput === ADMIN_CREDENTIALS.username && passInput === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem("isProspexAdminLoggedIn", "true");
        if (errorMsg) errorMsg.classList.add("hidden");
        showDashboard();
      } else {
        if (errorMsg) errorMsg.classList.remove("hidden");
      }
    });
  }
});

function showDashboard() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("dashboard-screen").classList.remove("hidden");
  // Default buka Tab 1 saat pertama masuk
  switchTab("peserta");
}

function showLogin() {
  document.getElementById("dashboard-screen").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
}

function logoutAdmin() {
  sessionStorage.removeItem("isProspexAdminLoggedIn");
  showLogin();
}


// ==========================================
// 4. LOGIKA NAVIGASI TAB UTAMA
// ==========================================
function switchTab(tabName) {
  // Sembunyikan semua konten tab
  const allContents = document.querySelectorAll(".tab-content");
  allContents.forEach((content) => content.classList.add("hidden"));

  // Reset style semua tombol nav
  const allNavBtns = document.querySelectorAll(".tab-btn");
  allNavBtns.forEach((btn) => {
    btn.classList.remove("bg-slate-800", "text-indigo-400", "font-bold");
    btn.classList.add("text-slate-300");
  });

  // Tampilkan tab yang dipilih
  const targetContent = document.getElementById(`tab-${tabName}`);
  const targetNavBtn = document.getElementById(`nav-${tabName}`);

  if (targetContent) targetContent.classList.remove("hidden");
  if (targetNavBtn) {
    targetNavBtn.classList.add("bg-slate-800", "text-indigo-400", "font-bold");
    targetNavBtn.classList.remove("text-slate-300");
  }

  // Trigger render konten sesuai tab
  if (tabName === "peserta") renderTabPeserta();
  if (tabName === "penilaian") renderTabPenilaian();
  if (tabName === "panduan") renderTabPanduan();
  if (tabName === "top1") renderTabTop1();
}



// ==========================================
// 6. MENU 1: DATA PESERTA & TIM (SEARCH & FILTER KELOMPOK)
// ==========================================

// State Global untuk Cache Data, Mode Edit, dan Filter
let globalPesertaData = {};
let globalKelompokData = {};
let editingPesertaKey = null;

// State Filter & Search
let currentFilterKelompok = 'ALL';
let currentSearchQuery = '';

// Listener Realtime Firebase
function initPesertaListeners() {
  db.ref('kelompok').on('value', (snapshot) => {
    globalKelompokData = snapshot.val() || {};
    
    // Auto-update jika tab peserta aktif
    if (document.getElementById('tab-peserta') && !document.getElementById('tab-peserta').classList.contains('hidden')) {
      renderTabPeserta();
    }
    // FIX: Auto-update jika tab penilaian aktif
    if (document.getElementById('tab-penilaian') && !document.getElementById('tab-penilaian').classList.contains('hidden')) {
      renderTabPenilaian();
    }
  });

  db.ref('peserta').on('value', (snapshot) => {
    globalPesertaData = snapshot.val() || {};
    
    if (document.getElementById('tab-peserta') && !document.getElementById('tab-peserta').classList.contains('hidden')) {
      renderTabPeserta();
    }
    if (document.getElementById('tab-penilaian') && !document.getElementById('tab-penilaian').classList.contains('hidden')) {
      renderTabPenilaian();
    }
  });
}

// Inisialisasi Listener
initPesertaListeners();

// Render Halaman Tab 1 (Data Peserta & Tim)
let searchPesertaAdminQuery = '';
let sortByAdmin = 'default'; // 'default', 'kelompok_asc', 'nama_asc'

function renderTabPeserta() {
  const container = document.getElementById("container-peserta-content");
  if (!container) return;

  const pesertaKeys = Object.keys(globalPesertaData || {});
  const kelompokKeys = Object.keys(globalKelompokData || {});

  const listOptionKelompok = kelompokKeys.map(id => {
    return `<option value="${id}">${globalKelompokData[id].nama_kelompok}</option>`;
  }).join('');

  // 1. FILTER BERDASARKAN SEARCH QUERY
  let filteredKeys = pesertaKeys;
  if (searchPesertaAdminQuery.trim() !== '') {
    const q = searchPesertaAdminQuery.toLowerCase().trim();
    filteredKeys = pesertaKeys.filter(id => {
      const p = globalPesertaData[id];
      const nimStr = p.nim ? String(p.nim).toLowerCase() : '';
      const namaStr = p.nama ? String(p.nama).toLowerCase() : '';
      return nimStr.includes(q) || namaStr.includes(q);
    });
  }

  // 2. SORTING BERDASARKAN PILIHAN
  filteredKeys.sort((aId, bId) => {
    const pA = globalPesertaData[aId];
    const pB = globalPesertaData[bId];

    if (sortByAdmin === 'kelompok_asc') {
      const namaK_A = (pA.kelompok_id && globalKelompokData[pA.kelompok_id]) ? globalKelompokData[pA.kelompok_id].nama_kelompok : 'ZZZ';
      const namaK_B = (pB.kelompok_id && globalKelompokData[pB.kelompok_id]) ? globalKelompokData[pB.kelompok_id].nama_kelompok : 'ZZZ';
      return namaK_A.localeCompare(namaK_B);
    } else if (sortByAdmin === 'nama_asc') {
      return (pA.nama || '').localeCompare(pB.nama || '');
    }
    return 0; // Default
  });

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- BARIS ATAS: KELOLA KELOMPOK & IMPORT EXCEL -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- CARD 1: TAMBAH KELOMPOK -->
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
          <div class="flex justify-between items-center border-b border-slate-700 pb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-users-rectangle text-indigo-400"></i> Kelola Kelompok (${kelompokKeys.length})
            </h3>
          </div>

          <form onsubmit="tambahKelompokBaru(event)" class="flex gap-2">
            <input type="text" id="add-nama-kelompok" placeholder="Nama Kelompok Baru..." required
              class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap shadow-md">
              + Tambah
            </button>
          </form>

          <div class="space-y-1.5 max-h-48 overflow-y-auto pt-1">
            ${kelompokKeys.map(id => {
              const k = globalKelompokData[id];
              return `
                <div class="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs">
                  <span class="font-bold text-slate-200">${k.nama_kelompok}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">${k.total_skor || 0} Poin</span>
                    <button onclick="hapusKelompok('${id}')" class="text-rose-400 hover:text-rose-300 p-1" title="Hapus Kelompok">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('') || `<div class="text-xs text-slate-500 italic py-2 text-center">Belum ada kelompok. Buat kelompok di atas!</div>`}
          </div>
        </div>

        <!-- CARD 2: IMPORT DATA PESERTA VIA EXCEL -->
        <div class="lg:col-span-2 bg-slate-800 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-700 pb-3">
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-file-excel text-emerald-400"></i> Import Data Peserta via Excel
              </h3>
              <p class="text-xs text-slate-400">Upload file Excel (.xlsx / .csv) daftar peserta maba.</p>
            </div>
            <button onclick="downloadTemplateExcel()" class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1">
              <i class="fa-solid fa-download"></i> Download Format Template
            </button>
          </div>

          <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <label class="block text-xs font-bold uppercase text-slate-300">Pilih File Excel / CSV (.xlsx / .csv)</label>
            <div class="flex flex-col sm:flex-row gap-3">
              <input type="file" id="input-file-excel" accept=".xlsx, .xls, .csv"
                class="flex-1 text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer">
              <button onclick="prosesImportExcel()" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-lg transition flex items-center justify-center gap-1.5 shadow-md">
                <i class="fa-solid fa-upload"></i> Upload & Import
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- TABEL DATA PESERTA & KONTROL PENCARIAN/SORTING -->
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
        
        <!-- Header Tabel & Search/Sort Controls -->
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-700 pb-4">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-users text-indigo-400"></i> Daftar Peserta Terdaftar (${filteredKeys.length} dari ${pesertaKeys.length})
            </h3>
            <p class="text-xs text-slate-400">Cari, urutkan, dan atur kelompok peserta.</p>
          </div>

          <!-- SEARCH BAR & SORTING DROPDOWN -->
          <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <!-- Search Input -->
            <div class="relative flex-1 sm:w-56">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
              <input type="text" id="input-admin-search" placeholder="Cari NIM / Nama..." value="${searchPesertaAdminQuery}"
                oninput="handleAdminSearch(this.value)"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500">
            </div>

            <!-- Sorting Dropdown -->
            <select onchange="handleAdminSort(this.value)" class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500">
              <option value="default" ${sortByAdmin === 'default' ? 'selected' : ''}>Urutan: Default</option>
              <option value="kelompok_asc" ${sortByAdmin === 'kelompok_asc' ? 'selected' : ''}>Sort: Berdasarkan Kelompok (A-Z)</option>
              <option value="nama_asc" ${sortByAdmin === 'nama_asc' ? 'selected' : ''}>Sort: Berdasarkan Nama (A-Z)</option>
            </select>
          </div>
        </div>

        <!-- FORM TAMBAH PESERTA MANUAL -->
        <form onsubmit="tambahPesertaManual(event)" class="flex flex-wrap gap-2 bg-slate-900/50 p-3 rounded-xl border border-slate-700/60">
          <span class="text-[11px] font-bold text-slate-400 self-center uppercase mr-1">Tambah Manual:</span>
          <input type="text" id="add-nim" placeholder="NIM" required class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-28">
          <input type="text" id="add-nama" placeholder="Nama Lengkap" required class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 flex-1 sm:w-40">
          <select id="add-kelas" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500">
            <option value="Reguler">Reguler</option>
            <option value="Karyawan">Karyawan</option>
          </select>
          <select id="add-kelompok-id" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500">
            <option value="">-- Pilih Kelompok --</option>
            ${listOptionKelompok}
          </select>
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition shadow-md">
            + Tambah
          </button>
        </form>

        <!-- TABEL HASIL DATABASE PESERTA -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th class="py-3 px-3 text-center w-12">No</th>
                <th class="py-3 px-3">NIM</th>
                <th class="py-3 px-3">Nama Lengkap</th>
                <th class="py-3 px-3">Kelas</th>
                <th class="py-3 px-3">Pilihan Kelompok</th>
                <th class="py-3 px-3 text-right">Total Skor</th>
                <th class="py-3 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/60">
              ${filteredKeys.map((id, index) => {
                const p = globalPesertaData[id];
                
                return `
                  <tr class="hover:bg-slate-750 transition">
                    <td class="py-2.5 px-3 text-center font-mono text-slate-400">${index + 1}</td>
                    <td class="py-2.5 px-3 font-mono font-bold text-indigo-300">${p.nim || '-'}</td>
                    <td class="py-2.5 px-3 font-semibold text-white">${p.nama || '-'}</td>
                    <td class="py-2.5 px-3 uppercase text-[10px] font-bold ${p.kelas === 'Reguler' ? 'text-blue-400' : 'text-purple-400'}">${p.kelas || '-'}</td>
                    
                    <td class="py-2.5 px-3">
                      <select onchange="updateKelompokPeserta('${id}', this.value)" 
                        class="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                        <option value="">-- Tanpa Kelompok --</option>
                        ${kelompokKeys.map(kId => `
                          <option value="${kId}" ${p.kelompok_id === kId ? 'selected' : ''}>
                            ${globalKelompokData[kId].nama_kelompok}
                          </option>
                        `).join('')}
                      </select>
                    </td>

                    <td class="py-2.5 px-3 text-right font-mono font-bold text-indigo-400">${p.total_skor || 0}</td>
                    <td class="py-2.5 px-3 text-center">
                      <button onclick="hapusPeserta('${id}')" class="text-rose-400 hover:text-rose-300 p-1 transition" title="Hapus Peserta">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('') || `<tr><td colspan="7" class="py-6 text-center text-slate-500">Tidak ada peserta yang ditemukan.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

// Handler Search & Sorting Realtime untuk Admin
function handleAdminSearch(val) {
  searchPesertaAdminQuery = val;
  renderTabPeserta();
  
  // Jaga agar kursor tetap fokus di search bar
  const inputElem = document.getElementById('input-admin-search');
  if (inputElem) {
    inputElem.focus();
    inputElem.setSelectionRange(val.length, val.length);
  }
}

function handleAdminSort(val) {
  sortByAdmin = val;
  renderTabPeserta();
}

// ==========================================
// FUNGSI MANAJEMEN KELOMPOK & PESERTA
// ==========================================

// 1. Tambah Kelompok Baru
function tambahKelompokBaru(e) {
  e.preventDefault();
  const inputNama = document.getElementById("add-nama-kelompok");
  if (!inputNama) return;
  const nama = inputNama.value.trim();
  if (!nama) return;

  const newId = "K_" + Date.now();
  db.ref('kelompok/' + newId).set({
    nama_kelompok: nama,
    total_skor: 0,
    poin_plus: 0,
    poin_minus: 0,
    nilai_aspek: {
      kehadiran_kedisiplinan: 0,
      inisiatif_keaktifan: 0,
      komunikasi_retorika: 0
    }
  }).then(() => {
    if (typeof showToastSuccess === "function") showToastSuccess(`Kelompok ${nama} berhasil dibuat!`);
    inputNama.value = "";
  });
}

// 2. Hapus Kelompok
function hapusKelompok(id) {
  if (confirm("Apakah Anda yakin ingin menghapus kelompok ini?")) {
    db.ref('kelompok/' + id).remove().then(() => {
      if (typeof showToastSuccess === "function") showToastSuccess("Kelompok berhasil dihapus!");
    });
  }
}

// 3. Update Kelompok Peserta Langsung dari Tabel
function updateKelompokPeserta(pesertaId, kelompokId) {
  db.ref('peserta/' + pesertaId + '/kelompok_id').set(kelompokId).then(() => {
    if (typeof showToastSuccess === "function") showToastSuccess("Kelompok peserta diperbarui!");
  });
}

// 4. Tambah Peserta Manual
function tambahPesertaManual(e) {
  e.preventDefault();
  const nim = document.getElementById("add-nim").value.trim();
  const nama = document.getElementById("add-nama").value.trim();
  const kelas = document.getElementById("add-kelas").value;
  const kelompokId = document.getElementById("add-kelompok-id").value;

  if (!nim || !nama) return;

  const newId = "P_" + Date.now();
  db.ref('peserta/' + newId).set({
    nim: nim,
    nama: nama,
    kelas: kelas,
    kelompok_id: kelompokId || "",
    total_skor: 0,
    poin_plus: 0,
    poin_minus: 0
  }).then(() => {
    if (typeof showToastSuccess === "function") showToastSuccess("Peserta berhasil ditambahkan!");
    e.target.reset();
  });
}

// 5. Download Template Excel (.xlsx)
function downloadTemplateExcel() {
  const dataTemplate = [
    ["NIM", "Nama Lengkap", "Kelas"],
    ["152026001", "Ahmad Subagja", "Reguler"],
    ["152026002", "Siti Nurhaliza", "Reguler"],
    ["152026003", "Budi Santoso", "Karyawan"]
  ];

  const ws = XLSX.utils.aoa_to_sheet(dataTemplate);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Peserta");
  XLSX.writeFile(wb, "Template_Import_Peserta_PROSPEX.xlsx");
}

// 6. Proses Import File Excel
// PROSES IMPORT EXCEL / CSV OTOMATIS BERSAMA KELOMPOK
function prosesImportExcel() {
  const fileInput = document.getElementById("input-file-excel");
  if (!fileInput || !fileInput.files[0]) {
    if (typeof showToastWarning === "function") showToastWarning("Pilih file Excel atau CSV terlebih dahulu!");
    return;
  }

  const file = fileInput.files[0];
  const fileName = file.name.toLowerCase();
  const reader = new FileReader();

  // Jika file berformat CSV, baca sebagai teks agar aman
  if (fileName.endsWith('.csv')) {
    reader.onload = function (e) {
      try {
        const textData = e.target.result;
        const workbook = XLSX.read(textData, { type: 'string' });
        eksekusiSimpanImport(workbook);
      } catch (err) {
        console.error(err);
        if (typeof showToastWarning === "function") showToastWarning("Gagal membaca file CSV!");
      }
    };
    reader.readAsText(file);
  } else {
    // Jika file berformat .xlsx / .xls
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        eksekusiSimpanImport(workbook);
      } catch (err) {
        console.error(err);
        if (typeof showToastWarning === "function") showToastWarning("Gagal membaca file Excel!");
      }
    };
    reader.readAsArrayBuffer(file);
  }
}

// Fungsi Bantu Eksekusi Data Import ke Firebase
function eksekusiSimpanImport(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonRows = XLSX.utils.sheet_to_json(sheet);

  if (jsonRows.length === 0) {
    if (typeof showToastWarning === "function") showToastWarning("File data kosong!");
    return;
  }

  const existingKelompok = globalKelompokData || {};
  const kelompokNameToIdMap = {};

  Object.keys(existingKelompok).forEach(kId => {
    const kName = existingKelompok[kId].nama_kelompok ? existingKelompok[kId].nama_kelompok.toLowerCase().trim() : "";
    if (kName) {
      kelompokNameToIdMap[kName] = kId;
    }
  });

  const updates = {};
  let totalImported = 0;

  jsonRows.forEach((row, index) => {
    const nim = String(row.NIM || row.nim || "").trim();
    const nama = String(row["Nama Lengkap"] || row.Nama || row.nama || "").trim();
    const kelas = String(row.Kelas || row.kelas || "Reguler").trim();
    const namaKelompokRaw = String(row["Nama Kelompok"] || row["NamaKelompok"] || row.Kelompok || row.kelompok || "").trim();

    if (nim && nama) {
      let assignedKelompokId = "";

      if (namaKelompokRaw) {
        const lowerKName = namaKelompokRaw.toLowerCase().trim();

        if (kelompokNameToIdMap[lowerKName]) {
          assignedKelompokId = kelompokNameToIdMap[lowerKName];
        } else {
          const newKId = "K_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
          kelompokNameToIdMap[lowerKName] = newKId;

          updates['kelompok/' + newKId] = {
            nama_kelompok: namaKelompokRaw,
            total_skor: 0,
            poin_plus: 0,
            poin_minus: 0,
            nilai_aspek: {
              kehadiran_kedisiplinan: 0,
              inisiatif_keaktifan: 0,
              komunikasi_retorika: 0
            }
          };
          assignedKelompokId = newKId;
        }
      }

      const newPId = "P_" + Date.now() + "_" + index;
      updates['peserta/' + newPId] = {
        nim: nim,
        nama: nama,
        kelas: kelas,
        kelompok_id: assignedKelompokId,
        total_skor: 0,
        poin_plus: 0,
        poin_minus: 0
      };
      totalImported++;
    }
  });

  if (totalImported > 0) {
    db.ref().update(updates).then(() => {
      if (typeof showToastSuccess === "function") {
        showToastSuccess(`Berhasil meng-import ${totalImported} peserta beserta kelompoknya!`);
      }
      if (typeof renderTabPeserta === "function") renderTabPeserta();
    });
  } else {
    if (typeof showToastWarning === "function") showToastWarning("Tidak ada data valid yang dapat di-import.");
  }
}

// 7. Hapus Peserta
function hapusPeserta(id) {
  if (confirm("Apakah Anda yakin ingin menghapus peserta ini?")) {
    db.ref('peserta/' + id).remove().then(() => {
      if (typeof showToastSuccess === "function") showToastSuccess("Peserta berhasil dihapus!");
    });
  }
}

// Logika Filter & Search Tabel
function getFilteredPesertaKeys() {
  let keys = Object.keys(globalPesertaData);

  // 1. Filter Kelompok
  if (currentFilterKelompok !== 'ALL') {
    keys = keys.filter(k => globalPesertaData[k].kelompok_id === currentFilterKelompok);
  }

  // 2. Filter Search Query (NIM & Nama)
  if (currentSearchQuery.trim() !== '') {
    const query = currentSearchQuery.toLowerCase().trim();
    keys = keys.filter(k => {
      const p = globalPesertaData[k];
      const nimMatch = p.nim && p.nim.toLowerCase().includes(query);
      const namaMatch = p.nama && p.nama.toLowerCase().includes(query);
      return nimMatch || namaMatch;
    });
  }

  return keys;
}

// Helper Render Baris Tabel Peserta (Dengan Filter)
function renderTabelPesertaRows() {
  const filteredKeys = getFilteredPesertaKeys();

  // Update counter total terfilter
  const countSpan = document.getElementById("total-peserta-count");
  if (countSpan) countSpan.innerText = filteredKeys.length;

  if (filteredKeys.length === 0) {
    return `<tr><td colspan="5" class="text-center py-6 text-slate-500">Tidak ada data peserta yang cocok.</td></tr>`;
  }

  return filteredKeys.map(key => {
    const p = globalPesertaData[key];
    const namaKelompok = globalKelompokData[p.kelompok_id]?.nama_kelompok || 'Tanpa Kelompok';
    const isBeingEdited = editingPesertaKey === key;

    return `
      <tr class="${isBeingEdited ? 'bg-indigo-900/40 border-l-4 border-indigo-500' : 'hover:bg-slate-750'} transition">
        <td class="py-2.5 px-3 font-mono text-indigo-300 font-semibold">${p.nim}</td>
        <td class="py-2.5 px-3 font-medium text-white">${p.nama}</td>
        <td class="py-2.5 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${p.kelas === 'Reguler' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}">
            ${p.kelas}
          </span>
        </td>
        <td class="py-2.5 px-3 text-slate-400">${namaKelompok}</td>
        <td class="py-2.5 px-3 text-center space-x-1">
          <button onclick="editPeserta('${key}')" class="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2.5 py-1 rounded transition text-[11px]">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button onclick="hapusPeserta('${key}')" class="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-2.5 py-1 rounded transition text-[11px]">
            <i class="fa-solid fa-trash"></i> Hapus
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Handler Real-time Input Search (Tanpa Re-render seluruh Form)
function handleSearchPeserta(val) {
  currentSearchQuery = val;
  const tbody = document.getElementById("tbody-peserta");
  if (tbody) {
    tbody.innerHTML = renderTabelPesertaRows();
  }
}

// Handler Change Filter Kelompok
function handleFilterKelompok(val) {
  currentFilterKelompok = val;
  const tbody = document.getElementById("tbody-peserta");
  if (tbody) {
    tbody.innerHTML = renderTabelPesertaRows();
  }
}

// Logika Simpan Kelompok
function simpanKelompok(e) {
  e.preventDefault();
  const namaInput = document.getElementById("input-nama-kelompok");
  const namaKelompok = namaInput ? namaInput.value.trim() : "";

  if (!namaKelompok) {
    showToastWarning("Nama kelompok wajib diisi!");
    return;
  }

  const newId = 'kelompok_' + Date.now();
  db.ref('kelompok/' + newId).set({
    nama_kelompok: namaKelompok,
    nilai_aspek: { kehadiran_kedisiplinan: 0, inisiatif_keaktifan: 0, komunikasi_retorika: 0 },
    poin_plus: 0,
    poin_minus: 0,
    total_skor: 0
  }).then(() => {
    if (document.getElementById("input-nama-kelompok")) {
      document.getElementById("input-nama-kelompok").value = "";
    }
    showToastSuccess(`Kelompok "${namaKelompok}" ditambahkan!`);
  }).catch((err) => {
    console.error(err);
    showToastWarning("Gagal menyimpan kelompok!");
  });
}

// Logika Simpan / Update Peserta
function simpanPeserta(e) {
  e.preventDefault();

  const editKey = document.getElementById("input-edit-key")?.value || "";
  const nim = document.getElementById("input-nim")?.value.trim() || "";
  const nama = document.getElementById("input-nama")?.value.trim() || "";
  const kelas = document.getElementById("input-kelas")?.value || "Reguler";
  const kelompokSelect = document.getElementById("input-kelompok-id");
  const kelompok_id = kelompokSelect ? kelompokSelect.value : "";

  if (!kelompok_id) {
    showToastWarning("Pilih kelompok terlebih dahulu!");
    return;
  }

  if (!nim || !nama) {
    showToastWarning("NIM dan Nama Wajib diisi!");
    return;
  }

  const keyToUse = editKey || ('peserta_' + nim.replace(/\s+/g, '_'));
  const dataExisting = globalPesertaData[keyToUse] || {};

  const payload = {
    nim: nim,
    nama: nama,
    kelas: kelas,
    kelompok_id: kelompok_id,
    nilai_aspek: dataExisting.nilai_aspek || {
      problem_solving: 0,
      kerjasama_integrasi: 0,
      manajemen_konflik: 0,
      tanggung_jawab_kemandirian: 0,
      pemahaman_organisasi: 0,
      sikap_etika: 0,
      refleksi_pengembangan: 0
    },
    poin_plus: dataExisting.poin_plus || 0,
    poin_minus: dataExisting.poin_minus || 0,
    riwayat_catatan: dataExisting.riwayat_catatan || [],
    total_skor: dataExisting.total_skor || 0
  };

  const isEdit = Boolean(editKey);

  db.ref('peserta/' + keyToUse).set(payload)
    .then(() => {
      editingPesertaKey = null;
      showToastSuccess(isEdit ? "Data peserta diperbarui!" : "Peserta berhasil ditambahkan!");
      renderTabPeserta();
    })
    .catch((err) => {
      console.error(err);
      showToastWarning("Gagal menyimpan data!");
    });
}

// Trigger Edit Peserta
function editPeserta(key) {
  if (!globalPesertaData[key]) return;
  editingPesertaKey = key;
  renderTabPeserta();
}

// Batal Edit Peserta
function batalEditPeserta() {
  editingPesertaKey = null;
  renderTabPeserta();
}

// Logika Hapus Peserta
function hapusPeserta(key) {
  const p = globalPesertaData[key];
  if (!p) return;

  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: 'Hapus Peserta?',
      text: `Yakin ingin menghapus ${p.nama} (${p.nim})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      background: '#1e293b',
      color: '#fff',
      customClass: {
        popup: 'border border-slate-700 rounded-2xl shadow-2xl'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        db.ref('peserta/' + key).remove().then(() => {
          if (editingPesertaKey === key) editingPesertaKey = null;
          showToastSuccess("Peserta berhasil dihapus!");
        });
      }
    });
  } else {
    if (confirm(`Hapus ${p.nama}?`)) {
      db.ref('peserta/' + key).remove();
    }
  }
}

// ==========================================
// 7. MENU 2: INPUT PENILAIAN (FULL TIM & INDIVIDU LENGKAP)
// ==========================================

// State Submenu Penilaian
let currentSubTabPenilaian = 'tim';
let selectedKelompokPenilaian = '';
let selectedPesertaPenilaian = '';
let currentSearchQueryIndividu = '';

// Preset Dropdown Poin Plus Kelompok
const PRESET_POIN_PLUS_TIM = [
  { label: "Seluruh anggota hadir tepat waktu (+2)", poin: 2 },
  { label: "Atribut lengkap (+2)", poin: 2 },
  { label: "Juara games (+5)", poin: 5 },
  { label: "Cekatan saat diberikan tugas (+2)", poin: 2 },
  { label: "Menyampaikan hasil diskusi secara jelas dan terstruktur (+2)", poin: 2 },
  { label: "Memberikan apresiasi/dukungan untuk kelompok lain (+1)", poin: 1 },
  { label: "Anggota kelompok aktif (+1 poin)", poin: 1 },
];

// Preset Dropdown Poin Plus Individu
const PRESET_POIN_PLUS_INDIVIDU = [
  { label: "Bertanya ke pemateri (+2)", poin: 2 },
  { label: "Menjawab pertanyaan pemateri (+3)", poin: 3 },
  { label: "Menyampaikan kesimpulan (+3)", poin: 3 },
  { label: "Volunteer maju pertama saat game/ice breaking (+4)", poin: 4 }
];

// Preset Dropdown Pelanggaran / Poin Minus (Digunakan Tim & Individu)
const PRESET_PELANGGARAN = [
  { label: "Terlambat tanpa alasan (-1)", poin: 1 },
  { label: "Tidur saat pematerian (sudah 2x ditegur) (-1)", poin: 1 },
  { label: "Meninggalkan lokasi tanpa izin (-1)", poin: 1 },
  { label: "Nametag menggunakan full AI (-1)", poin: 1 },
  { label: "Tidak menggunakan atribut (-2)", poin: 2 },
  { label: "Bermain game di HP pada saat acara berlangsung (-2)", poin: 2 },
  { label: "Mengenakan pakaian yang tidak sopan (-2)", poin: 2 },
  { label: "Membawa barang yang dilarang (-3)", poin: 3 },
  { label: "Tidak mengerjakan tugas kelompok/individu (-4)", poin: 4 },
  { label: "Melakukan tindakan provokatif, bullying, pelecehan (-5)", poin: 5 }
];

// 7 Aspek Penilaian Individu
const ASPEK_INDIVIDU_LIST = [
  { key: "problem_solving", label: "1. Problem Solving" },
  { key: "kerjasama_integrasi", label: "2. Kerjasama & Integrasi" },
  { key: "manajemen_konflik", label: "3. Manajemen Konflik" },
  { key: "tanggung_jawab_kemandirian", label: "4. Tanggung Jawab & Kemandirian" },
  { key: "pemahaman_organisasi", label: "5. Pemahaman Organisasi" },
  { key: "sikap_etika", label: "6. Sikap & Etika" },
  { key: "refleksi_pengembangan", label: "7. Refleksi & Pengembangan Diri" }
];

// Main Render Function Tab Penilaian
function renderTabPenilaian() {
  const container = document.getElementById("container-penilaian-content");
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- SUBMENU NAVIGASI TOGGLE (TIM vs INDIVIDU) -->
      <div class="flex border-b border-slate-700">
        <button onclick="switchSubTabPenilaian('tim')" 
          class="py-3 px-6 text-sm font-bold border-b-2 transition flex items-center gap-2 ${currentSubTabPenilaian === 'tim' ? 'border-indigo-500 text-indigo-400 bg-slate-800/60' : 'border-transparent text-slate-400 hover:text-white'}">
          <i class="fa-solid fa-users"></i> 1. Penilaian Tim (Kelompok)
        </button>
        <button onclick="switchSubTabPenilaian('individu')" 
          class="py-3 px-6 text-sm font-bold border-b-2 transition flex items-center gap-2 ${currentSubTabPenilaian === 'individu' ? 'border-indigo-500 text-indigo-400 bg-slate-800/60' : 'border-transparent text-slate-400 hover:text-white'}">
          <i class="fa-solid fa-user"></i> 2. Penilaian Individu (Peserta)
        </button>
      </div>

      <!-- KONTEN SUBMENU (TIM / INDIVIDU) -->
      <div id="subtab-content">
        ${currentSubTabPenilaian === 'tim' ? renderPenilaianTimContent() : renderPenilaianIndividuContent()}
      </div>

    </div>
  `;
}

// Switch Subtab
function switchSubTabPenilaian(subTab) {
  currentSubTabPenilaian = subTab;
  renderTabPenilaian();
}

// ==========================================
// A. SUBMENU 1: PENILAIAN TIM (KELOMPOK)
// ==========================================
function renderPenilaianTimContent() {
  const kelompokKeys = Object.keys(globalKelompokData);

  if (kelompokKeys.length === 0) {
    return `
      <div class="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center space-y-3">
        <i class="fa-solid fa-users-slash text-4xl text-slate-500"></i>
        <h3 class="text-white font-bold">Belum Ada Data Kelompok</h3>
        <p class="text-xs text-slate-400">Silakan buat kelompok terlebih dahulu di menu <b>1. Data Peserta & Tim</b>.</p>
      </div>
    `;
  }

  if (!selectedKelompokPenilaian || !globalKelompokData[selectedKelompokPenilaian]) {
    selectedKelompokPenilaian = kelompokKeys[0];
  }

  const kData = globalKelompokData[selectedKelompokPenilaian] || {};
  const nAspek = kData.nilai_aspek || { kehadiran_kedisiplinan: 0, inisiatif_keaktifan: 0, komunikasi_retorika: 0 };
  const poinPlus = kData.poin_plus || 0;
  const poinMinus = kData.poin_minus || 0;
  
  const totalAspekInitial = (nAspek.kehadiran_kedisiplinan || 0) + (nAspek.inisiatif_keaktifan || 0) + (nAspek.komunikasi_retorika || 0);
  const totalSkorTimInitial = totalAspekInitial + poinPlus - poinMinus;

  const listSelectKelompok = kelompokKeys.map(id => 
    `<option value="${id}" ${id === selectedKelompokPenilaian ? 'selected' : ''}>${globalKelompokData[id].nama_kelompok}</option>`
  ).join('');

  const listPresetPlusOptions = PRESET_POIN_PLUS_TIM.map((p, index) => 
    `<option value="${index}">${p.label}</option>`
  ).join('');

  const listPresetMinusOptions = PRESET_PELANGGARAN.map((p, index) => 
    `<option value="${index}">${p.label}</option>`
  ).join('');

  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- KIRI: FORM PENILAIAN KELOMPOK -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Dropdown Pilih Kelompok -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <label class="text-xs font-bold uppercase text-slate-400 whitespace-nowrap">Pilih Kelompok Yang Dinilai:</label>
          <select onchange="changeSelectedKelompok(this.value)" 
            class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-indigo-300 font-bold focus:outline-none focus:border-indigo-500 w-full sm:w-auto flex-1">
            ${listSelectKelompok}
          </select>
        </div>

        <!-- Form 3 Aspek Utama Skala 1-5 -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5 shadow-lg">
          <div class="flex justify-between items-center border-b border-slate-700 pb-3">
            <h3 class="text-md font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-star text-amber-400"></i> Aspek Penilaian Utama Tim
            </h3>
            <span class="text-[10px] bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded">Skala 1 - 5</span>
          </div>

          <form id="form-aspek-tim" onsubmit="simpanAspekTim(event)" class="space-y-5">
            
            <!-- 1. Kehadiran dan Kedisiplinan -->
            <div class="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-slate-200">1. Kehadiran & Kedisiplinan</span>
                <span class="font-bold text-indigo-400" id="val-aspek-1">${nAspek.kehadiran_kedisiplinan || 0} / 5</span>
              </div>
              <div class="flex justify-between gap-1 pt-1">
                ${[1, 2, 3, 4, 5].map(num => `
                  <label class="flex-1 text-center cursor-pointer">
                    <input type="radio" name="kehadiran_kedisiplinan" value="${num}" ${nAspek.kehadiran_kedisiplinan === num ? 'checked' : ''}
                      onchange="updateLivePreviewSkorTim()" class="peer hidden">
                    <div class="py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-500 transition">
                      ${num}
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- 2. Inisiatif dan Keaktifan -->
            <div class="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-slate-200">2. Inisiatif & Keaktifan</span>
                <span class="font-bold text-indigo-400" id="val-aspek-2">${nAspek.inisiatif_keaktifan || 0} / 5</span>
              </div>
              <div class="flex justify-between gap-1 pt-1">
                ${[1, 2, 3, 4, 5].map(num => `
                  <label class="flex-1 text-center cursor-pointer">
                    <input type="radio" name="inisiatif_keaktifan" value="${num}" ${nAspek.inisiatif_keaktifan === num ? 'checked' : ''}
                      onchange="updateLivePreviewSkorTim()" class="peer hidden">
                    <div class="py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-500 transition">
                      ${num}
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>

            <!-- 3. Komunikasi dan Retorika -->
            <div class="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-slate-200">3. Komunikasi & Retorika</span>
                <span class="font-bold text-indigo-400" id="val-aspek-3">${nAspek.komunikasi_retorika || 0} / 5</span>
              </div>
              <div class="flex justify-between gap-1 pt-1">
                ${[1, 2, 3, 4, 5].map(num => `
                  <label class="flex-1 text-center cursor-pointer">
                    <input type="radio" name="komunikasi_retorika" value="${num}" ${nAspek.komunikasi_retorika === num ? 'checked' : ''}
                      onchange="updateLivePreviewSkorTim()" class="peer hidden">
                    <div class="py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-500 transition">
                      ${num}
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>

            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-lg shadow-indigo-600/30">
              Simpan Nilai Aspek Utama
            </button>
          </form>
        </div>

        <!-- Preset Poin Plus & Pelanggaran -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-lg">
            <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-circle-plus"></i> Tambah Poin Plus Tim
            </h4>
            <div class="space-y-2">
              <select id="select-preset-plus-tim" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                ${listPresetPlusOptions}
              </select>
              <button onclick="tambahPoinPlusTim()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition">
                + Tambah Poin Plus
              </button>
            </div>
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-lg">
            <h4 class="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-triangle-exclamation"></i> Input Pelanggaran Tim
            </h4>
            <div class="space-y-2">
              <select id="select-preset-minus-tim" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500">
                ${listPresetMinusOptions}
              </select>
              <button onclick="tambahPelanggaranTim()" class="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 rounded-lg transition">
                - Potong Poin Tim
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- KANAN: CARD TOTAL REKAP SKOR KELOMPOK -->
      <div class="space-y-4">
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4 sticky top-20">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <i class="fa-solid fa-calculator text-indigo-400"></i> Rekap Perhitungan Skor Tim
          </h3>

          <div class="text-center bg-slate-900/80 p-5 rounded-2xl border border-indigo-500/30 space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Skor Akhir</span>
            <div id="rekap-total-skor" class="text-4xl font-extrabold text-indigo-400 font-mono transition-all duration-300">
              ${totalSkorTimInitial}
            </div>
            <div class="text-[11px] text-slate-400">${kData.nama_kelompok}</div>
          </div>

          <!-- Rincian Poin -->
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1.5 border-b border-slate-700/60">
              <span class="text-slate-400">Total 3 Aspek (Skala 1-5):</span>
              <span id="rekap-total-aspek" class="font-bold text-white">${totalAspekInitial} Poin</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-700/60">
              <span class="text-slate-400">Akumulasi Poin Plus:</span>
              <span class="font-bold text-emerald-400">+${poinPlus} Poin</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-700/60">
              <span class="text-slate-400">Akumulasi Poin Minus:</span>
              <span class="font-bold text-rose-400">-${poinMinus} Poin</span>
            </div>
          </div>

          <!-- Riwayat Catatan -->
          <div class="space-y-2 pt-2">
            <span class="text-[11px] font-semibold text-slate-400 block">Riwayat Catatan Tim:</span>
            <div class="max-h-40 overflow-y-auto space-y-1 text-[11px]">
              ${renderRiwayatCatatanTim(kData.riwayat_catatan || [])}
            </div>
          </div>

        </div>
      </div>

    </div>
  `;
}

// Handlers & Live Calculators Tim
function changeSelectedKelompok(id) {
  selectedKelompokPenilaian = id;
  renderTabPenilaian();
}

function updateLivePreviewSkorTim() {
  const k1 = parseInt(document.querySelector('input[name="kehadiran_kedisiplinan"]:checked')?.value || 0);
  const k2 = parseInt(document.querySelector('input[name="inisiatif_keaktifan"]:checked')?.value || 0);
  const k3 = parseInt(document.querySelector('input[name="komunikasi_retorika"]:checked')?.value || 0);

  const el1 = document.getElementById('val-aspek-1');
  const el2 = document.getElementById('val-aspek-2');
  const el3 = document.getElementById('val-aspek-3');
  
  if (el1) el1.innerText = `${k1} / 5`;
  if (el2) el2.innerText = `${k2} / 5`;
  if (el3) el3.innerText = `${k3} / 5`;

  const kData = globalKelompokData[selectedKelompokPenilaian] || {};
  const poinPlus = kData.poin_plus || 0;
  const poinMinus = kData.poin_minus || 0;

  const totalAspek = k1 + k2 + k3;
  const totalSkor = totalAspek + poinPlus - poinMinus;

  const elemTotalSkor = document.getElementById('rekap-total-skor');
  const elemTotalAspek = document.getElementById('rekap-total-aspek');

  if (elemTotalSkor) elemTotalSkor.innerText = totalSkor;
  if (elemTotalAspek) elemTotalAspek.innerText = `${totalAspek} Poin`;
}

function simpanAspekTim(e) {
  if (e) e.preventDefault();

  const kelompokId = selectedKelompokPenilaian;
  if (!kelompokId || !globalKelompokData[kelompokId]) {
    if (typeof showToastWarning === "function") showToastWarning("Pilih kelompok terlebih dahulu!");
    return;
  }

  // 1. Ambil nilai dari radio button yang dicentang (jika ada yang kosong, default ke 0)
  const radioKehadiran = document.querySelector('input[name="kehadiran_kedisiplinan"]:checked');
  const radioInisiatif = document.querySelector('input[name="inisiatif_keaktifan"]:checked');
  const radioKomunikasi = document.querySelector('input[name="komunikasi_retorika"]:checked');

  const aspek1 = radioKehadiran ? Number(radioKehadiran.value) : 0;
  const aspek2 = radioInisiatif ? Number(radioInisiatif.value) : 0;
  const aspek3 = radioKomunikasi ? Number(radioKomunikasi.value) : 0;

  // 2. Hitung total aspek baru
  const totalAspekBaru = aspek1 + aspek2 + aspek3;

  // 3. Ambil data poin plus & minus yang sudah ada sebelumnya agar tidak hilang
  const kData = globalKelompokData[kelompokId] || {};
  const poinPlus = Number(kData.poin_plus) || 0;
  const poinMinus = Number(kData.poin_minus) || 0;

  const totalSkorAkhir = totalAspekBaru + poinPlus - poinMinus;

  // 4. Update data ke Firebase Realtime Database
  const updates = {};
  updates[`kelompok/${kelompokId}/nilai_aspek`] = {
    kehadiran_kedisiplinan: aspek1,
    inisiatif_keaktifan: aspek2,
    komunikasi_retorika: aspek3
  };
  updates[`kelompok/${kelompokId}/total_skor`] = totalSkorAkhir;

  db.ref().update(updates).then(() => {
    if (typeof showToastSuccess === "function") {
      showToastSuccess("✅ Penilaian aspek tim berhasil disimpan!");
    } else {
      alert("Penilaian aspek tim berhasil disimpan!");
    }

    // 5. OTOMATIS RESET FORM & TOMBOL SKALA SETELAH DISAVE
    // Hapus centang semua radio button di form
    const formEl = document.getElementById("form-aspek-tim");
    if (formEl) formEl.reset();

    // Refresh tampilan tab penilaian agar elemen ter-render ulang bersih dari pilihan sebelumnya
    if (typeof renderTabPenilaian === "function") {
      renderTabPenilaian();
    }
  }).catch(err => {
    console.error("Gagal menyimpan penilaian tim:", err);
    if (typeof showToastWarning === "function") showToastWarning("Gagal menyimpan nilai ke database.");
  });
}

function tambahPoinPlusTim() {
  if (!selectedKelompokPenilaian) return;
  const idx = document.getElementById("select-preset-plus-tim").value;
  const item = PRESET_POIN_PLUS_TIM[idx];
  if (!item) return;

  const kData = globalKelompokData[selectedKelompokPenilaian] || {};
  const nAspek = kData.nilai_aspek || { kehadiran_kedisiplinan: 0, inisiatif_keaktifan: 0, komunikasi_retorika: 0 };
  const newPlus = (kData.poin_plus || 0) + item.poin;
  const newTotalSkor = (nAspek.kehadiran_kedisiplinan + nAspek.inisiatif_keaktifan + nAspek.komunikasi_retorika) + newPlus - (kData.poin_minus || 0);

  const riwayat = kData.riwayat_catatan || [];
  riwayat.unshift({
    jenis: 'PLUS',
    teks: item.label,
    poin: item.poin,
    waktu: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  db.ref('kelompok/' + selectedKelompokPenilaian).update({
    poin_plus: newPlus,
    total_skor: newTotalSkor,
    riwayat_catatan: riwayat
  }).then(() => {
    showToastSuccess(`Poin Plus +${item.poin} ditambahkan!`);
  });
}

function tambahPelanggaranTim() {
  if (!selectedKelompokPenilaian) return;
  const idx = document.getElementById("select-preset-minus-tim").value;
  const item = PRESET_PELANGGARAN[idx];
  if (!item) return;

  const kData = globalKelompokData[selectedKelompokPenilaian] || {};
  const nAspek = kData.nilai_aspek || { kehadiran_kedisiplinan: 0, inisiatif_keaktifan: 0, komunikasi_retorika: 0 };
  const newMinus = (kData.poin_minus || 0) + item.poin;
  const newTotalSkor = (nAspek.kehadiran_kedisiplinan + nAspek.inisiatif_keaktifan + nAspek.komunikasi_retorika) + (kData.poin_plus || 0) - newMinus;

  const riwayat = kData.riwayat_catatan || [];
  riwayat.unshift({
    jenis: 'MINUS',
    teks: item.label,
    poin: item.poin,
    waktu: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  db.ref('kelompok/' + selectedKelompokPenilaian).update({
    poin_minus: newMinus,
    total_skor: newTotalSkor,
    riwayat_catatan: riwayat
  }).then(() => {
    showToastWarning(`Poin Tim Dipotong -${item.poin}`);
  });
}

function renderRiwayatCatatanTim(catatanList) {
  if (catatanList.length === 0) {
    return `<div class="text-slate-500 italic text-[10px]">Belum ada catatan poin plus/minus.</div>`;
  }

  return catatanList.map(c => `
    <div class="p-1.5 rounded bg-slate-900 border ${c.jenis === 'PLUS' ? 'border-emerald-500/30 text-emerald-300' : 'border-rose-500/30 text-rose-300'} flex justify-between items-center">
      <span>${c.teks}</span>
      <span class="text-[9px] font-mono text-slate-400 ml-2">${c.waktu}</span>
    </div>
  `).join('');
}


// ==========================================
// B. SUBMENU 2: PENILAIAN INDIVIDU (PESERTA)
// ==========================================
function renderPenilaianIndividuContent() {
  const pesertaKeys = Object.keys(globalPesertaData);

  if (pesertaKeys.length === 0) {
    return `
      <div class="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center space-y-3">
        <i class="fa-solid fa-user-slash text-4xl text-slate-500"></i>
        <h3 class="text-white font-bold">Belum Ada Data Peserta</h3>
        <p class="text-xs text-slate-400">Silakan tambahkan peserta terlebih dahulu di menu <b>1. Data Peserta & Tim</b>.</p>
      </div>
    `;
  }

  let filteredKeys = pesertaKeys;
  if (currentSearchQueryIndividu.trim() !== '') {
    const q = currentSearchQueryIndividu.toLowerCase().trim();
    filteredKeys = pesertaKeys.filter(k => {
      const p = globalPesertaData[k];
      return (p.nim && p.nim.toLowerCase().includes(q)) || (p.nama && p.nama.toLowerCase().includes(q));
    });
  }

  if (!selectedPesertaPenilaian || !globalPesertaData[selectedPesertaPenilaian]) {
    selectedPesertaPenilaian = filteredKeys.length > 0 ? filteredKeys[0] : pesertaKeys[0];
  }

  const pData = globalPesertaData[selectedPesertaPenilaian] || {};
  
  // Ambil nilai aspek tersimpan (jika belum ada, default 0 semua)
  const nAspek = pData.nilai_aspek || {
    problem_solving: 0,
    kerjasama_integrasi: 0,
    manajemen_konflik: 0,
    tanggung_jawab_kemandirian: 0,
    pemahaman_organisasi: 0,
    sikap_etika: 0,
    refleksi_pengembangan: 0
  };

  const poinPlus = pData.poin_plus || 0;
  const poinMinus = pData.poin_minus || 0;

  // Hitung total aspek dari nilai yang tersimpan di database
  let totalAspekInitial = 0;
  ASPEK_INDIVIDU_LIST.forEach(a => {
    totalAspekInitial += (Number(nAspek[a.key]) || 0);
  });
  const totalSkorIndividuInitial = totalAspekInitial + poinPlus - poinMinus;

  const namaKelompok = globalKelompokData[pData.kelompok_id]?.nama_kelompok || 'Tanpa Kelompok';

  const listSelectPeserta = filteredKeys.map(id => {
    const p = globalPesertaData[id];
    return `<option value="${id}" ${id === selectedPesertaPenilaian ? 'selected' : ''}>${p.nim} - ${p.nama}</option>`;
  }).join('') || `<option value="">-- Tidak ditemukan --</option>`;

  const listPresetPlusOptions = PRESET_POIN_PLUS_INDIVIDU.map((p, index) => 
    `<option value="${index}">${p.label}</option>`
  ).join('');

  const listPresetMinusOptions = PRESET_PELANGGARAN.map((p, index) => 
    `<option value="${index}">${p.label}</option>`
  ).join('');

  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- KIRI: SEARCH & FORM 7 ASPEK INDIVIDU -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- BARIS SEARCH & DROPDOWN PILIH PESERTA -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-lg">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <div class="relative w-full sm:w-64">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
              <input type="text" id="input-search-peserta-penilaian" placeholder="Cari NIM / Nama..." value="${currentSearchQueryIndividu}"
                oninput="handleSearchPesertaPenilaian(this.value)"
                class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500">
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto flex-1">
              <label class="text-xs font-bold uppercase text-slate-400 whitespace-nowrap">Pilih Peserta:</label>
              <select id="select-peserta-penilaian" onchange="changeSelectedPeserta(this.value)" 
                class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-indigo-300 font-bold focus:outline-none focus:border-indigo-500 w-full">
                ${listSelectPeserta}
              </select>
            </div>

          </div>
        </div>

        <!-- Form 7 Aspek Utama Skala 1-5 -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5 shadow-lg">
          <div class="flex justify-between items-center border-b border-slate-700 pb-3">
            <h3 class="text-md font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-star-half-stroke text-amber-400"></i> Form 7 Aspek Penilaian Individu
            </h3>
            <span class="text-[10px] bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded">Skala 1 - 5</span>
          </div>

          <form id="form-aspek-individu" onsubmit="simpanAspekIndividu(event)" class="space-y-4">
            
            ${ASPEK_INDIVIDU_LIST.map((asp) => {
              const currentVal = Number(nAspek[asp.key]) || 0;
              return `
                <div class="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-slate-200">${asp.label}</span>
                    <span class="font-bold text-indigo-400" id="val-asp-${asp.key}">${currentVal} / 5</span>
                  </div>
                  <div class="flex justify-between gap-1 pt-1">
                    ${[1, 2, 3, 4, 5].map(num => `
                      <label class="flex-1 text-center cursor-pointer">
                        <input type="radio" name="${asp.key}" value="${num}" ${currentVal === num ? 'checked' : ''}
                          onchange="updateLivePreviewSkorIndividu()" class="peer hidden">
                        <div class="py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-500 transition">
                          ${num}
                        </div>
                      </label>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}

            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-lg shadow-indigo-600/30">
              Simpan 7 Aspek Individu
            </button>
          </form>
        </div>

        <!-- Preset Poin Plus & Pelanggaran -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-lg">
            <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-circle-plus"></i> Tambah Poin Plus Individu
            </h4>
            <div class="space-y-2">
              <select id="select-preset-plus-individu" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                ${listPresetPlusOptions}
              </select>
              <button onclick="tambahPoinPlusIndividu()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition">
                + Tambah Poin Plus
              </button>
            </div>
          </div>

          <div class="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 shadow-lg">
            <h4 class="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-triangle-exclamation"></i> Input Pelanggaran Peserta
            </h4>
            <div class="space-y-2">
              <select id="select-preset-minus-individu" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500">
                ${listPresetMinusOptions}
              </select>
              <button onclick="tambahPelanggaranIndividu()" class="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 rounded-lg transition">
                - Potong Poin Peserta
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- KANAN: CARD TOTAL REKAP SKOR INDIVIDU -->
      <div class="space-y-4">
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4 sticky top-20">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <i class="fa-solid fa-user-check text-indigo-400"></i> Rekap Perhitungan Peserta
          </h3>

          <div class="text-center bg-slate-900/80 p-5 rounded-2xl border border-indigo-500/30 space-y-1">
            <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Skor Akhir</span>
            <div id="rekap-total-skor-ind" class="text-4xl font-extrabold text-indigo-400 font-mono transition-all duration-300">
              ${totalSkorIndividuInitial}
            </div>
            <div id="rekap-nama-ind" class="text-xs font-bold text-white pt-1">${pData.nama || '-'}</div>
            <div id="rekap-info-ind" class="text-[11px] text-slate-400 font-mono">NIM: ${pData.nim || '-'} | ${namaKelompok}</div>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1.5 border-b border-slate-700/60">
              <span class="text-slate-400">Total 7 Aspek (Maks 35):</span>
              <span id="rekap-total-aspek-ind" class="font-bold text-white">${totalAspekInitial} Poin</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-700/60">
              <span class="text-slate-400">Akumulasi Poin Plus:</span>
              <span id="rekap-poin-plus-ind" class="font-bold text-emerald-400">+${poinPlus} Poin</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-slate-700/60">
              <span class="text-slate-400">Akumulasi Poin Minus:</span>
              <span id="rekap-poin-minus-ind" class="font-bold text-rose-400">-${poinMinus} Poin</span>
            </div>
          </div>

          <div class="space-y-2 pt-2">
            <span class="text-[11px] font-semibold text-slate-400 block">Riwayat Catatan Peserta:</span>
            <div id="rekap-riwayat-ind" class="max-h-40 overflow-y-auto space-y-1 text-[11px]">
              ${renderRiwayatCatatanTim(pData.riwayat_catatan || [])}
            </div>
          </div>

        </div>
      </div>

    </div>
  `;
}

// Handlers & Live Calculators Individu
function handleSearchPesertaPenilaian(val) {
  currentSearchQueryIndividu = val;
  const selectElem = document.getElementById("select-peserta-penilaian");
  if (!selectElem) return;

  const pesertaKeys = Object.keys(globalPesertaData);
  let filteredKeys = pesertaKeys;

  if (val.trim() !== '') {
    const q = val.toLowerCase().trim();
    filteredKeys = pesertaKeys.filter(k => {
      const p = globalPesertaData[k];
      return (p.nim && p.nim.toLowerCase().includes(q)) || (p.nama && p.nama.toLowerCase().includes(q));
    });
  }

  selectElem.innerHTML = filteredKeys.map(id => {
    const p = globalPesertaData[id];
    return `<option value="${id}" ${id === selectedPesertaPenilaian ? 'selected' : ''}>${p.nim} - ${p.nama}</option>`;
  }).join('') || `<option value="">-- Tidak ditemukan --</option>`;

  if (filteredKeys.length > 0 && !filteredKeys.includes(selectedPesertaPenilaian)) {
    selectedPesertaPenilaian = filteredKeys[0];
    selectElem.value = selectedPesertaPenilaian;
    updateFormDanRekapIndividu(selectedPesertaPenilaian);
  }
}

function changeSelectedPeserta(id) {
  if (!id) return;
  selectedPesertaPenilaian = id;

  // Render ulang seluruh konten tab penilaian individu agar form radio button 
  // di sebelah kiri benar-benar memuat data murni milik peserta yang baru dipilih.
  const container = document.getElementById("container-penilaian-content");
  if (container && typeof renderPenilaianIndividuContent === "function") {
    container.innerHTML = renderPenilaianIndividuContent();
  }

  // Jika sistem kamu juga memiliki fungsi update terpisah untuk rekap kanan, panggil juga:
  if (typeof updateFormDanRekapIndividu === "function") {
    updateFormDanRekapIndividu(id);
  }
}

function updateFormDanRekapIndividu(id) {
  const pData = globalPesertaData[id];
  if (!pData) return;

  const nAspek = pData.nilai_aspek || {
    problem_solving: 0, kerjasama_integrasi: 0, manajemen_konflik: 0,
    tanggung_jawab_kemandirian: 0, pemahaman_organisasi: 0, sikap_etika: 0, refleksi_pengembangan: 0
  };
  const poinPlus = pData.poin_plus || 0;
  const poinMinus = pData.poin_minus || 0;
  const namaKelompok = globalKelompokData[pData.kelompok_id]?.nama_kelompok || 'Tanpa Kelompok';

  let totalAspek = 0;
  ASPEK_INDIVIDU_LIST.forEach(asp => {
    const val = nAspek[asp.key] || 0;
    totalAspek += val;

    const radio = document.querySelector(`input[name="${asp.key}"][value="${val}"]`);
    if (radio) radio.checked = true;

    const lbl = document.getElementById(`val-asp-${asp.key}`);
    if (lbl) lbl.innerText = `${val} / 5`;
  });

  const totalSkor = totalAspek + poinPlus - poinMinus;

  const elSkor = document.getElementById('rekap-total-skor-ind');
  const elNama = document.getElementById('rekap-nama-ind');
  const elInfo = document.getElementById('rekap-info-ind');
  const elAspek = document.getElementById('rekap-total-aspek-ind');
  const elPlus = document.getElementById('rekap-poin-plus-ind');
  const elMinus = document.getElementById('rekap-poin-minus-ind');
  const elRiwayat = document.getElementById('rekap-riwayat-ind');

  if (elSkor) elSkor.innerText = totalSkor;
  if (elNama) elNama.innerText = pData.nama || '-';
  if (elInfo) elInfo.innerText = `NIM: ${pData.nim || '-'} | ${namaKelompok}`;
  if (elAspek) elAspek.innerText = `${totalAspek} Poin`;
  if (elPlus) elPlus.innerText = `+${poinPlus} Poin`;
  if (elMinus) elMinus.innerText = `-${poinMinus} Poin`;
  if (elRiwayat) elRiwayat.innerHTML = renderRiwayatCatatanTim(pData.riwayat_catatan || []);
}

function updateLivePreviewSkorIndividu() {
  let totalAspek = 0;
  ASPEK_INDIVIDU_LIST.forEach(asp => {
    const val = parseInt(document.querySelector(`input[name="${asp.key}"]:checked`)?.value || 0);
    totalAspek += val;
    const el = document.getElementById(`val-asp-${asp.key}`);
    if (el) el.innerText = `${val} / 5`;
  });

  const pData = globalPesertaData[selectedPesertaPenilaian] || {};
  const poinPlus = pData.poin_plus || 0;
  const poinMinus = pData.poin_minus || 0;
  const totalSkor = totalAspek + poinPlus - poinMinus;

  const elSkor = document.getElementById('rekap-total-skor-ind');
  const elAspek = document.getElementById('rekap-total-aspek-ind');

  if (elSkor) elSkor.innerText = totalSkor;
  if (elAspek) elAspek.innerText = `${totalAspek} Poin`;
}

function simpanAspekIndividu(e) {
  if (e) e.preventDefault();

  const pesertaId = selectedPesertaPenilaian;
  if (!pesertaId || !globalPesertaData[pesertaId]) {
    if (typeof showToastWarning === "function") showToastWarning("Pilih peserta terlebih dahulu!");
    return;
  }

  // 1. Ambil nilai dari 7 aspek yang dipilih (jika kosong, bernilai 0)
  const nilaiAspekBaru = {};
  let totalAspekBaru = 0;

  ASPEK_INDIVIDU_LIST.forEach(asp => {
    const radioSelected = document.querySelector(`input[name="${asp.key}"]:checked`);
    const val = radioSelected ? Number(radioSelected.value) : 0;
    nilaiAspekBaru[asp.key] = val;
    totalAspekBaru += val;
  });

  // 2. Ambil data poin plus & minus saat ini agar tidak terhapus
  const pData = globalPesertaData[pesertaId] || {};
  const poinPlus = Number(pData.poin_plus) || 0;
  const poinMinus = Number(pData.poin_minus) || 0;
  
  // Total skor akhir dihitung dari total 7 aspek baru + poin plus - poin minus
  const totalSkorAkhir = totalAspekBaru + poinPlus - poinMinus;

  // 3. Simpan nilai aspek dan total skor ke Firebase secara spesifik berdasarkan ID peserta
  const updates = {};
  updates[`peserta/${pesertaId}/nilai_aspek`] = nilaiAspekBaru;
  updates[`peserta/${pesertaId}/total_skor`] = totalSkorAkhir;

  db.ref().update(updates).then(() => {
    if (typeof showToastSuccess === "function") {
      showToastSuccess("✅ Penilaian 7 aspek individu berhasil disimpan!");
    } else {
      alert("Penilaian 7 aspek individu berhasil disimpan!");
    }

    // Refresh tampilan agar data tersimpan rapi dan form menampilkan histori peserta tersebut dengan benar
    if (typeof renderTabPenilaian === "function") {
      renderTabPenilaian();
    }
  }).catch(err => {
    console.error("Gagal menyimpan aspek individu:", err);
    if (typeof showToastWarning === "function") showToastWarning("Gagal menyimpan nilai ke database.");
  });
}

function tambahPoinPlusIndividu() {
  if (!selectedPesertaPenilaian) return;
  const idx = document.getElementById("select-preset-plus-individu").value;
  const item = PRESET_POIN_PLUS_INDIVIDU[idx];
  if (!item) return;

  const pData = globalPesertaData[selectedPesertaPenilaian] || {};
  const nAspek = pData.nilai_aspek || {};
  
  let totalAspek = 0;
  ASPEK_INDIVIDU_LIST.forEach(asp => totalAspek += (nAspek[asp.key] || 0));

  const newPlus = (pData.poin_plus || 0) + item.poin;
  const newTotalSkor = totalAspek + newPlus - (pData.poin_minus || 0);

  const riwayat = pData.riwayat_catatan || [];
  riwayat.unshift({
    jenis: 'PLUS',
    teks: item.label,
    poin: item.poin,
    waktu: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  db.ref('peserta/' + selectedPesertaPenilaian).update({
    poin_plus: newPlus,
    total_skor: newTotalSkor,
    riwayat_catatan: riwayat
  }).then(() => {
    showToastSuccess(`Poin Plus +${item.poin} ditambahkan!`);
  });
}

function tambahPelanggaranIndividu() {
  if (!selectedPesertaPenilaian) return;
  const idx = document.getElementById("select-preset-minus-individu").value;
  const item = PRESET_PELANGGARAN[idx];
  if (!item) return;

  const pData = globalPesertaData[selectedPesertaPenilaian] || {};
  const nAspek = pData.nilai_aspek || {};

  let totalAspek = 0;
  ASPEK_INDIVIDU_LIST.forEach(asp => totalAspek += (nAspek[asp.key] || 0));

  const newMinus = (pData.poin_minus || 0) + item.poin;
  const newTotalSkor = totalAspek + (pData.poin_plus || 0) - newMinus;

  const riwayat = pData.riwayat_catatan || [];
  riwayat.unshift({
    jenis: 'MINUS',
    teks: item.label,
    poin: item.poin,
    waktu: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  db.ref('peserta/' + selectedPesertaPenilaian).update({
    poin_minus: newMinus,
    total_skor: newTotalSkor,
    riwayat_catatan: riwayat
  }).then(() => {
    showToastWarning(`Poin Peserta Dipotong -${item.poin}`);
  });
}

// ==========================================
// 8. MENU 3: PANDUAN & RUBRIK PENILAIAN
// ==========================================
function renderTabPanduan() {
  const container = document.getElementById("container-panduan-content");
  if (!container) return;

  container.innerHTML = `
    <div class="space-y-6 max-w-6xl mx-auto pb-10">
      
      <!-- BANNER CARA PENGISIAN RINGKAS -->
      <div class="bg-gradient-to-r from-indigo-900/60 to-slate-800 border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-indigo-600/30 text-indigo-400 rounded-xl text-2xl">
            <i class="fa-solid fa-lightbulb"></i>
          </div>
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-white">Tata Cara Pengisian Nilai Panitia</h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              Penilaian dilakukan secara obyektif selama 2 hari acara PROSPEX IF 2026. Setiap aspek dinilai dengan <b>skala 1 sampai 5</b>. Poin Plus & Minus menggunakan preset tombol instan agar homogen di seluruh pendamping kelompok.
            </p>
          </div>
        </div>
      </div>

      <!-- ACUAN STANDAR SKALA 1 - 5 -->
      <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
        <h4 class="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <i class="fa-solid fa-sliders text-indigo-400"></i> Standar Indikator Skala Penilaian (1 - 5)
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div class="bg-slate-900/80 border border-rose-500/30 p-3 rounded-xl space-y-1">
            <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">SKALA 1</span>
            <div class="font-bold text-white">Sangat Kurang</div>
            <p class="text-slate-400 text-[11px]">Pasif total, melanggar instruksi, tidak responsif, atau tidak membawa atribut utama.</p>
          </div>

          <div class="bg-slate-900/80 border border-amber-500/30 p-3 rounded-xl space-y-1">
            <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">SKALA 2</span>
            <div class="font-bold text-white">Kurang</div>
            <p class="text-slate-400 text-[11px]">Cenderung pasif, perlu didorong/ditegur dahulu baru bergerak, respon lambat.</p>
          </div>

          <div class="bg-slate-900/80 border border-slate-700 p-3 rounded-xl space-y-1">
            <span class="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-bold text-[10px]">SKALA 3</span>
            <div class="font-bold text-white">Cukup (Standar)</div>
            <p class="text-slate-400 text-[11px]">Mengikuti rangkaian acara dengan baik, standar, tidak menonjol tapi tidak membuat pelanggaran.</p>
          </div>

          <div class="bg-slate-900/80 border border-blue-500/30 p-3 rounded-xl space-y-1">
            <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">SKALA 4</span>
            <div class="font-bold text-white">Baik / Aktif</div>
            <p class="text-slate-400 text-[11px]">Proaktif dalam diskusi kelompok, antusias, atribut rapi, dan komunikatif.</p>
          </div>

          <div class="bg-slate-900/80 border border-emerald-500/30 p-3 rounded-xl space-y-1">
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">SKALA 5</span>
            <div class="font-bold text-white">Sangat Baik</div>
            <p class="text-slate-400 text-[11px]">Sangat menonjol, menjadi initiator/leader, membantu panitia & teman, retorika bagus.</p>
          </div>
        </div>
      </div>

      <!-- RUBRIK PENILAIAN TIM & INDIVIDU -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- RUBRIK ASPEK TIM -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
          <div class="flex items-center justify-between border-b border-slate-700 pb-3">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-users text-indigo-400"></i> Panduan 3 Aspek Tim (Kelompok)
            </h4>
            <span class="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-500/20">Skala 1-5</span>
          </div>

          <div class="space-y-3 text-xs">
            <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
              <div class="font-semibold text-indigo-300">1. Kehadiran & Kedisiplinan</div>
              <p class="text-slate-400">Diisi berdasarkan ketepatan waktu datang seluruh anggota kelompok, kerapihan barisan, dan kelengkapan atribut tim.</p>
            </div>

            <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
              <div class="font-semibold text-indigo-300">2. Inisiatif & Keaktifan</div>
              <p class="text-slate-400">Diisi berdasarkan kekompakan saat ice breaking/game, inisiatif respon tugas kelompok, dan antusiasme yel-yel.</p>
            </div>

            <div class="bg-slate-900/60 p-3 rounded-lg border border-slate-700/60 space-y-1">
              <div class="font-semibold text-indigo-300">3. Komunikasi & Retorika</div>
              <p class="text-slate-400">Diisi berdasarkan kualitas penyampaian hasil diskusi kelompok di depan forum serta koordinasi internal tim.</p>
            </div>
          </div>
        </div>

        <!-- RUBRIK ASPEK INDIVIDU -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
          <div class="flex items-center justify-between border-b border-slate-700 pb-3">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-user-check text-indigo-400"></i> Panduan 7 Aspek Individu (Peserta)
            </h4>
            <span class="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-500/20">Skala 1-5</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
              <div class="font-semibold text-indigo-300">1. Problem Solving</div>
              <p class="text-slate-400 text-[11px]">Kemampuan mencari solusi saat diberi studi kasus/tantangan kelompok.</p>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
              <div class="font-semibold text-indigo-300">2. Kerjasama & Integrasi</div>
              <p class="text-slate-400 text-[11px]">Bisa membaur, tidak individualis, dan mau merangkul anggota tim lain.</p>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
              <div class="font-semibold text-indigo-300">3. Manajemen Konflik</div>
              <p class="text-slate-400 text-[11px]">Sikap tenang saat ada perbedaan pendapat dalam dinamika kelompok.</p>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
              <div class="font-semibold text-indigo-300">4. Tanggung Jawab & Kemandirian</div>
              <p class="text-slate-400 text-[11px]">Menyelesaikan tugas individu/kelompok tanpa perlu selalu diorak-arik.</p>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
              <div class="font-semibold text-indigo-300">5. Pemahaman Organisasi</div>
              <p class="text-slate-400 text-[11px]">Daya tangkap terhadap materi keorganisasian/FTI yang disampaikan.</p>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60">
              <div class="font-semibold text-indigo-300">6. Sikap & Etika</div>
              <p class="text-slate-400 text-[11px]">Kesopanan ucapan, menghormati panitia/pemateri, dan gesture tubuh.</p>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/60 sm:col-span-2">
              <div class="font-semibold text-indigo-300">7. Refleksi & Pengembangan Diri</div>
              <p class="text-slate-400 text-[11px]">Kemauan menerima masukan/kritik pendamping dan menunjukkan perbaikan sikap.</p>
            </div>
          </div>
        </div>

      </div>

      <!-- TABEL DAFTAR PRESET POIN PLUS & MINUS HARDCODED -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- POIN PLUS INDIVIDU -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-3">
          <h4 class="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <i class="fa-solid fa-circle-plus"></i> Preset Poin Plus Individu
          </h4>
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900 text-slate-400 font-semibold border-b border-slate-700">
              <tr><th class="py-2 px-2">Aksi Peserta</th><th class="py-2 px-2 text-right">Poin</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-700/50 text-[11px]">
              <tr><td class="py-2 px-2">Bertanya ke pemateri</td><td class="py-2 px-2 text-right font-bold text-emerald-400">+2</td></tr>
              <tr><td class="py-2 px-2">Menjawab pertanyaan pemateri</td><td class="py-2 px-2 text-right font-bold text-emerald-400">+3</td></tr>
              <tr><td class="py-2 px-2">Menyampaikan kesimpulan</td><td class="py-2 px-2 text-right font-bold text-emerald-400">+3</td></tr>
              <tr><td class="py-2 px-2">Volunteer maju pertama saat game</td><td class="py-2 px-2 text-right font-bold text-emerald-400">+4</td></tr>
            </tbody>
          </table>
        </div>

        <!-- POIN PLUS KELOMPOK -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-3">
          <h4 class="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <i class="fa-solid fa-users-rectangle"></i> Preset Poin Plus Kelompok
          </h4>
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-slate-900 text-slate-400 font-semibold border-b border-slate-700">
              <tr><th class="py-2 px-2">Aksi Tim</th><th class="py-2 px-2 text-right">Poin</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-700/50 text-[11px]">
              <tr><td class="py-2 px-2">Seluruh anggota hadir tepat waktu</td><td class="py-2 px-2 text-right font-bold text-emerald-400">+2</td></tr>
              <tr><td class="py-2 px-2">Atribut lengkap</td><td class="py-2 px-2 text-right font-bold text-emerald-400">+2</td></tr>
              <tr><td class="py-2 px-2">Juara games</td><td class="py-2 px-2 text-right font-bold text-emerald-400">+5</td></tr>
              <tr><td class="py-2 px-2">Cekatan saat diberikan tugas</td><td class="py-2 px-2 text-right font-bold text-emerald-400">+2</td></tr>
              <tr><td class="py-2 px-2">Menyampaikan hasil diskusi jelas</td><td class="py-2 px-2 text-right font-bold text-emerald-400">+2</td></tr>
              <tr><td class="py-2 px-2">Memberi apresiasi ke kelompok lain</td><td class="py-2 px-2 text-right font-bold text-emerald-400">+1</td></tr>
            </tbody>
          </table>
        </div>

        <!-- POIN MINUS / PELANGGARAN -->
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-3">
          <h4 class="text-sm font-bold text-rose-400 flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation"></i> Preset Pelanggaran (Poin Minus)
          </h4>
          <div class="max-h-56 overflow-y-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-900 text-slate-400 font-semibold border-b border-slate-700 sticky top-0">
                <tr><th class="py-2 px-2">Jenis Pelanggaran</th><th class="py-2 px-2 text-right">Minus</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-700/50 text-[11px]">
                <tr><td class="py-1.5 px-2">Terlambat tanpa alasan</td><td class="py-1.5 px-2 text-right font-bold text-rose-400">-1</td></tr>
                <tr><td class="py-1.5 px-2">Tidur saat pematerian (2x tegur)</td><td class="py-1.5 px-2 text-right font-bold text-rose-400">-1</td></tr>
                <tr><td class="py-1.5 px-2">Meninggalkan lokasi tanpa izin</td><td class="py-1.5 px-2 text-right font-bold text-rose-400">-1</td></tr>
                <tr><td class="py-1.5 px-2">Nametag menggunakan full AI</td><td class="py-1.5 px-2 text-right font-bold text-rose-400">-1</td></tr>
                <tr><td class="py-1.5 px-2">Tidak menggunakan atribut</td><td class="py-1.5 px-2 text-right font-bold text-rose-400">-2</td></tr>
                <tr><td class="py-1.5 px-2">Bermain game HP saat acara</td><td class="py-1.5 px-2 text-right font-bold text-rose-400">-2</td></tr>
                <tr><td class="py-1.5 px-2">Pakaian tidak sopan</td><td class="py-1.5 px-2 text-right font-bold text-rose-400">-2</td></tr>
                <tr><td class="py-1.5 px-2">Membawa barang dilarang</td><td class="py-1.5 px-2 text-right font-bold text-rose-400">-3</td></tr>
                <tr><td class="py-1.5 px-2">Tidak mengerjakan tugas</td><td class="py-1.5 px-2 text-right font-bold text-rose-400">-4</td></tr>
                <tr><td class="py-1.5 px-2">Provokatif / Bullying / Harassment</td><td class="py-1.5 px-2 text-right font-bold text-rose-400">-5</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  `;
}

// ==========================================
// FUNGSI NAVIGASI TAB UTAMA (SAFE SWITCH)
// ==========================================
function switchTab(tabName) {
  // 1. Sembunyikan semua section tab
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(el => el.classList.add('hidden'));

  // 2. Reset style tombol sidebar
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-slate-800', 'text-white');
    btn.classList.add('text-slate-300');
  });

  // 3. Tampilkan tab yang dipilih
  const targetTab = document.getElementById('tab-' + tabName);
  if (targetTab) {
    targetTab.classList.remove('hidden');
  }

  // 4. Highlight tombol sidebar aktif
  const activeNav = document.getElementById('nav-' + tabName);
  if (activeNav) {
    activeNav.classList.add('bg-slate-800', 'text-white');
  }

  // 5. Render isi konten tab secara aman
  try {
    if (tabName === 'peserta' && typeof renderTabPeserta === 'function') renderTabPeserta();
    if (tabName === 'penilaian' && typeof renderTabPenilaian === 'function') renderTabPenilaian();
    if (tabName === 'panduan' && typeof renderTabPanduan === 'function') renderTabPanduan();
    if (tabName === 'terbaik' && typeof renderTabPesertaTerbaik === 'function') renderTabPesertaTerbaik();
  } catch (err) {
    console.error("Gagal merender tab:", err);
  }
}

// ==========================================
// MENU 4: SHOW PESERTA TERBAIK (SPOTLIGHT REVEAL)
// ==========================================
let currentSubTabTerbaik = 'individu';
let isTop1RevealedIndividu = false;
let isTop1RevealedKelompok = false;

function renderTabPesertaTerbaik() {
  const container = document.getElementById("container-terbaik-content");
  if (!container) return;

  const isRevealed = currentSubTabTerbaik === 'individu' ? isTop1RevealedIndividu : isTop1RevealedKelompok;
  const cardHTML = currentSubTabTerbaik === 'individu' ? renderCardJuara1Individu() : renderCardJuara1Kelompok();

  container.innerHTML = `
    <div class="space-y-6 max-w-2xl mx-auto pb-10">
      
      <!-- SUBMENU KATEGORI & TOMBOL REVEAL -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-700 pb-4">
        <div class="flex border border-slate-700 rounded-xl p-1 bg-slate-900/80 w-full sm:w-auto">
          <button onclick="switchSubTabTerbaik('individu')" 
            class="flex-1 sm:flex-initial py-2 px-5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${currentSubTabTerbaik === 'individu' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
            <i class="fa-solid fa-crown text-amber-400"></i> Juara 1 Individu
          </button>
          <button onclick="switchSubTabTerbaik('kelompok')" 
            class="flex-1 sm:flex-initial py-2 px-5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${currentSubTabTerbaik === 'kelompok' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
            <i class="fa-solid fa-trophy text-amber-400"></i> Juara 1 Kelompok
          </button>
        </div>

        <button onclick="toggleRevealTop1()" 
          class="w-full sm:w-auto ${isRevealed ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'} font-black text-xs px-6 py-2.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 active:scale-95">
          <i class="fa-solid ${isRevealed ? 'fa-lock' : 'fa-wand-magic-sparkles'}"></i>
          <span>${isRevealed ? 'Tutup Rahasia Pemenang' : '🎉 REVEAL JUARA 1 NOW!'}</span>
        </button>
      </div>

      <!-- KONTEN SPOTLIGHT CARD -->
      <div class="pt-2">
        ${cardHTML}
      </div>

    </div>
  `;
}

function switchSubTabTerbaik(tab) {
  currentSubTabTerbaik = tab;
  renderTabPesertaTerbaik();
}

function toggleRevealTop1() {
  if (currentSubTabTerbaik === 'individu') {
    isTop1RevealedIndividu = !isTop1RevealedIndividu;
    if (isTop1RevealedIndividu && typeof showToastSuccess === "function") showToastSuccess("🎉 JUARA 1 INDIVIDU REVEALED!");
  } else {
    isTop1RevealedKelompok = !isTop1RevealedKelompok;
    if (isTop1RevealedKelompok && typeof showToastSuccess === "function") showToastSuccess("🏆 JUARA 1 KELOMPOK REVEALED!");
  }
  renderTabPesertaTerbaik();
}

function renderCardJuara1Individu() {
  let data = {};
  if (typeof globalPesertaData !== 'undefined' && globalPesertaData) {
    data = globalPesertaData;
  }
  const pesertaKeys = Object.keys(data);

  if (pesertaKeys.length === 0) {
    return `
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-2">
        <i class="fa-solid fa-trophy text-3xl text-amber-500 mb-1"></i>
        <h4 class="text-white font-bold text-sm">Belum Ada Data Peserta</h4>
        <p class="text-slate-400 text-xs">Silakan input data peserta di Menu 1 terlebih dahulu.</p>
      </div>
    `;
  }

  const sorted = pesertaKeys.map(k => data[k]).sort((a, b) => (Number(b.total_skor) || 0) - (Number(a.total_skor) || 0));
  const top1 = sorted[0] || {};
  let kData = {};
  if (typeof globalKelompokData !== 'undefined' && globalKelompokData) {
    kData = globalKelompokData;
  }
  const namaKelompok = (top1.kelompok_id && kData[top1.kelompok_id]) ? kData[top1.kelompok_id].nama_kelompok : 'Tanpa Kelompok';

  if (!isTop1RevealedIndividu) {
    return `
      <div onclick="toggleRevealTop1()" class="cursor-pointer bg-slate-800 border-2 border-dashed border-amber-500/50 rounded-3xl p-10 text-center space-y-6 shadow-2xl hover:border-amber-400 transition transform hover:-translate-y-1">
        <div class="w-24 h-24 mx-auto rounded-full bg-slate-900 border-4 border-amber-500/30 flex items-center justify-center text-4xl text-amber-400 animate-bounce">
          👑
        </div>
        <div class="space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">CONFIDENTIAL</span>
          <h2 class="text-2xl font-black text-white italic">??? SECRET WINNER ???</h2>
          <p class="text-xs text-slate-400">Klik kartu ini atau tombol di atas untuk membuka rahasia pemenang!</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-gradient-to-b from-amber-950/70 via-slate-800 to-slate-900 border-2 border-amber-400 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden transition transform">
      <div class="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs px-5 py-1.5 rounded-full uppercase tracking-widest shadow-md">
        <i class="fa-solid fa-crown"></i> JUARA 1 INDIVIDU TERBAIK
      </div>
      <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-2xl">
        <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-5xl">👑</div>
      </div>
      <div class="space-y-2">
        <h2 class="text-3xl font-black text-amber-300 tracking-tight">${top1.nama || '-'}</h2>
        <div class="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-300">
          <span class="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">NIM: ${top1.nim || '-'}</span>
          <span class="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">${namaKelompok}</span>
          <span class="bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 uppercase">${top1.kelas || '-'}</span>
        </div>
      </div>
      <div class="bg-slate-900/90 py-3 px-6 rounded-2xl border border-amber-500/40 shadow-inner max-w-xs mx-auto space-y-0.5">
        <span class="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Total Perolehan Skor</span>
        <div class="text-4xl font-black text-amber-400 font-mono">${top1.total_skor || 0} <span class="text-xs font-sans text-amber-200">POIN</span></div>
      </div>
      <div class="text-[10px] text-slate-400 italic">PROSPEX IF 2026 Winner</div>
    </div>
  `;
}

function renderCardJuara1Kelompok() {
  let data = {};
  if (typeof globalKelompokData !== 'undefined' && globalKelompokData) {
    data = globalKelompokData;
  }
  const kelompokKeys = Object.keys(data);

  if (kelompokKeys.length === 0) {
    return `
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-2">
        <i class="fa-solid fa-users text-3xl text-indigo-400 mb-1"></i>
        <h4 class="text-white font-bold text-sm">Belum Ada Data Kelompok</h4>
        <p class="text-slate-400 text-xs">Silakan buat kelompok di Menu 1 terlebih dahulu.</p>
      </div>
    `;
  }

  const sorted = kelompokKeys.map(k => data[k]).sort((a, b) => (Number(b.total_skor) || 0) - (Number(a.total_skor) || 0));
  const top1 = sorted[0] || {};

  if (!isTop1RevealedKelompok) {
    return `
      <div onclick="toggleRevealTop1()" class="cursor-pointer bg-slate-800 border-2 border-dashed border-indigo-500/50 rounded-3xl p-10 text-center space-y-6 shadow-2xl hover:border-indigo-400 transition transform hover:-translate-y-1">
        <div class="w-24 h-24 mx-auto rounded-full bg-slate-900 border-4 border-indigo-500/30 flex items-center justify-center text-4xl text-indigo-400 animate-bounce">
          🏆
        </div>
        <div class="space-y-2">
          <span class="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">CONFIDENTIAL</span>
          <h2 class="text-2xl font-black text-white italic">??? SECRET TEAM ???</h2>
          <p class="text-xs text-slate-400">Klik kartu ini atau tombol di atas untuk membuka rahasia pemenang!</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-gradient-to-b from-indigo-950/70 via-slate-800 to-slate-900 border-2 border-indigo-400 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden transition transform">
      <div class="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-blue-400 text-white font-black text-xs px-5 py-1.5 rounded-full uppercase tracking-widest shadow-md">
        <i class="fa-solid fa-trophy text-yellow-300"></i> JUARA 1 KELOMPOK TERBAIK
      </div>
      <div class="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-indigo-600 to-blue-400 p-1 shadow-2xl">
        <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-5xl">🏆</div>
      </div>
      <div class="space-y-2">
        <h2 class="text-3xl font-black text-indigo-300 tracking-tight">${top1.nama_kelompok || '-'}</h2>
        <p class="text-xs text-slate-400">Kelompok Dengan Kekompakan & Performa Terbaik</p>
      </div>
      <div class="bg-slate-900/90 py-3 px-6 rounded-2xl border border-indigo-500/40 shadow-inner max-w-xs mx-auto space-y-0.5">
        <span class="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Total Perolehan Skor Tim</span>
        <div class="text-4xl font-black text-indigo-400 font-mono">${top1.total_skor || 0} <span class="text-xs font-sans text-indigo-200">POIN</span></div>
      </div>
      <div class="text-[10px] text-slate-400 italic">PROSPEX IF 2026 Winner</div>
    </div>
  `;
}