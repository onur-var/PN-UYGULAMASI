/**
 * HTTP POST ile gelen JSON verisini Google Sheets'e ekler.
 * Deploy → Yeni sürüm oluştur → Web app olarak dağıt → Erişimi "Anyone, even anonymous" olarak ayarla.
 */
function doPost(e) {
  try {
    const sheetId = '1Ati7Jpwzh1sIVdRw6cj9WZgdl16js-zNMScaFyJEIw0'; // Google Sheet ID
    const sheetName = 'Sayfa1';
    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(sheetName);

    // Yeni satır ekle (A:E kolon sırasına uygun)
    sheet.appendRow([
      data.partName,
      data.partNumber,
      data.aircraftType,
      data.region,
      data.imageUrl
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
