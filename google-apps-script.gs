/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - ĐỌC NGUỒN FETCHRSS FANPAGE ĐIỂM RÈN LUYỆN UMP
 * ============================================================================
 * Hướng dẫn cài đặt 3 bước (Miễn phí vĩnh viễn):
 * 1. Truy cập https://script.google.com -> Bấm "Dự án mới" (New Project).
 * 2. Xóa code cũ, dán toàn bộ đoạn mã này vào và bấm Lưu (Ctrl+S).
 * 3. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment):
 *    - Loại: Ứng dụng web (Web app)
 *    - Thực thi dưới danh nghĩa: Tôi (Me)
 *    - Ai có quyền truy cập: Bất kỳ ai (Anyone)
 *    -> Sao chép URL Web App và dán vào mục Cài đặt (⚙) trên Sổ Tay ĐRL UMP.
 */

const RSS_FEED_URL = 'https://fetchrss.com/feed/1xUeuz6Ji5iM1xUev7GNf6eQ.rss';
const SOURCE_NAME = 'Điểm Rèn Luyện UMP';

// (Tùy chọn) ID Google Sheet dự phòng (Cột A: Tiêu đề | B: Link | C: Ngày yyyy-mm-dd | D: Nguồn)
const BACKUP_SHEET_ID = '';
const BACKUP_SHEET_NAME = 'TinDRL';

function doGet(e) {
  const results = [];

  // 1. Đọc và phân tích XML từ FetchRSS
  try {
    results.push(...fetchFromFetchRss(RSS_FEED_URL));
  } catch (err) {
    Logger.log('Lỗi đọc FetchRSS: ' + err);
  }

  // 2. Kết hợp thêm tin từ Google Sheet dự phòng (nếu có cấu hình)
  if (BACKUP_SHEET_ID) {
    try {
      results.push(...fetchFromGoogleSheet(BACKUP_SHEET_ID, BACKUP_SHEET_NAME));
    } catch (err) {
      Logger.log('Lỗi đọc Google Sheet: ' + err);
    }
  }

  // Loại bỏ trùng lặp theo link/id
  const uniqueMap = {};
  results.forEach(item => {
    const key = item.link || item.id || item.title;
    if (key && !uniqueMap[key]) {
      uniqueMap[key] = item;
    }
  });

  const nowMs = Date.now();
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

  // Chỉ giữ lại các bài đăng trong vòng 5 ngày gần nhất, sắp xếp mới nhất lên đầu
  const filteredItems = Object.values(uniqueMap)
    .filter(item => (nowMs - (item.timestamp || 0)) <= fiveDaysMs)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const payload = {
    status: 'ok',
    updatedAt: new Date().toISOString(),
    items: filteredItems
  };

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Tải và phân tích XML RSS từ FetchRSS bằng XmlService
 */
function fetchFromFetchRss(rssUrl) {
  const response = UrlFetchApp.fetch(rssUrl, {
    muteHttpExceptions: true,
    followRedirects: true
  });
  if (response.getResponseCode() !== 200) return [];

  const xmlText = response.getContentText('UTF-8');
  const document = XmlService.parse(xmlText);
  const root = document.getRootElement();
  const channel = root.getChild('channel');
  if (!channel) return [];

  const itemEls = channel.getChildren('item');
  const items = [];
  const now = new Date();

  itemEls.forEach((el, idx) => {
    const rawTitle = el.getChildText('title') || '';
    const link = (el.getChildText('link') || '').trim();
    const guid = (el.getChildText('guid') || '').trim();
    const rawDesc = el.getChildText('description') || '';
    const pubDateStr = (el.getChildText('pubDate') || '').trim();

    const cleanSummary = cleanHtmlText(rawDesc);
    const title = cleanHtmlText(rawTitle) || (cleanSummary ? cleanSummary.slice(0, 110) : 'Bài đăng mới từ Điểm Rèn Luyện UMP');
    const summary = cleanSummary || title;

    let postDate = now;
    if (pubDateStr) {
      const parsed = new Date(pubDateStr);
      if (!isNaN(parsed.getTime())) {
        postDate = parsed;
      }
    }

    const timestamp = postDate.getTime();
    const isoDate = Utilities.formatDate(postDate, 'GMT+7', 'yyyy-MM-dd');
    const id = guid || link || ('rss_' + timestamp + '_' + idx);

    items.push({
      id: id,
      title: title,
      summary: summary.slice(0, 280),
      link: link || 'https://www.facebook.com/diemrenluyenump',
      date: isoDate,
      timestamp: timestamp,
      source: SOURCE_NAME
    });
  });

  return items;
}

/**
 * Làm sạch thẻ HTML thừa (<br>, <p>, <img>...) và giải mã HTML entities
 */
function cleanHtmlText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Đọc thêm tin từ Google Sheet dự phòng (Cột A: Tiêu đề | B: Link | C: Ngày yyyy-mm-dd | D: Nguồn)
 */
function fetchFromGoogleSheet(sheetId, sheetName) {
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
  const rows = sheet.getDataRange().getValues();
  const items = [];
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    const title = String(rows[i][0] || '').trim();
    const link = String(rows[i][1] || '').trim();
    const dateVal = rows[i][2];
    const source = String(rows[i][3] || SOURCE_NAME).trim();
    if (!title) continue;

    let isoDate = Utilities.formatDate(now, 'GMT+7', 'yyyy-MM-dd');
    let ts = now.getTime();
    if (dateVal instanceof Date) {
      isoDate = Utilities.formatDate(dateVal, 'GMT+7', 'yyyy-MM-dd');
      ts = dateVal.getTime();
    } else if (typeof dateVal === 'string' && dateVal.trim()) {
      isoDate = dateVal.trim();
      const parsed = Date.parse(isoDate);
      if (!isNaN(parsed)) ts = parsed;
    }

    items.push({
      id: 'sheet_' + i + '_' + isoDate,
      title: title,
      summary: title,
      link: link || 'https://www.facebook.com/diemrenluyenump',
      date: isoDate,
      timestamp: ts,
      source: source
    });
  }
  return items;
}
