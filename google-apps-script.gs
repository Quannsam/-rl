/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - TRẠM LẤY TIN ĐRL ĐHYD TP.HCM (MIỄN PHÍ VĨNH VIỄN)
 * ============================================================================
 * Hướng dẫn cài đặt 3 bước (chỉ mất 2 phút):
 * 1. Truy cập https://script.google.com -> Bấm "Dự án mới" (New Project).
 * 2. Xóa code cũ, dán toàn bộ đoạn mã này vào và bấm Lưu (Ctrl+S).
 * 3. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment):
 *    - Loại: Ứng dụng web (Web app)
 *    - Thực thi dưới danh nghĩa: Tôi (Me)
 *    - Ai có quyền truy cập: Bất kỳ ai (Anyone)
 *    -> Sao chép URL Web App và dán vào mục Cài đặt (⚙) trên Sổ Tay ĐRL UMP.
 */

// (Tùy chọn) Nếu bạn có Google Sheet riêng để Ban Cán sự lớp nhập tin, điền ID Sheet vào đây:
const BACKUP_SHEET_ID = '';
const BACKUP_SHEET_NAME = 'TinDRL';

function doGet(e) {
  const results = [];

  // 1. Quét thông báo mới nhất từ Cổng thông tin Phòng CTSV ĐHYD TP.HCM
  try {
    results.push(...fetchUmpAnnouncements('https://ctsv.ump.edu.vn', 'Phòng CTSV UMP'));
  } catch (err) {
    Logger.log('Lỗi quét ctsv.ump.edu.vn: ' + err);
  }

  // 2. Quét thông báo từ Trang chủ ĐHYD TP.HCM
  try {
    results.push(...fetchUmpAnnouncements('https://ump.edu.vn', 'ĐHYD TP.HCM'));
  } catch (err) {
    Logger.log('Lỗi quét ump.edu.vn: ' + err);
  }

  // 3. Đọc thêm tin từ Google Sheet dự phòng (nếu có cấu hình)
  if (BACKUP_SHEET_ID) {
    try {
      results.push(...fetchFromGoogleSheet(BACKUP_SHEET_ID, BACKUP_SHEET_NAME));
    } catch (err) {
      Logger.log('Lỗi đọc Google Sheet: ' + err);
    }
  }

  // Loại bỏ trùng lặp theo link và sắp xếp mới nhất lên đầu
  const uniqueMap = {};
  results.forEach(item => {
    const key = item.link || item.title;
    if (key && !uniqueMap[key]) {
      uniqueMap[key] = item;
    }
  });

  const finalItems = Object.values(uniqueMap)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 20);

  return ContentService
    .createTextOutput(JSON.stringify(finalItems))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Quét danh sách bài viết công khai từ trang tin UMP
 */
function fetchUmpAnnouncements(baseUrl, sourceName) {
  const response = UrlFetchApp.fetch(baseUrl, {
    muteHttpExceptions: true,
    followRedirects: true
  });
  if (response.getResponseCode() !== 200) return [];

  const html = response.getContentText('UTF-8');
  const items = [];
  const today = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');

  // Tìm các thẻ <a href="..."> có tiêu đề thông báo/hoạt động
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1].trim();
    const rawText = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    if (!rawText || rawText.length < 22 || rawText.length > 220) continue;
    if (href.startsWith('#') || href.startsWith('javascript:')) continue;

    // Lọc các từ khóa liên quan đến thông báo sinh viên, rèn luyện, học bổng, hoạt động
    const lower = rawText.toLowerCase();
    const isRelevant =
      lower.includes('rèn luyện') ||
      lower.includes('thông báo') ||
      lower.includes('sinh viên') ||
      lower.includes('học bổng') ||
      lower.includes('hiến máu') ||
      lower.includes('tình nguyện') ||
      lower.includes('hội thảo') ||
      lower.includes('nghiên cứu') ||
      lower.includes('khảo sát') ||
      lower.includes('kế hoạch');

    if (!isRelevant) continue;

    if (href.startsWith('/')) {
      href = baseUrl.replace(/\/$/, '') + href;
    } else if (!href.startsWith('http')) {
      href = baseUrl.replace(/\/$/, '') + '/' + href;
    }

    // Trích xuất ngày nếu có dạng dd/mm/yyyy gần đó
    const dateMatch = rawText.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    const isoDate = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : today;

    items.push({
      title: rawText,
      link: href,
      date: isoDate,
      source: sourceName
    });
  }

  return items.slice(0, 10);
}

/**
 * Đọc danh sách tin từ Google Sheet dự phòng (Cột: Tiêu đề | Link | Ngày yyyy-mm-dd | Nguồn)
 */
function fetchFromGoogleSheet(sheetId, sheetName) {
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
  const rows = sheet.getDataRange().getValues();
  const items = [];

  for (let i = 1; i < rows.length; i++) {
    const title = String(rows[i][0] || '').trim();
    const link = String(rows[i][1] || '').trim();
    let dateVal = rows[i][2];
    const source = String(rows[i][3] || 'Ban Cán sự Lớp').trim();

    if (!title) continue;

    let isoDate = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
    if (dateVal instanceof Date) {
      isoDate = Utilities.formatDate(dateVal, 'GMT+7', 'yyyy-MM-dd');
    } else if (typeof dateVal === 'string' && dateVal.trim()) {
      isoDate = dateVal.trim();
    }

    items.push({
      title: title,
      link: link || 'https://ctsv.ump.edu.vn',
      date: isoDate,
      source: source
    });
  }
  return items;
}
