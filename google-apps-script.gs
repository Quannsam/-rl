/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - TRẠM LẤY TIN FANPAGE ĐIỂM RÈN LUYỆN UMP (MIỄN PHÍ)
 * Nguồn duy nhất: https://www.facebook.com/diemrenluyenump
 * ============================================================================
 * Hướng dẫn cài đặt 3 bước:
 * 1. Truy cập https://script.google.com -> Bấm "Dự án mới" (New Project).
 * 2. Xóa code cũ, dán toàn bộ đoạn mã này vào và bấm Lưu (Ctrl+S).
 * 3. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment):
 *    - Loại: Ứng dụng web (Web app)
 *    - Thực thi dưới danh nghĩa: Tôi (Me)
 *    - Ai có quyền truy cập: Bất kỳ ai (Anyone)
 *    -> Sao chép URL Web App và dán vào mục Cài đặt (⚙) trên Sổ Tay ĐRL UMP.
 */

// (Tùy chọn) ID Google Sheet dự phòng (Cột A: Tiêu đề | B: Link | C: Ngày yyyy-mm-dd | D: Nguồn)
const BACKUP_SHEET_ID = '';
const BACKUP_SHEET_NAME = 'TinDRL';

const FB_PAGE_URL = 'https://www.facebook.com/diemrenluyenump';
const FB_MBASIC_URL = 'https://mbasic.facebook.com/diemrenluyenump';
const SOURCE_LABEL = 'Điểm Rèn Luyện UMP';

function doGet(e) {
  const results = [];

  // 1. Thử lấy các bài đăng công khai mới nhất từ mbasic.facebook.com/diemrenluyenump
  try {
    results.push(...fetchFacebookPublicPosts(FB_MBASIC_URL));
  } catch (err) {
    Logger.log('Lỗi quét mbasic.facebook.com: ' + err);
  }

  // 2. Nếu chưa có bài, thử thêm từ www.facebook.com/diemrenluyenump
  if (results.length === 0) {
    try {
      results.push(...fetchFacebookPublicPosts(FB_PAGE_URL));
    } catch (err) {
      Logger.log('Lỗi quét www.facebook.com: ' + err);
    }
  }

  // 3. Nguồn dự phòng từ Google Sheet (nếu Facebook tạm chặn IP máy chủ Google)
  if (BACKUP_SHEET_ID) {
    try {
      results.push(...fetchFromGoogleSheet(BACKUP_SHEET_ID, BACKUP_SHEET_NAME));
    } catch (err) {
      Logger.log('Lỗi đọc Google Sheet: ' + err);
    }
  }

  // Loại bỏ trùng lặp theo link hoặc tiêu đề
  const uniqueMap = {};
  results.forEach(item => {
    const key = (item.link || '') + '::' + (item.title || '').slice(0, 60);
    if (item.title && !uniqueMap[key]) {
      uniqueMap[key] = item;
    }
  });

  const nowMs = Date.now();
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

  // Sắp xếp mới nhất lên đầu, ưu tiên bài trong 5 ngày gần nhất
  const allSorted = Object.values(uniqueMap)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const recent5Days = allSorted.filter(item => (nowMs - (item.timestamp || 0)) <= fiveDaysMs);
  const finalItems = (recent5Days.length > 0 ? recent5Days : allSorted).slice(0, 25);

  return ContentService
    .createTextOutput(JSON.stringify(finalItems))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Quét các bài đăng công khai từ Fanpage Điểm Rèn Luyện UMP
 */
function fetchFacebookPublicPosts(targetUrl) {
  const response = UrlFetchApp.fetch(targetUrl, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });

  if (response.getResponseCode() !== 200) return [];
  const html = response.getContentText('UTF-8');
  const items = [];
  const now = new Date();
  const todayIso = Utilities.formatDate(now, 'GMT+7', 'yyyy-MM-dd');

  // Tách các khối bài viết trên mbasic / facebook HTML
  const storyBlocks = html.split(/<article|<div[^>]+data-ft=/i);
  for (let i = 1; i < storyBlocks.length; i++) {
    const block = storyBlocks[i];
    const cleanText = block
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText || cleanText.length < 30) continue;

    // Tìm link bài viết gốc trên Facebook
    const linkMatch = block.match(/href=["']([^"']*(?:story\.php|posts\/|permalink\.php|videos\/)[^"']*)["']/i);
    let postLink = FB_PAGE_URL;
    if (linkMatch && linkMatch[1]) {
      let rawHref = linkMatch[1].replace(/&amp;/g, '&');
      postLink = rawHref.startsWith('http')
        ? rawHref.replace('mbasic.facebook.com', 'www.facebook.com')
        : 'https://www.facebook.com' + (rawHref.startsWith('/') ? rawHref : '/' + rawHref);
    }

    // Phân tích thời gian đăng bài (hỗ trợ dd/mm/yyyy, hôm nay, giờ trước...)
    const parsedTime = parseFacebookDate(cleanText, now);
    const title = cleanText.slice(0, 110) + (cleanText.length > 110 ? '...' : '');
    const excerpt = cleanText.slice(0, 260);

    items.push({
      id: 'fb_' + Utilities.base64Encode(postLink + title.slice(0, 20)).slice(0, 24),
      title: title,
      excerpt: excerpt,
      link: postLink,
      date: parsedTime.isoDate || todayIso,
      timestamp: parsedTime.timestamp || now.getTime(),
      source: SOURCE_LABEL
    });
  }

  return items.slice(0, 15);
}

