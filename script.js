// --- Firebase Storage Bağlantısı ---
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
};
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();

// --- Google Sheets Web App Endpoint ---
const SHEET_ENDPOINT = 'https://script.google.com/macros/s/WEB_APP_DEPLOYMENT_ID/exec';

// --- Google Sheets Okuma Ayarları ---
const SHEET_ID = '1Ati7Jpwzh1sIVdRw6cj9WZgdl16js-zNMScaFyJEIw0';
const API_KEY = 'AIzaSyDltb5FbPvL9bLgj_GK4_DEDaPK0A7oM_g';
const RANGE = 'Sayfa1!A1:E';

async function fetchSheetData() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.values) {
    populateTable(data.values);
    populateFilters(data.values);
  }
}

// Tabloyu doldur
function populateTable(data) {
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';

  data.slice(1).forEach(row => {
    const tr = document.createElement('tr');
    row.forEach((cell, i) => {
      const td = document.createElement('td');
      if (i === 4 && cell) {
        const img = document.createElement('img');
        img.src = cell;
        img.className = 'cell-img';
        td.appendChild(img);
      } else {
        td.textContent = cell || '';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// Filtre seçeneklerini oluştur
function populateFilters(data) {
  const filterRow = document.getElementById('filterRow');
  filterRow.innerHTML = '';
  const columns = data[0];

  columns.forEach((_, colIndex) => {
    const th = document.createElement('th');
    const select = document.createElement('select');
    select.className = 'filter-select';
    select.dataset.column = colIndex;

    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = 'Tümü';
    select.appendChild(allOpt);

    const values = [...new Set(data.slice(1).map(r => r[colIndex] || ''))].sort();
    values.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val || '(Boş)';
      select.appendChild(opt);
    });

    select.addEventListener('change', filterTable);
    th.appendChild(select);
    filterRow.appendChild(th);
  });
}

// Arama + filtreleme
function filterTable() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filters = Array.from(document.querySelectorAll('.filter-select'));
  document.querySelectorAll('#dataTable tbody tr').forEach(tr => {
    const cells = Array.from(tr.children);
    let visible = true;

    filters.forEach(f => {
      const idx = +f.dataset.column;
      const val = f.value;
      if (val && cells[idx].textContent !== val) visible = false;
    });

    if (search && !tr.textContent.toLowerCase().includes(search)) visible = false;
    tr.style.display = visible ? '' : 'none';
  });
}

// Dosya seçimi
let selectedFile = null;
function handleFile(files) {
  selectedFile = files[0];
  document.getElementById('preview').src = URL.createObjectURL(selectedFile);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchSheetData();
  document.getElementById('saveBtn').addEventListener('click', uploadAndSave);
});

// Upload & Sheet'e kaydet
async function uploadAndSave() {
  const partName = document.getElementById('partName').value.trim();
  const partNumber = document.getElementById('partNumber').value.trim();
  const aircraftType = document.getElementById('aircraftType').value.trim();
  const region = document.getElementById('region').value.trim();
  if (!partName || !partNumber || !aircraftType || !region || !selectedFile) {
    alert('Tüm alanları ve resmi eklediğinizden emin olun!');
    return;
  }

  // Storage'a yükle
  const path = `parts/${Date.now()}_${selectedFile.name}`;
  const snap = await storage.ref(path).put(selectedFile);
  const imageUrl = await snap.ref.getDownloadURL();

  // Apps Script'e gönder
  const payload = { partName, partNumber, aircraftType, region, imageUrl };
  const res = await fetch(SHEET_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await res.json();
  if (result.status !== 'success') {
    alert('Sheet kaydı sırasında hata: ' + result.message);
    return;
  }

  // Form temizle ve yeniden çek
  ['partName','partNumber','aircraftType','region'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('preview').src = '';
  selectedFile = null;
  fetchSheetData();
  alert('Yeni parça Google Sheet’e eklendi ✅');
}
