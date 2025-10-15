// Google Apps Script untuk integrasi CATAT dengan Google Sheets
// Salin kode ini ke Apps Script di Google Sheets Anda

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getBorrowData') {
    return getBorrowData();
  } else if (action === 'getActiveBorrowers') {
    return getActiveBorrowers();
  } else if (action === 'testTelegram') {
    // Endpoint sederhana untuk menguji konfigurasi Telegram
    sendTelegramMessage('<b>Tes Notifikasi</b>\nPesan ini dikirim dari Apps Script.');
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Tes Telegram dikirim (cek Executions log bila tidak ada notifikasi)'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === 'addBorrowData') {
    return addBorrowData(data.data);
  } else if (action === 'updateReturnData') {
    return updateReturnData(data.data);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'Invalid action'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== Telegram Notification Utilities =====
function getTelegramConfig() {
  // Prefer Script Properties; fallback to hardcoded token provided by user
  // Set these via: Apps Script Editor > Project Settings > Script properties
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_BOT_TOKEN') || '8093630882:AAGdSK2S3wR26-6C0zGi1lXzUePcri5IQlM';
  const chatId = props.getProperty('TELEGRAM_CHAT_ID');
  return { token: token, chatId: chatId };
}

function sendTelegramMessage(text) {
  try {
    const cfg = getTelegramConfig();
    if (!cfg.token || !cfg.chatId) {
      Logger.log('Telegram not configured: missing token or chatId');
      return;
    }
    const url = 'https://api.telegram.org/bot' + cfg.token + '/sendMessage';
    const payload = {
      chat_id: cfg.chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };
    const params = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const resp = UrlFetchApp.fetch(url, params);
    Logger.log('Telegram response: ' + resp.getResponseCode() + ' ' + resp.getContentText());
  } catch (err) {
    Logger.log('Telegram error: ' + err);
  }
}

// Wrapper untuk menjalankan tes dari Apps Script (Run > testTelegramMessage)
function testTelegramMessage() {
  sendTelegramMessage('<b>Tes Notifikasi</b>\nTes manual via menu Run.');
}

function getBorrowData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Peminjaman');
    
    // Ensure ID column exists
    ensureIdColumnExists(sheet);
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Skip header row
    const headers = values[0];
    const data = [];
    
    // Find Status Pengembalian column index
    const statusColumnIndex = headers.indexOf('Status Pengembalian');
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // Filter: hanya ambil baris dengan Status Pengembalian != "Sudah"
      if (statusColumnIndex !== -1 && row[statusColumnIndex] === 'Sudah') {
        continue; // Skip baris yang sudah dikembalikan
      }
      
      const item = {};
      
      for (let j = 0; j < headers.length; j++) {
        item[headers[j]] = row[j];
      }
      
      // Use existing ID or row index as fallback
      if (!item.ID || item.ID === '') {
        item.id = i + 1;
      } else {
        item.id = item.ID;
      }
      
      // Tambahkan properti returned untuk kompatibilitas dengan frontend
      item.returned = row[statusColumnIndex] || '';
      
      data.push(item);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: data,
      message: `${data.length} peminjam aktif ditemukan`
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Function khusus untuk mengambil peminjam aktif saja (sesuai saran user)
function getActiveBorrowers() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Peminjaman');
    const data = sheet.getDataRange().getValues();
    
    const activeBorrowers = data
      .slice(1) // skip header
      .filter(row => row[8] !== "Sudah") // kolom I (Status Pengembalian) adalah index 8 (0-based)
      .map(row => ({
        id: row[0] || `temp_${Date.now()}_${Math.random()}`,
        name: `${row[1]} - ${row[4]}`, // Nama Lengkap + Tanggal Peminjaman
        fullName: row[1],
        borrowDate: row[4],
        status: row[8] || 'Belum'
      }));
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: activeBorrowers,
      count: activeBorrowers.length,
      message: `${activeBorrowers.length} peminjam aktif ditemukan`
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to ensure ID column exists
function ensureIdColumnExists(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Check if ID column exists
  if (!headers.includes('ID')) {
    // Add ID column as the first column
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue('ID');
    
    // Add IDs to existing rows
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      for (let i = 2; i <= lastRow; i++) {
        const uniqueId = Utilities.getUuid();
        sheet.getRange(i, 1).setValue(uniqueId);
      }
    }
  }
}

function addBorrowData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Peminjaman');
    
    // Ensure ID column exists
    ensureIdColumnExists(sheet);
    
    // Generate unique ID
    const uniqueId = Utilities.getUuid();
    
    // Add new row with ID
    sheet.appendRow([
      uniqueId,  // ID unik
      data.fullName,
      data.unit,
      data.contact,
      data.borrowDate,
      data.items,
      data.condition,
      data.purpose,
      'Belum',  // Status pengembalian
      '',       // Tanggal pengembalian
      '',       // Kondisi saat dikembalikan
      ''        // Catatan
    ]);
    
    // Send Telegram notification for new borrow
    const itemList = Array.isArray(data.items) ? data.items.join(', ') : data.items;
    const borrowText = '<b>Peminjaman Baru</b>\n'
      + 'Nama: ' + (data.fullName || '-') + '\n'
      + 'Unit: ' + (data.unit || '-') + '\n'
      + 'Kontak: ' + (data.contact || '-') + '\n'
      + 'Tanggal: ' + (data.borrowDate || '-') + '\n'
      + 'Barang: ' + (itemList || '-') + '\n'
      + 'Kondisi Awal: ' + (data.condition || '-') + '\n'
      + 'Tujuan: ' + (data.purpose || '-') + '\n'
      + 'Status: Belum\n'
      + 'ID: ' + uniqueId;
    sendTelegramMessage(borrowText);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data berhasil disimpan',
      id: uniqueId
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateReturnData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Peminjaman');
    
    // Ensure ID column exists
    ensureIdColumnExists(sheet);
    
    // Find row by ID
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    let rowIndex = -1;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.id) {
        rowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Data peminjam tidak ditemukan'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update row with return data
    sheet.getRange(rowIndex, 9).setValue('Sudah');  // Status pengembalian (kolom 9 karena ada ID di kolom 1)
    sheet.getRange(rowIndex, 10).setValue(data.returnDate);  // Tanggal pengembalian
    sheet.getRange(rowIndex, 11).setValue(data.returnCondition);  // Kondisi saat dikembalikan
    sheet.getRange(rowIndex, 12).setValue(data.notes);  // Catatan
    
    // Compose and send Telegram notification for return
    const originalRow = values[rowIndex - 1];
    const returnText = '<b>Pengembalian Barang</b>\n'
      + 'Nama: ' + (originalRow[1] || '-') + '\n'
      + 'Barang: ' + (originalRow[5] || '-') + '\n'
      + 'Tanggal Pinjam: ' + (originalRow[4] || '-') + '\n'
      + 'Tanggal Kembali: ' + (data.returnDate || '-') + '\n'
      + 'Kondisi Kembali: ' + (data.returnCondition || '-') + '\n'
      + 'Catatan: ' + (data.notes || '-') + '\n'
      + 'ID: ' + data.id;
    sendTelegramMessage(returnText);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data pengembalian berhasil disimpan'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}