/**
 * SỔ TAY ĐRL UMP (QĐ 1714) - BẢN TIN ĐRL UMP
 * Nguồn duy nhất: Fanpage Điểm Rèn Luyện UMP (https://www.facebook.com/diemrenluyenump)
 * - Tab 1: Fanpage FB (Trực tiếp) qua Meta Page Plugin + nút mở trực tiếp chống trắng khung
 * - Tab 2: Tin tự động (Google Apps Script) lọc 5 ngày gần nhất, xóa/khôi phục tin, thông báo đẩy
 */

const UMP_FB_STORAGE_KEY = 'UMP_FB_FEED_CONFIG_V1';
const DEFAULT_FB_PAGE_NAME = 'Điểm Rèn Luyện UMP';
const DEFAULT_FB_PAGE_URL = 'https://www.facebook.com/diemrenluyenump';
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * GOOGLE APPS SCRIPT - TRẠM LẤY TIN FANPAGE ĐIỂM RÈN LUYỆN UMP (MIỄN PHÍ)
 * Nguồn duy nhất: https://www.facebook.com/diemrenluyenump
 */
const BACKUP_SHEET_ID = '';
const BACKUP_SHEET_NAME = 'TinDRL';
const FB_PAGE_URL = 'https://www.facebook.com/diemrenluyenump';
const FB_MBASIC_URL = 'https://mbasic.facebook.com/diemrenluyenump';
const SOURCE_LABEL = 'Điểm Rèn Luyện UMP';

function doGet(e) {
  const results = [];
  try { results.push(...fetchFacebookPublicPosts(FB_MBASIC_URL)); } catch (err) {}
  if (results.length === 0) {
    try { results.push(...fetchFacebookPublicPosts(FB_PAGE_URL)); } catch (err) {}
  }
  if (BACKUP_SHEET_ID) {
    try { results.push(...fetchFromGoogleSheet(BACKUP_SHEET_ID, BACKUP_SHEET_NAME)); } catch (err) {}
  }
  const uniqueMap = {};
  results.forEach(item => {
    const key = (item.link || '') + '::' + (item.title || '').slice(0, 60);
    if (item.title && !uniqueMap[key]) uniqueMap[key] = item;
  });
  const nowMs = Date.now();
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
  const allSorted = Object.values(uniqueMap).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const recent5Days = allSorted.filter(item => (nowMs - (item.timestamp || 0)) <= fiveDaysMs);
  const finalItems = (recent5Days.length > 0 ? recent5Days : allSorted).slice(0, 25);
  return ContentService.createTextOutput(JSON.stringify(finalItems)).setMimeType(ContentService.MimeType.JSON);
}

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
  const storyBlocks = html.split(/<article|<div[^>]+data-ft=/i);
  for (let i = 1; i < storyBlocks.length; i++) {
    const block = storyBlocks[i];
    const cleanText = block.replace(/<script[\\s\\S]*?<\\/script>/gi, ' ').replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\\s+/g, ' ').trim();
    if (!cleanText || cleanText.length < 30) continue;
    const linkMatch = block.match(/href=["']([^"']*(?:story\\.php|posts\\/|permalink\\.php|videos\\/)[^"']*)["']/i);
    let postLink = FB_PAGE_URL;
    if (linkMatch && linkMatch[1]) {
      let rawHref = linkMatch[1].replace(/&amp;/g, '&');
      postLink = rawHref.startsWith('http')
        ? rawHref.replace('mbasic.facebook.com', 'www.facebook.com')
        : 'https://www.facebook.com' + (rawHref.startsWith('/') ? rawHref : '/' + rawHref);
    }
    const parsedTime = parseFacebookDate(cleanText, now);
    const title = cleanText.slice(0, 110) + (cleanText.length > 110 ? '...' : '');
    items.push({
      id: 'fb_' + Utilities.base64Encode(postLink + title.slice(0, 20)).slice(0, 24),
      title, excerpt: cleanText.slice(0, 260), link: postLink,
      date: parsedTime.isoDate || todayIso, timestamp: parsedTime.timestamp || now.getTime(), source: SOURCE_LABEL
    });
  }
  return items.slice(0, 15);
}

