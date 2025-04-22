// Firebase Storage Bağlantısı
const firebaseConfig = {
  apiKey: "AIzaSyDltb5FbPvL9bLgj_GK4_DEDaPK0A7oM_g",
  authDomain: "1Ati7Jpwzh1sIVdRw6cj9WZgdl16js-zNMScaFyJEIw0.firebaseapp.com",
  projectId: "1Ati7Jpwzh1sIVdRw6cj9WZgdl16js-zNMScaFyJEIw0",
  storageBucket: "1Ati7Jpwzh1sIVdRw6cj9WZgdl16js-zNMScaFyJEIw0.appspot.com",
};
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();

// Google Sheets Apps Script Web App URL
const SHEET_ENDPOINT = 'https://script.google.com/macros/s/WEB_APP_DEPLOYMENT_ID/exec';

// Google Sheets verilerini çekmek (var olan kod)
const SHEET_ID = '1Ati7Jpwzh1sIVdRw6cj9WZgdl16js-zNMScaFyJEIw0';
const API_KEY = 'AIzaSyDltb5FbPvL9bLgj_GK4_DEDaPK0A7oM_g';
const RANGE = 'Sayfa1!A1:E';

async function fetchSheetData() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.values) populateTable(data.values);
}

// populateFilters(), populateTable(), filterTable() fonksiyonlarınız aynı kalır

// File seçimi ile preview ve seçili dosyayı saklama
let selectedFile = null;
function handleFile(files) {
  selectedFile = files[0];
  document.getElementById('preview').src = URL.createObjectURL(selectedFile);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchSheetData();
  document.getElementById('saveBtn').addEventListener('click', uploadAndSave);
});

async function uploadAndSave() {
  const name = document.getElementById('partName').value.trim();
  const num  = document.getElementById('partNumber').value.trim();
  const type = document.getElementById('aircraftType').value.trim();
  const region = document.getElementById('region').value.trim();
  if (!name || !num || !type || !region || !selectedFile) {
    alert('Tüm alanları ve resmi eklediğinizden emin olun!');
    return;
  }

  // 1) Firebase Storage'a yükle
  const path = `parts/${Date.now()}_${selectedFile.name}`;
  const snapshot = await storage.ref(path).put(selectedFile);
  const imageUrl = await snapshot.ref.getDownloadURL();

  // 2) Apps Script endpoint'e POST at
  const payload = { partName: name, partNumber: num, aircraftType: type, region: region, imageUrl };
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

  // 3) Temizle ve tabloyu yenile
  ['partName','partNumber','aircraftType','region'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('preview').src = '';
  selectedFile = null;
  fetchSheetData();

  alert('Yeni parça Google Sheet'e eklendi ✅');
}