/**
 * Chuẩn hóa chuỗi ngày tháng tiếng Việt / Facebook sang ISO & timestamp
 */
function parseFacebookDate(text, now) {
  const lower = (text || '').toLowerCase();
  const ddmmyyyy = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, '0');
    const m = ddmmyyyy[2].padStart(2, '0');
    const y = ddmmyyyy[3];
    const dt = new Date(`${y}-${m}-${d}T12:00:00+07:00`);
    return { isoDate: `${y}-${m}-${d}`, timestamp: dt.getTime() };
  }

  const ddmm = lower.match(/(\d{1,2})\s+tháng\s+(\d{1,2})/);
  if (ddmm) {
    const d = ddmm[1].padStart(2, '0');
    const m = ddmm[2].padStart(2, '0');
    const y = now.getFullYear();
    const dt = new Date(`${y}-${m}-${d}T12:00:00+07:00`);
    return { isoDate: `${y}-${m}-${d}`, timestamp: dt.getTime() };
  }

  const hoursAgo = lower.match(/(\d+)\s*giờ/);
  if (hoursAgo) {
    const ts = now.getTime() - parseInt(hoursAgo[1], 10) * 3600 * 1000;
    return { isoDate: Utilities.formatDate(new Date(ts), 'GMT+7', 'yyyy-MM-dd'), timestamp: ts };
  }

  const minsAgo = lower.match(/(\d+)\s*phút/);
  if (minsAgo) {
    const ts = now.getTime() - parseInt(minsAgo[1], 10) * 60 * 1000;
    return { isoDate: Utilities.formatDate(new Date(ts), 'GMT+7', 'yyyy-MM-dd'), timestamp: ts };
  }

  return {
    isoDate: Utilities.formatDate(now, 'GMT+7', 'yyyy-MM-dd'),
    timestamp: now.getTime()
  };
}

/**
 * Đọc tin dự phòng từ Google Sheet (Cột A: Tiêu đề | B: Link | C: Ngày yyyy-mm-dd | D: Nguồn)
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
    const source = String(rows[i][3] || SOURCE_LABEL).trim();
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
      excerpt: title,
      link: link || FB_PAGE_URL,
      date: isoDate,
      timestamp: ts,
      source: source
    });
  }
  return items;
}