function parseFacebookDate(text, now) {
  const lower = (text || '').toLowerCase();
  const ddmmyyyy = text.match(/(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})/);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, '0'), m = ddmmyyyy[2].padStart(2, '0'), y = ddmmyyyy[3];
    return { isoDate: \`\${y}-\${m}-\${d}\`, timestamp: new Date(\`\${y}-\${m}-\${d}T12:00:00+07:00\`).getTime() };
  }
  const ddmm = lower.match(/(\\d{1,2})\\s+tháng\\s+(\\d{1,2})/);
  if (ddmm) {
    const d = ddmm[1].padStart(2, '0'), m = ddmm[2].padStart(2, '0'), y = now.getFullYear();
    return { isoDate: \`\${y}-\${m}-\${d}\`, timestamp: new Date(\`\${y}-\${m}-\${d}T12:00:00+07:00\`).getTime() };
  }
  const hoursAgo = lower.match(/(\\d+)\\s*giờ/);
  if (hoursAgo) {
    const ts = now.getTime() - parseInt(hoursAgo[1], 10) * 3600 * 1000;
    return { isoDate: Utilities.formatDate(new Date(ts), 'GMT+7', 'yyyy-MM-dd'), timestamp: ts };
  }
  const minsAgo = lower.match(/(\\d+)\\s*phút/);
  if (minsAgo) {
    const ts = now.getTime() - parseInt(minsAgo[1], 10) * 60 * 1000;
    return { isoDate: Utilities.formatDate(new Date(ts), 'GMT+7', 'yyyy-MM-dd'), timestamp: ts };
  }
  return { isoDate: Utilities.formatDate(now, 'GMT+7', 'yyyy-MM-dd'), timestamp: now.getTime() };
}

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
    let isoDate = Utilities.formatDate(now, 'GMT+7', 'yyyy-MM-dd'), ts = now.getTime();
    if (dateVal instanceof Date) { isoDate = Utilities.formatDate(dateVal, 'GMT+7', 'yyyy-MM-dd'); ts = dateVal.getTime(); }
    else if (typeof dateVal === 'string' && dateVal.trim()) {
      isoDate = dateVal.trim();
      const parsed = Date.parse(isoDate);
      if (!isNaN(parsed)) ts = parsed;
    }
    items.push({ id: 'sheet_' + i + '_' + isoDate, title, excerpt: title, link: link || FB_PAGE_URL, date: isoDate, timestamp: ts, source });
  }
  return items;
}`;

class UmpFbFeed {
  constructor() {
    this.config = this.loadConfig();
    this.posts = [];
    this.isSettingsOpen = false;
    this.isLoading = false;
    this.errorMsg = null;
    this.pollTimer = null;

    this.init();
  }

  isLegacyOldUrl(url) {
    const u = (url || '').toLowerCase();
    return u.includes('ctsv.ump.edu.vn') || u.includes('tuoitreump') || u.includes('ump.edu.vn');
  }

  loadConfig() {
    let migrated = false;
    try {
      const raw = localStorage.getItem(UMP_FB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);

        // Tự động dọn dữ liệu 2 trang mẫu cũ trong localStorage
        let fbPageUrl = parsed.fbPageUrl || parsed.selectedFanpageUrl || DEFAULT_FB_PAGE_URL;
        if (this.isLegacyOldUrl(fbPageUrl) || parsed.fanpages) {
          fbPageUrl = DEFAULT_FB_PAGE_URL;
          migrated = true;
        }

        const readIds = Array.isArray(parsed.readIds)
          ? parsed.readIds.filter(id => !String(id).startsWith('sample_ump_'))
          : [];
        const dismissedIds = Array.isArray(parsed.dismissed_news_ids)
          ? parsed.dismissed_news_ids
          : [];

        const cleanConfig = {
          activeTab: parsed.activeTab === 'gas_auto' ? 'gas_auto' : 'fb_live',
          fbPageUrl,
          gasUrl: parsed.gasUrl || '',
          filterMode: parsed.filterMode === 'all' ? 'all' : '5days',
          notificationsEnabled: !!parsed.notificationsEnabled,
          soundEnabled: parsed.soundEnabled !== false,
          readIds,
          dismissed_news_ids: dismissedIds,
          lastKnownTopId: String(parsed.lastKnownTopId || '').startsWith('sample_ump_') ? '' : (parsed.lastKnownTopId || '')
        };

        if (migrated) {
          localStorage.setItem(UMP_FB_STORAGE_KEY, JSON.stringify(cleanConfig));
        }
        return cleanConfig;
      }
    } catch (e) {
      console.error('Lỗi nạp cấu hình Bản tin FB:', e);
    }

    return {
      activeTab: 'fb_live',
      fbPageUrl: DEFAULT_FB_PAGE_URL,
      gasUrl: '',
      filterMode: '5days',
      notificationsEnabled: false,
      soundEnabled: true,
      readIds: [],
      dismissed_news_ids: [],
      lastKnownTopId: ''
    };
  }

  saveConfig() {
    try {
      localStorage.setItem(UMP_FB_STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error('Lỗi lưu cấu hình Bản tin FB:', e);
    }
  }

  init() {
    this.render();
    this.fetchGasFeed(false);

    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      this.fetchGasFeed(false);
    }, 15 * 60 * 1000);
  }

  switchTab(tab) {
    this.config.activeTab = tab;
    this.saveConfig();
    this.render();
  }

  setFilterMode(mode) {
    this.config.filterMode = mode === 'all' ? 'all' : '5days';
    this.saveConfig();
    this.render();
  }

  quickAddFromCurrentFanpage() {
    const pageUrl = this.config.fbPageUrl || DEFAULT_FB_PAGE_URL;
    this.closeDrawer();
    window.app?.openQuickAddModalWithPrefill({
      title: '',
      date: new Date().toISOString().split('T')[0],
      proof: pageUrl,
      suggestedCritId: ''
    });
    setTimeout(() => document.getElementById('quick-act-title')?.focus(), 80);
  }

  normalizePostTimestamp(item) {
    if (typeof item.timestamp === 'number' && !isNaN(item.timestamp)) {
      return item.timestamp;
    }
    if (item.date) {
      const parsed = Date.parse(item.date);
      if (!isNaN(parsed)) return parsed;
    }
    return Date.now();
  }

  async fetchGasFeed(isManual = false) {
    if (!this.config.gasUrl) {
      this.posts = [];
      this.errorMsg = null;
      this.isLoading = false;
      this.render();
      if (isManual) window.app?.showToast('Chưa cấu hình Google Apps Script URL.');
      return;
    }

    this.isLoading = true;
    this.errorMsg = null;
    this.render();

    try {
      const resp = await fetch(this.config.gasUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const raw = await resp.json();
      const arr = Array.isArray(raw) ? raw : (Array.isArray(raw.items) ? raw.items : []);

      const mapped = arr.map((item, idx) => {
        const title = String(item.title || '').trim() || 'Thông báo từ Điểm Rèn Luyện UMP';
        const link = String(item.link || DEFAULT_FB_PAGE_URL).trim();
        const ts = this.normalizePostTimestamp(item);
        const date = String(item.date || new Date(ts).toISOString().split('T')[0]).trim();
        const source = String(item.source || DEFAULT_FB_PAGE_NAME).trim();
        const excerpt = String(item.excerpt || title).trim();
        const id = String(item.id || `${link}__${date}__${title.slice(0, 24)}_${idx}`);

        return {
          id,
          title,
          excerpt,
          link,
          date,
          timestamp: ts,
          source,
          suggestedCritId: this.guessCriterionFromText(title + ' ' + excerpt)
        };
      }).sort((a, b) => b.timestamp - a.timestamp);

      this.posts = mapped;
      this.isLoading = false;

      // Kiểm tra bài mới (chưa bị xóa) để bắn thông báo trình duyệt
      const visiblePosts = this.getFilteredPosts();
      if (visiblePosts.length > 0) {
        const newest = visiblePosts[0];
        if (this.config.lastKnownTopId && this.config.lastKnownTopId !== newest.id) {
          this.triggerNewPostNotification(newest);
        }
        this.config.lastKnownTopId = newest.id;
        this.saveConfig();
      }

      this.render();
      if (isManual) window.app?.showToast(`Đã cập nhật ${visiblePosts.length} bài viết mới!`);
    } catch (err) {
      this.isLoading = false;
      this.errorMsg = `Không thể kết nối Google Script: ${err.message}. Hãy kiểm tra quyền truy cập "Bất kỳ ai (Anyone)" khi Deploy.`;
      this.render();
    }
  }

  getFilteredPosts() {
    const now = Date.now();
    const dismissed = new Set(this.config.dismissed_news_ids || []);

    return this.posts.filter(post => {
      if (dismissed.has(post.id)) return false;
      if (this.config.filterMode === '5days') {
        return (now - post.timestamp) <= FIVE_DAYS_MS;
      }
      return true;
    });
  }

  dismissPost(postId, event) {
    if (event) event.stopPropagation();

    // Lưu ngay lập tức vào localStorage để không bị mất khi F5
    if (!this.config.dismissed_news_ids.includes(postId)) {
      this.config.dismissed_news_ids.push(postId);
    }
    this.saveConfig();

    const cardEl = document.getElementById(`fb-post-card-${CSS.escape(postId)}`);
    if (cardEl) {
      cardEl.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
      cardEl.style.opacity = '0';
      cardEl.style.transform = 'translateX(12px)';
      setTimeout(() => this.render(), 160);
    } else {
      this.render();
    }
  }

  dismissAllReadPosts() {
    const visible = this.getFilteredPosts();
    const readSet = new Set(this.config.readIds || []);
    let count = 0;

    visible.forEach(p => {
      if (readSet.has(p.id) && !this.config.dismissed_news_ids.includes(p.id)) {
        this.config.dismissed_news_ids.push(p.id);
        count++;
      }
    });

    if (count === 0) {
      window.app?.showToast('Không có tin đã xem nào để xóa.');
      return;
    }

    this.saveConfig();
    this.render();
    window.app?.showToast(`Đã xóa ${count} tin đã xem.`);
  }

  restoreDismissedPosts() {
    const count = this.config.dismissed_news_ids.length;
    if (count === 0) return;
    this.config.dismissed_news_ids = [];
    this.saveConfig();
    this.render();
    window.app?.showToast(`Đã khôi phục ${count} tin đã xóa!`);
  }

  guessCriterionFromText(text) {
    const t = (text || '').toLowerCase();
    if (t.includes('hiến máu') || t.includes('giọt hồng')) return 'c_4_2_blood_donation';
    if (t.includes('khảo sát') || t.includes('lấy ý kiến')) return 'c_2_2_survey_course';
    if (t.includes('nckh') || t.includes('nghiên cứu khoa học') || t.includes('hội thảo')) return 'c_1_2_a';
    if (t.includes('tình nguyện') || t.includes('công tác xã hội') || t.includes('mùa hè xanh')) return 'c_4_1_volunteer_lt5d_faculty';
    if (t.includes('thể thao') || t.includes('việt dã') || t.includes('văn nghệ')) return 'c_3_1_a';
    return '';
  }

  async toggleNotifications() {
    if (!('Notification' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ Web Notifications.');
      return;
    }

    if (this.config.notificationsEnabled) {
      this.config.notificationsEnabled = false;
      this.saveConfig();
      this.render();
      window.app?.showToast('Đã tắt thông báo bài mới.');
      return;
    }

    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      this.config.notificationsEnabled = true;
      this.saveConfig();
      this.render();
      window.app?.showToast('Đã bật thông báo tự động!');
      new Notification('Sổ Tay ĐRL UMP (QĐ 1714)', {
        body: 'Bạn sẽ nhận được thông báo khi Fanpage Điểm Rèn Luyện UMP có bài mới.',
        icon: 'assets/icons/icon-192.png'
      });
    } else {
      alert('Vui lòng cấp quyền Thông báo trong cài đặt trình duyệt.');
    }
  }

  triggerNewPostNotification(post) {
    if (!this.config.notificationsEnabled) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(`📢 ${post.source || DEFAULT_FB_PAGE_NAME}`, {
        body: post.title,
        icon: 'assets/icons/icon-192.png'
      });
      notif.onclick = () => {
        window.focus();
        window.open(post.link, '_blank', 'noopener,noreferrer');
      };
    }
    if (this.config.soundEnabled) this.playChime();
  }

  playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  markAsRead(postId) {
    if (!this.config.readIds.includes(postId)) {
      this.config.readIds.push(postId);
      if (this.config.readIds.length > 150) this.config.readIds = this.config.readIds.slice(-150);
      this.saveConfig();
      this.render();
    }
  }

  savePostToDrl(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;
    this.markAsRead(postId);
    this.closeDrawer();
    window.app?.openQuickAddModalWithPrefill({
      title: post.title,
      date: post.date || new Date().toISOString().split('T')[0],
      proof: post.link || DEFAULT_FB_PAGE_URL,
      suggestedCritId: post.suggestedCritId || ''
    });
  }

  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
    this.render();
  }

  saveSourceSettings() {
    const gasUrl = document.getElementById('fb-cfg-gas-url')?.value.trim() || '';
    const fbPageUrl = document.getElementById('fb-cfg-page-url')?.value.trim() || DEFAULT_FB_PAGE_URL;
    const soundEnabled = !!document.getElementById('fb-cfg-sound')?.checked;

    this.config.gasUrl = gasUrl;
    this.config.fbPageUrl = fbPageUrl;
    this.config.soundEnabled = soundEnabled;
    this.isSettingsOpen = false;
    this.saveConfig();
    this.fetchGasFeed(true);
  }

  async copyGoogleScriptCode() {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
      window.app?.showToast('Đã sao chép mã Google Apps Script!');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = GOOGLE_APPS_SCRIPT_TEMPLATE;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      window.app?.showToast('Đã sao chép mã Google Apps Script!');
    }
  }

  openDrawer() {
    document.getElementById('fb-feed-column')?.classList.remove('translate-x-full');
    document.getElementById('fb-drawer-backdrop')?.classList.remove('hidden');
  }

  closeDrawer() {
    document.getElementById('fb-feed-column')?.classList.add('translate-x-full');
    document.getElementById('fb-drawer-backdrop')?.classList.add('hidden');
  }

  updateUnreadBadge() {
    const visiblePosts = this.getFilteredPosts();
    const unreadCount = visiblePosts.filter(p => !this.config.readIds.includes(p.id)).length;
    const badge = document.getElementById('fb-unread-badge');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    return unreadCount;
  }

  render() {
    const unreadCount = this.updateUnreadBadge();
    const container = document.getElementById('fb-feed-column');
    if (!container) return;

    const isNotifOn = this.config.notificationsEnabled && ('Notification' in window) && Notification.permission === 'granted';
    const isTabFb = this.config.activeTab === 'fb_live';
    const pageUrl = this.config.fbPageUrl || DEFAULT_FB_PAGE_URL;

    // Hộp thoại Cài đặt nguồn tin
    const settingsHtml = this.isSettingsOpen ? `
      <div class="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-800">Cài đặt nguồn tin</span>
          <button type="button" onclick="window.fbFeed.toggleSettings()" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <div class="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2">
          <div class="flex items-center justify-between gap-1">
            <label class="font-bold text-slate-700">Google Apps Script URL</label>
            <button type="button" onclick="window.fbFeed.copyGoogleScriptCode()"
              class="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-[#0B5ED7] font-semibold text-[10px] border border-blue-200 shrink-0">
              📋 Sao chép mã Google Script
            </button>
          </div>
          <input type="url" id="fb-cfg-gas-url" value="${this.escapeHtml(this.config.gasUrl)}" placeholder="https://script.google.com/macros/s/.../exec"
            class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">

          <div>
            <label class="block font-bold text-slate-700 mb-1">Link Fanpage Facebook</label>
            <input type="url" id="fb-cfg-page-url" value="${this.escapeHtml(pageUrl)}"
              class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
          </div>

          <label class="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600">
            <input type="checkbox" id="fb-cfg-sound" ${this.config.soundEnabled ? 'checked' : ''} class="rounded text-[#0B5ED7]">
            <span>Phát âm thanh nhẹ khi có bài mới</span>
          </label>

          <div class="flex justify-end">
            <button type="button" onclick="window.fbFeed.saveSourceSettings()"
              class="px-3 py-1.5 rounded-lg bg-[#0B5ED7] hover:bg-[#004A99] text-white font-semibold text-xs">
              Lưu & Tải tin
            </button>
          </div>
        </div>
      </div>
    ` : '';

    let tabContentHtml = '';

    if (isTabFb) {
      const iframeSrc = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(pageUrl)}&tabs=timeline&width=310&height=490&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`;

      tabContentHtml = `
        <div class="p-2.5 space-y-2.5">
          <!-- Tiêu đề Fanpage cố định + nút mở nhanh -->
          <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span class="font-bold text-slate-800 truncate">Fanpage: ${DEFAULT_FB_PAGE_NAME}</span>
            <a href="${this.escapeHtml(pageUrl)}" target="_blank" rel="noopener noreferrer"
              class="text-[11px] font-semibold text-[#0B5ED7] hover:underline shrink-0">
              Mở trên Facebook ↗
            </a>
          </div>

          <!-- Khung nhúng Meta Facebook Page Plugin -->
          <div class="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <iframe src="${iframeSrc}" width="100%" height="490" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
          </div>

          <!-- Thanh thông báo khắc phục khung trắng nếu chặn cookie bên thứ ba -->
          <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px]">
            <span class="text-amber-800 leading-tight">Khung bị trắng do chặn cookie?</span>
            <a href="${this.escapeHtml(pageUrl)}" target="_blank" rel="noopener noreferrer"
              class="px-2 py-1 rounded bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold shrink-0 transition-colors">
              Mở trực tiếp Fanpage ↗
            </a>
          </div>

          <!-- Nút ghi nhanh bài FB vừa xem -->
          <button type="button" id="btn-quick-add-from-fb" onclick="window.fbFeed.quickAddFromCurrentFanpage()"
            class="w-full py-2 px-3 rounded-xl bg-[#0B5ED7] hover:bg-[#004A99] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors">
            <span>+ Ghi nhanh bài FB vừa xem</span>
          </button>
        </div>
      `;
    } else {
      // TAB 2: Tin tự động (Google Script)
      const filteredPosts = this.getFilteredPosts();
      const dismissedCount = (this.config.dismissed_news_ids || []).length;
      const is5Days = this.config.filterMode === '5days';

      const filterBarHtml = `
        <div class="px-2.5 py-2 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-2 text-[11px]">
          <span class="font-medium text-slate-600 truncate">
            ${is5Days ? 'Hiển thị tin trong 5 ngày gần đây' : 'Hiển thị tất cả tin đã lấy'}
          </span>
          <div class="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shrink-0">
            <button type="button" onclick="window.fbFeed.setFilterMode('5days')"
              class="px-2 py-0.5 rounded-md font-semibold transition-colors ${is5Days ? 'bg-[#0B5ED7] text-white' : 'text-slate-600 hover:bg-slate-100'}">
              5 ngày qua
            </button>
            <button type="button" onclick="window.fbFeed.setFilterMode('all')"
              class="px-2 py-0.5 rounded-md font-semibold transition-colors ${!is5Days ? 'bg-[#0B5ED7] text-white' : 'text-slate-600 hover:bg-slate-100'}">
              Tất cả
            </button>
          </div>
        </div>
      `;

      let bodyHtml = '';
      if (!this.config.gasUrl) {
        bodyHtml = `
          <div class="p-3 m-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-2">
            <div class="font-bold text-[#004A99]">Chưa kết nối Google Script cho Fanpage Điểm Rèn Luyện UMP</div>
            <ol class="list-decimal pl-4 space-y-1 text-[11px] text-slate-700 leading-snug">
              <li>Bấm <strong>📋 Sao chép mã Google Script</strong> bên dưới rồi mở <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" class="text-[#0B5ED7] underline font-semibold">script.google.com</a> → Dự án mới.</li>
              <li>Dán mã và chọn <strong>Triển khai → Ứng dụng web</strong> (Quyền truy cập: <em>Bất kỳ ai</em>).</li>
              <li>Dán URL Web App vào nút Cài đặt (<strong>⚙</strong>) để nhận tin tự động từ <span class="font-semibold">facebook.com/diemrenluyenump</span>.</li>
            </ol>
            <div class="flex gap-1.5 pt-1">
              <button type="button" onclick="window.fbFeed.copyGoogleScriptCode()"
                class="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-50 text-[#0B5ED7] border border-blue-200 font-semibold text-[11px]">
                📋 Sao chép mã Google Script
              </button>
              <button type="button" onclick="window.fbFeed.toggleSettings()"
                class="py-1.5 px-3 rounded-lg bg-[#0B5ED7] hover:bg-[#004A99] text-white font-semibold text-[11px]">
                Dán URL ⚙
              </button>
            </div>
          </div>
        `;
      } else if (this.isLoading) {
        bodyHtml = `
          <div class="p-6 text-center text-xs text-slate-500 space-y-2">
            <div class="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p>Đang tải tin từ Fanpage Điểm Rèn Luyện UMP...</p>
          </div>
        `;
      } else if (this.errorMsg) {
        bodyHtml = `
          <div class="p-3 m-2.5 text-xs text-red-700 bg-red-50 rounded-xl border border-red-200 space-y-1.5">
            <p>${this.escapeHtml(this.errorMsg)}</p>
            <button type="button" onclick="window.fbFeed.toggleSettings()" class="text-[#0B5ED7] font-semibold underline">Kiểm tra lại URL ⚙</button>
          </div>
        `;
      } else if (filteredPosts.length === 0) {
        bodyHtml = `
          <div class="p-5 text-center text-xs text-slate-500 space-y-2">
            <p class="italic">${is5Days ? 'Chưa có bài đăng mới trong 5 ngày qua.' : 'Không có bài đăng nào.'}</p>
            ${is5Days && this.posts.length > 0 ? `
              <button type="button" onclick="window.fbFeed.setFilterMode('all')" class="text-[#0B5ED7] font-semibold underline">
                Xem tất cả (${this.posts.length} tin)
              </button>
            ` : ''}
          </div>
        `;
      } else {
        bodyHtml = `
          <div class="p-2.5 space-y-2.5 xl:max-h-[calc(100vh-285px)] overflow-y-auto">
            ${filteredPosts.map(post => {
              const isUnread = !this.config.readIds.includes(post.id);
              return `
                <article id="fb-post-card-${this.escapeHtml(post.id)}" class="rounded-xl border ${isUnread ? 'border-blue-200 bg-[#F4F8FF]/60' : 'border-slate-200 bg-white'} p-3 transition-colors hover:border-blue-300 space-y-2">
                  <div class="flex items-center justify-between gap-2 text-[10px]">
                    <span class="text-slate-500 font-semibold truncate">${this.escapeHtml(post.source || DEFAULT_FB_PAGE_NAME)} • ${this.escapeHtml(post.date)}</span>
                    <div class="flex items-center gap-1.5 shrink-0">
                      ${isUnread ? '<span class="px-1.5 py-0.5 rounded bg-red-500 text-white font-bold text-[9px]">MỚI</span>' : '<span class="text-slate-400">Đã xem</span>'}
                      <button type="button" onclick="window.fbFeed.dismissPost('${this.escapeHtml(post.id)}', event)"
                        class="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold text-xs transition-colors"
                        title="Xóa tin này" aria-label="Xóa tin này">×</button>
                    </div>
                  </div>

                  <a href="${this.escapeHtml(post.link)}" target="_blank" rel="noopener noreferrer"
                    onclick="window.fbFeed.markAsRead('${this.escapeHtml(post.id)}')"
                    class="block group">
                    <h4 class="text-xs font-bold text-slate-800 group-hover:text-[#0B5ED7] leading-snug mb-1">
                      ${this.escapeHtml(post.title)}
                    </h4>
                    <p class="text-[11px] text-slate-600 fb-line-clamp-3 leading-relaxed">
                      ${this.escapeHtml(post.excerpt)}
                    </p>
                  </a>

                  <div class="flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <a href="${this.escapeHtml(post.link)}" target="_blank" rel="noopener noreferrer"
                      onclick="window.fbFeed.markAsRead('${this.escapeHtml(post.id)}')"
                      class="text-[11px] font-medium text-slate-500 hover:text-[#0B5ED7]">
                      Xem bài gốc ↗
                    </a>
                    <button type="button" onclick="window.fbFeed.savePostToDrl('${this.escapeHtml(post.id)}')"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B5ED7] hover:bg-[#004A99] text-white text-[11px] font-semibold shadow-2xs transition-colors">
                      <span>+ Lưu vào ĐRL</span>
                    </button>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        `;
      }

      const footerActionsHtml = (filteredPosts.length > 0 || dismissedCount > 0) ? `
        <div class="px-3 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 text-[11px]">
          ${filteredPosts.length > 0 ? `
            <button type="button" onclick="window.fbFeed.dismissAllReadPosts()" class="text-slate-500 hover:text-red-600 font-medium hover:underline">
              Xóa tất cả tin đã xem
            </button>
          ` : '<span></span>'}
          ${dismissedCount > 0 ? `
            <button type="button" onclick="window.fbFeed.restoreDismissedPosts()" class="text-[#0B5ED7] hover:underline font-semibold">
              Khôi phục ${dismissedCount} tin đã xóa
            </button>
          ` : ''}
        </div>
      ` : '';

      tabContentHtml = `${filterBarHtml}${bodyHtml}${footerActionsHtml}`;
    }

    container.innerHTML = `
      <div class="bg-white xl:rounded-xl xl:border border-slate-200 shadow-2xs h-full xl:h-auto flex flex-col overflow-hidden">
        <!-- Header Bản tin -->
        <div class="px-3 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-1.5 shrink-0">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-sm">📢</span>
            <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wide truncate">Bản tin ĐRL UMP</h3>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" onclick="window.fbFeed.toggleNotifications()"
              class="px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors ${isNotifOn ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}"
              title="Bật/tắt thông báo đẩy trình duyệt">
              🔔 ${isNotifOn ? 'Đang bật' : 'Nhận TB'}
            </button>
            <button type="button" onclick="window.fbFeed.fetchGasFeed(true)"
              class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              title="Làm mới tin tự động">
              ↻
            </button>
            <button type="button" onclick="window.fbFeed.toggleSettings()"
              class="w-7 h-7 rounded-lg ${this.isSettingsOpen ? 'bg-blue-50 border-blue-200 text-[#0B5ED7]' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'} border flex items-center justify-center text-xs"
              title="Cài đặt Google Script & Fanpage">
              ⚙
            </button>
            <button type="button" onclick="window.fbFeed.closeDrawer()"
              class="xl:hidden w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold"
              title="Đóng">
              ✕
            </button>
          </div>
        </div>

        <!-- 2 Tab chuyển đổi miễn phí trọn đời -->
        <div class="flex gap-1 p-1.5 bg-slate-50 border-b border-slate-200 shrink-0 text-[10.5px] font-semibold">
          <button type="button" onclick="window.fbFeed.switchTab('fb_live')"
            class="flex-1 py-1.5 px-1.5 rounded-lg text-center transition-all whitespace-nowrap ${isTabFb ? 'bg-white text-[#0B5ED7] shadow-2xs border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}">
            📘 Fanpage FB (Trực tiếp)
          </button>
          <button type="button" onclick="window.fbFeed.switchTab('gas_auto')"
            class="py-1.5 px-2.5 rounded-lg text-center transition-all flex items-center justify-center gap-1 whitespace-nowrap ${!isTabFb ? 'bg-white text-[#0B5ED7] shadow-2xs border border-blue-200' : 'text-slate-600 hover:bg-slate-100'}">
            <span>🔔 Tin tự động</span>
            ${unreadCount > 0 ? `<span class="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold shrink-0">${unreadCount}</span>` : ''}
          </button>
        </div>

        ${settingsHtml}
        <div class="flex-1 overflow-y-auto">
          ${tabContentHtml}
        </div>
      </div>
    `;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.fbFeed = new UmpFbFeed();
});
