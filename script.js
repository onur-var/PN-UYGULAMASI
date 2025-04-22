// --- Firebase Konfigürasyonu ---
const firebaseConfig = {
  apiKey: "AIzaSyDltb5FbPvL9bLgj_GK4_DEDaPK0A7oM_g",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "1Ati7Jpwzh1sIVdRw6cj9WZgdl16js-zNMScaFyJEIw0",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();
const db = firebase.firestore();

// (Eski Google Sheets okuma fonksiyonlarınızı koruyabilirsiniz)
// ... fetchSheetData(), populateFilters(), populateTable(), filterTable() ...

document.addEventListener("DOMContentLoaded", () => {
  fetchSheetData();
  document.getElementById('saveBtn').addEventListener('click', uploadAndSave);
});

let selectedFile = null;

function handleFile(files) {
  selectedFile = files[0];
  if (!selectedFile) return;
  document.getElementById('preview').src = URL.createObjectURL(selectedFile);
}

async function uploadAndSave() {
  // 1) Form alanlarını oku
  const name = document.getElementById('partName').value.trim();
  const num  = document.getElementById('partNumber').value.trim();
  const type = document.getElementById('aircraftType').value.trim();
  const region = document.getElementById('region').value.trim();
  if (!name || !num || !type || !region || !selectedFile) {
    alert('Tüm alanları ve resmi eklediğinizden emin olun!');
    return;
  }

  // 2) Firebase Storage'a yolla
  const path = `parts/${Date.now()}_${selectedFile.name}`;
  const storageRef = storage.ref(path);
  const snapshot = await storageRef.put(selectedFile);
  const downloadURL = await snapshot.ref.getDownloadURL();

  // 3) Firestore'a kaydet
  await db.collection('parts').add({
    partName: name,
    partNumber: num,
    aircraftType: type,
    region: region,
    imageUrl: downloadURL,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  // 4) Formu temizle ve tabloyu yenile
  ['partName','partNumber','aircraftType','region'].forEach(id => document.getElementById(id).value='');
  document.getElementById('preview').src = '';
  selectedFile = null;
  fetchSheetData(); // Veya doğrudan Firestore'dan çekerek tabloyu yenile

  alert('Yeni parça kaydedildi ✅');
}

// (Orijinal Google Sheets okuma fonksiyonlarınız burada çalışmaya devam eder)
