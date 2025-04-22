// Google Sheets API Ayarları
const SHEET_ID = '1Ati7Jpwzh1sIVdRw6cj9WZgdl16js-zNMScaFyJEIw0'; // Google Sheet ID
const API_KEY = 'AIzaSyDltb5FbPvL9bLgj_GK4_DEDaPK0A7oM_g'; // API anahtarı
const RANGE = 'Sayfa1!A1:E'; // Sheet aralığı

// Google Sheets verilerini çek
async function fetchSheetData() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.values) {
            populateTable(data.values);
        } else {
            throw new Error("Gelen veri boş.");
        }
    } catch (error) {
        console.error("API'den veri alınırken hata oluştu:", error.message);
    }
}

// Tabloyu filtreler ve filtre satırını oluşturur
function populateFilters(data) {
    const filterRow = document.getElementById("filterRow");
    filterRow.innerHTML = "";

    const columns = data[0]; // Başlıklar
    columns.forEach((_, colIndex) => {
        const filterCell = document.createElement("th");
        const select = document.createElement("select");
        select.className = "filter-select";
        select.dataset.column = colIndex;

        const optionAll = document.createElement("option");
        optionAll.value = "";
        optionAll.textContent = "Tümü";
        select.appendChild(optionAll);

        const uniqueValues = [...new Set(data.slice(1).map(row => row[colIndex] || ""))];
        uniqueValues.sort().forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value || "(Boş)";
            select.appendChild(option);
        });

        select.addEventListener("change", filterTable);
        filterCell.appendChild(select);
        filterRow.appendChild(filterCell);
    });
}

// Tabloyu doldur ve filtreleri oluştur
function populateTable(data) {
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    data.slice(1).forEach(row => {
        const tr = document.createElement("tr");
        row.forEach(cell => {
            const td = document.createElement("td");
            td.textContent = cell || "";
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    populateFilters(data); // Filtreleri doldur
}

// Tabloyu filtreler
function filterTable() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#dataTable tbody tr");
    const filters = Array.from(document.querySelectorAll(".filter-select"));

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        let matches = true;

        filters.forEach(select => {
            const colIndex = parseInt(select.dataset.column, 10);
            const filterValue = select.value;

            // Filtreleme şartı: Eğer "Tümü" seçilirse ya da hücre değeri filtreyle eşleşirse
            const cellValue = cells[colIndex]?.textContent || "";
            if (filterValue && cellValue !== filterValue) {
                matches = false;
            }
        });

        const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(" ");
        if (searchInput && !rowText.includes(searchInput)) {
            matches = false;
        }

        row.style.display = matches ? "" : "none";
    });
}

// Sayfa yüklendiğinde verileri çek
document.addEventListener("DOMContentLoaded", fetchSheetData);
