/**
 * SỔ TAY ĐRL UMP (QĐ 1714) - BẢN TIN ĐRL UMP MIỄN PHÍ VĨNH VIỄN
 * - Tab 1: Fanpage FB (Trực tiếp) dùng Meta Facebook Page Plugin (100% Free)
 * - Tab 2: Tin tự động (Google Script) kết nối Google Apps Script Web App URL + Thông báo đẩy
 */

const UMP_FB_STORAGE_KEY = 'UMP_FB_FEED_CONFIG_V1';

const DEFAULT_UMP_FANPAGES = [
  {
    id: 'fp_ctsv',
    name: 'Phòng Công tác Sinh viên ĐHYD TP.HCM',
    url: 'https://www.facebook.com/ctsv.ump.edu.vn'
  },
  {
    id: 'fp_doanhoi',
    name: 'Đoàn Thanh niên - Hội Sinh viên ĐHYD TP.HCM',
    url: 'https://www.facebook.com/tuoitreump'
  }
];

const UMP_SAMPLE_FB_POSTS = [
  {
    id: 'sample_ump_1',
    title: '[ĐOÀN - HỘI UMP] Ngày hội Hiến máu tình nguyện "Giọt Hồng Blouse Trắng" Đợt 2',
    excerpt: 'Thân mời sinh viên ĐHYD TP.HCM đăng ký hiến máu tình nguyện tại Sảnh A cơ sở Hồng Bàng. Mỗi lượt hiến máu được cấp GCN và cộng +5 điểm rèn luyện (Mục 4.2).',
    link: 'https://www.facebook.com/tuoitreump',
    date: '2026-11-21',
    source: 'Đoàn - Hội UMP',
    suggestedCritId: 'c_4_2_blood_donation'
  },
  {
    id: 'sample_ump_2',
    title: '[PHÒNG CTSV] Thông báo thực hiện Khảo sát ý kiến người học về môn học HK1',
    excerpt: 'Sinh viên vui lòng hoàn thành phiếu khảo sát trực tuyến trên cổng thông tin để được ghi nhận +3 điểm thưởng Mục 2.2 (Ý thức chấp hành nội quy, quy chế).',
    link: 'https://www.facebook.com/ctsv.ump.edu.vn',
    date: '2026-11-20',
    source: 'Phòng CTSV UMP',
    suggestedCritId: 'c_2_2_survey_course'
  },
  {
    id: 'sample_ump_3',
    title: '[CLB NCKH UMP] Hội thảo Phương pháp Nghiên cứu Khoa học & Công bố Quốc tế',
    excerpt: 'Hướng dẫn thiết kế nghiên cứu lâm sàng và tìm kiếm tài liệu PubMed dành cho sinh viên Y Dược. Có cấp Giấy chứng nhận điện tử (+1đ Mục 1.2).',
    link: 'https://www.facebook.com/tuoitreump',
    date: '2026-11-19',
    source: 'CLB NCKH UMP',
    suggestedCritId: 'c_1_2_a'
  },
  {
    id: 'sample_ump_4',
    title: '[ĐỘI HÌNH TÌNH NGUYỆN] Tuyển TNV Chiến dịch Khám bệnh & Phát thuốc cộng đồng',
    excerpt: 'Chương trình khám bệnh thiện nguyện cuối tuần (2 ngày) tại Cần Giờ dành cho sinh viên từ năm 2 trở lên. Có xác nhận Đoàn Khoa/Trường (+2đ Mục 4.1.4).',
    link: 'https://www.facebook.com/tuoitreump',
    date: '2026-11-18',
    source: 'Đội Tình nguyện UMP',
    suggestedCritId: 'c_4_1_volunteer_lt5d_faculty'
  },
  {
    id: 'sample_ump_5',
    title: '[HỘI THAO UMP] Giải Việt dã truyền thống "Blouse Trắng Khỏe" lần thứ XV',
    excerpt: 'Đăng ký cự ly 3km/5km để nhận huy chương hoàn thành và xét danh hiệu Sinh viên Khỏe cấp Khoa/Trường (+2đ Mục 3.1.a).',
    link: 'https://www.facebook.com/ctsv.ump.edu.vn',
    date: '2026-11-16',
    source: 'Phòng CTSV UMP',
    suggestedCritId: 'c_3_1_a'
  }
];

const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * GOOGLE APPS SCRIPT - TRẠM LẤY TIN ĐRL ĐHYD TP.HCM (MIỄN PHÍ VĨNH VIỄN)
 */
const BACKUP_SHEET_ID = '';
const BACKUP_SHEET_NAME = 'TinDRL';

function doGet(e) {
  const results = [];
  try { results.push(...fetchUmpAnnouncements('https://ctsv.ump.edu.vn', 'Phòng CTSV UMP')); } catch (err) {}
  try { results.push(...fetchUmpAnnouncements('https://ump.edu.vn', 'ĐHYD TP.HCM')); } catch (err) {}
  if (BACKUP_SHEET_ID) {
    try { results.push(...fetchFromGoogleSheet(BACKUP_SHEET_ID, BACKUP_SHEET_NAME)); } catch (err) {}
  }
  const uniqueMap = {};
  results.forEach(item => {
    const key = item.link || item.title;
    if (key && !uniqueMap[key]) uniqueMap[key] = item;
  });
  const finalItems = Object.values(uniqueMap)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 20);
  return ContentService.createTextOutput(JSON.stringify(finalItems)).setMimeType(ContentService.MimeType.JSON);
}

function fetchUmpAnnouncements(baseUrl, sourceName) {
  const response = UrlFetchApp.fetch(baseUrl, { muteHttpExceptions: true, followRedirects: true });
  if (response.getResponseCode() !== 200) return [];
  const html = response.getContentText('UTF-8');
  const items = [];
  const today = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\\s\\S]*?)<\\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1].trim();
    const rawText = match[2].replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();
    if (!rawText || rawText.length < 22 || rawText.length > 220) continue;
    if (href.startsWith('#') || href.startsWith('javascript:')) continue;
    const lower = rawText.toLowerCase();
    const isRelevant = lower.includes('rèn luyện') || lower.includes('thông báo') || lower.includes('sinh viên') ||
      lower.includes('học bổng') || lower.includes('hiến máu') || lower.includes('tình nguyện') ||
      lower.includes('hội thảo') || lower.includes('nghiên cứu') || lower.includes('khảo sát') || lower.includes('kế hoạch');
    if (!isRelevant) continue;
    if (href.startsWith('/')) href = baseUrl.replace(/\\/$/, '') + href;
    else if (!href.startsWith('http')) href = baseUrl.replace(/\\/$/, '') + '/' + href;
    const dateMatch = rawText.match(/(\\d{2})\\/(\\d{2})\\/(\\d{4})/);
    const isoDate = dateMatch ? \`\${dateMatch[3]}-\${dateMatch[2]}-\${dateMatch[1]}\` : today;
    items.push({ title: rawText, link: href, date: isoDate, source: sourceName });
  }
  return items.slice(0, 10);
}

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
    if (dateVal instanceof Date) isoDate = Utilities.formatDate(dateVal, 'GMT+7', 'yyyy-MM-dd');
    else if (typeof dateVal === 'string' && dateVal.trim()) isoDate = dateVal.trim();
    items.push({ title, link: link || 'https://ctsv.ump.edu.vn', date: isoDate, source });
  }
  return items;
}`;

class UmpFbFeed {
  constructor() {
    this.config = this.loadConfig();
    this.posts = [];
    this.isSettingsOpen = false;
    this.isGuideOpen = false;
    this.isLoading = false;
    this.errorMsg = null;
    this.pollTimer = null;

    this.init();
  }

  loadConfig() {
    try {
      const raw = localStorage.getItem(UMP_FB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const fanpages = Array.isArray(parsed.fanpages) && parsed.fanpages.length > 0
          ? parsed.fanpages
          : DEFAULT_UMP_FANPAGES.map(f => ({ ...f }));
        return {
          activeTab: parsed.activeTab === 'gas_auto' ? 'gas_auto' : 'fb_live',
          fanpages,
          selectedFanpageUrl: parsed.selectedFanpageUrl || fanpages[0].url,
          gasUrl: parsed.gasUrl || '',
          notificationsEnabled: !!parsed.notificationsEnabled,
          soundEnabled: parsed.soundEnabled !== false,
          readIds: Array.isArray(parsed.readIds) ? parsed.readIds : [],
          lastKnownTopId: parsed.lastKnownTopId || ''
        };
      }
    } catch (e) {
      console.error('Lỗi nạp cấu hình Bản tin FB:', e);
    }
    return {
      activeTab: 'fb_live',
      fanpages: DEFAULT_UMP_FANPAGES.map(f => ({ ...f })),
      selectedFanpageUrl: DEFAULT_UMP_FANPAGES[0].url,
      gasUrl: '',
      notificationsEnabled: false,
      soundEnabled: true,
      readIds: [],
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

    // Tự động kiểm tra bài mới từ Google Apps Script mỗi 15 phút
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

  selectFanpage(url) {
    this.config.selectedFanpageUrl = url;
    this.saveConfig();
    this.render();
  }

  quickAddFromCurrentFanpage() {
    const selectedUrl = this.config.selectedFanpageUrl || DEFAULT_UMP_FANPAGES[0].url;
    this.closeDrawer();
    window.app?.openQuickAddModalWithPrefill({
      title: '',
      date: new Date().toISOString().split('T')[0],
      proof: selectedUrl,
      suggestedCritId: ''
    });
    setTimeout(() => document.getElementById('quick-act-title')?.focus(), 80);
  }

  async fetchGasFeed(isManual = false) {
    if (!this.config.gasUrl) {
      this.posts = UMP_SAMPLE_FB_POSTS.map(p => ({ ...p }));
      this.errorMsg = null;
      this.isLoading = false;
      this.render();
      if (isManual) window.app?.showToast('Đang hiển thị tin mẫu UMP (chưa cài URL Google Script).');
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
        const title = String(item.title || '').trim() || 'Thông báo ĐRL mới';
        const link = String(item.link || 'https://ctsv.ump.edu.vn').trim();
        const date = String(item.date || new Date().toISOString().split('T')[0]).trim();
        const source = String(item.source || 'ĐHYD TP.HCM').trim();
        const excerpt = String(item.excerpt || title).trim();
        const id = item.id || `${link}__${title.slice(0, 30)}_${idx}`;

        return {
          id,
          title,
          excerpt,
          link,
          date,
          source,
          suggestedCritId: this.guessCriterionFromText(title + ' ' + excerpt)
        };
      });

      this.posts = mapped;
      this.isLoading = false;

      // Kiểm tra bài mới để bắn thông báo trình duyệt
      if (mapped.length > 0) {
        const newest = mapped[0];
        if (this.config.lastKnownTopId && this.config.lastKnownTopId !== newest.id) {
          this.triggerNewPostNotification(newest);
        }
        this.config.lastKnownTopId = newest.id;
        this.saveConfig();
      }

      this.render();
      if (isManual) window.app?.showToast(`Đã cập nhật ${mapped.length} thông báo mới nhất!`);
    } catch (err) {
      this.isLoading = false;
      this.errorMsg = `Không thể kết nối Google Script: ${err.message}. Hãy kiểm tra quyền truy cập "Bất kỳ ai (Anyone)" khi Deploy.`;
      this.render();
    }
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
        body: 'Hệ thống sẽ thông báo ngay khi có tin hoạt động ĐRL mới.',
        icon: 'assets/icons/icon-192.png'
      });
    } else {
      alert('Vui lòng cấp quyền Thông báo trong cài đặt trình duyệt.');
    }
  }

  triggerNewPostNotification(post) {
    if (!this.config.notificationsEnabled) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(`📢 ${post.source || 'Tin ĐRL UMP mới'}`, {
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
      if (this.config.readIds.length > 120) this.config.readIds = this.config.readIds.slice(-120);
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
      proof: post.link || '',
      suggestedCritId: post.suggestedCritId || ''
    });
  }

  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
    this.render();
  }

  toggleGuide() {
    this.isGuideOpen = !this.isGuideOpen;
    this.render();
  }

  addCustomFanpage() {
    const nameEl = document.getElementById('fb-new-fp-name');
    const urlEl = document.getElementById('fb-new-fp-url');
    const name = nameEl?.value.trim();
    const url = urlEl?.value.trim();
    if (!name || !url) {
      alert('Vui lòng nhập đầy đủ Tên và Link Fanpage Facebook!');
      return;
    }
    this.config.fanpages.push({ id: 'fp_' + Date.now(), name, url });
    this.config.selectedFanpageUrl = url;
    this.saveConfig();
    this.render();
    window.app?.showToast(`Đã thêm Fanpage "${name}"`);
  }

  removeFanpage(id) {
    if (this.config.fanpages.length <= 1) {
      alert('Cần giữ lại ít nhất 1 Fanpage!');
      return;
    }
    this.config.fanpages = this.config.fanpages.filter(f => f.id !== id);
    if (!this.config.fanpages.some(f => f.url === this.config.selectedFanpageUrl)) {
      this.config.selectedFanpageUrl = this.config.fanpages[0].url;
    }
    this.saveConfig();
    this.render();
  }

  saveSourceSettings() {
    const gasUrl = document.getElementById('fb-cfg-gas-url')?.value.trim() || '';
    const soundEnabled = !!document.getElementById('fb-cfg-sound')?.checked;

    this.config.gasUrl = gasUrl;
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
    const unreadCount = this.posts.filter(p => !this.config.readIds.includes(p.id)).length;
    const badge = document.getElementById('fb-unread-badge');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  render() {
    this.updateUnreadBadge();
    const container = document.getElementById('fb-feed-column');
    if (!container) return;

    const unreadCount = this.posts.filter(p => !this.config.readIds.includes(p.id)).length;
    const isNotifOn = this.config.notificationsEnabled && ('Notification' in window) && Notification.permission === 'granted';
    const isTabFb = this.config.activeTab === 'fb_live';

    // Hộp thoại Cài đặt nguồn tin
    const settingsHtml = this.isSettingsOpen ? `
      <div class="p-3 bg-slate-50 border-b border-slate-200 space-y-3 text-xs max-h-[65vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-800">Cài đặt nguồn tin miễn phí</span>
          <button type="button" onclick="window.fbFeed.toggleSettings()" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <!-- Cấu hình Google Apps Script URL -->
        <div class="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2">
          <div class="flex items-center justify-between gap-1">
            <label class="font-bold text-slate-700">Google Apps Script Web App URL</label>
            <button type="button" onclick="window.fbFeed.copyGoogleScriptCode()"
              class="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-[#0B5ED7] font-semibold text-[10px] border border-blue-200 shrink-0">
              📋 Sao chép mã Google Script
            </button>
          </div>
          <input type="url" id="fb-cfg-gas-url" value="${this.escapeHtml(this.config.gasUrl)}" placeholder="https://script.google.com/macros/s/.../exec"
            class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
          <label class="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600">
            <input type="checkbox" id="fb-cfg-sound" ${this.config.soundEnabled ? 'checked' : ''} class="rounded text-[#0B5ED7]">
            <span>Phát âm thanh nhẹ khi có tin mới</span>
          </label>
          <div class="flex justify-end">
            <button type="button" onclick="window.fbFeed.saveSourceSettings()"
              class="px-3 py-1 rounded-lg bg-[#0B5ED7] hover:bg-[#004A99] text-white font-semibold text-[11px]">
              Lưu & Tải tin
            </button>
          </div>
        </div>

        <!-- Quản lý danh sách Fanpage FB -->
        <div class="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2">
          <div class="font-bold text-slate-700">Danh sách Fanpage Facebook UMP</div>
          <ul class="space-y-1">
            ${this.config.fanpages.map(fp => `
              <li class="flex items-center justify-between gap-1.5 text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                <span class="truncate font-medium text-slate-700" title="${this.escapeHtml(fp.url)}">${this.escapeHtml(fp.name)}</span>
                <button type="button" onclick="window.fbFeed.removeFanpage('${this.escapeHtml(fp.id)}')" class="text-slate-400 hover:text-red-600 font-bold px-1">×</button>
              </li>
            `).join('')}
          </ul>
          <div class="grid grid-cols-1 gap-1.5 pt-1 border-t border-slate-100">
            <input type="text" id="fb-new-fp-name" placeholder="Tên Fanpage (VD: Đoàn Khoa Y)"
              class="w-full px-2 py-1 border border-slate-300 rounded text-[11px]">
            <div class="flex gap-1.5">
              <input type="url" id="fb-new-fp-url" placeholder="https://www.facebook.com/..."
                class="flex-1 px-2 py-1 border border-slate-300 rounded text-[11px]">
              <button type="button" onclick="window.fbFeed.addCustomFanpage()"
                class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold shrink-0">+ Thêm</button>
            </div>
          </div>
        </div>
      </div>
    ` : '';

    // Nội dung TAB 1 vs TAB 2
    let tabContentHtml = '';

    if (isTabFb) {
      const iframeSrc = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(this.config.selectedFanpageUrl)}&tabs=timeline&width=310&height=520&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`;

      tabContentHtml = `
        <div class="p-2.5 space-y-2.5">
          <!-- Bộ chọn nhanh Fanpage UMP -->
          <div>
            <select id="fb-fanpage-select" onchange="window.fbFeed.selectFanpage(this.value)"
              class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
              ${this.config.fanpages.map(fp => `
                <option value="${this.escapeHtml(fp.url)}" ${fp.url === this.config.selectedFanpageUrl ? 'selected' : ''}>
                  ${this.escapeHtml(fp.name)}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Khung nhúng Meta Facebook Page Plugin chính chủ -->
          <div class="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <iframe src="${iframeSrc}" width="100%" height="520" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
          </div>

          <!-- Thanh thao tác nhanh ngay dưới khung FB -->
          <button type="button" id="btn-quick-add-from-fb" onclick="window.fbFeed.quickAddFromCurrentFanpage()"
            class="w-full py-2 px-3 rounded-xl bg-[#0B5ED7] hover:bg-[#004A99] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors">
            <span>+ Ghi nhanh bài FB vừa xem</span>
          </button>
        </div>
      `;
    } else {
      // TAB 2: Tin tự động (Google Script)
      const setupGuideBanner = !this.config.gasUrl ? `
        <div class="m-2.5 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-[#004A99]">⚡ Đang xem Tin mẫu ĐRL UMP</span>
            <button type="button" onclick="window.fbFeed.toggleGuide()" class="text-[#0B5ED7] font-semibold underline shrink-0">
              ${this.isGuideOpen ? 'Ẩn hướng dẫn' : 'Cài đặt 3 bước'}
            </button>
          </div>
          ${this.isGuideOpen ? `
            <ol class="list-decimal pl-4 space-y-1 text-slate-700 leading-snug pt-1 border-t border-blue-200/70">
              <li>Bấm <strong>📋 Sao chép mã Google Script</strong> bên dưới rồi mở <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" class="text-[#0B5ED7] underline font-semibold">script.google.com</a> → Dự án mới.</li>
              <li>Dán mã vào và chọn <strong>Triển khai → Ứng dụng web</strong> (Quyền truy cập: <em>Bất kỳ ai</em>).</li>
              <li>Dán URL nhận được vào nút Cài đặt (<strong>⚙</strong>) để nhận tin tự động miễn phí vĩnh viễn!</li>
            </ol>
            <div class="flex gap-1.5 pt-1">
              <button type="button" onclick="window.fbFeed.copyGoogleScriptCode()"
                class="flex-1 py-1 px-2 rounded bg-white hover:bg-slate-50 text-[#0B5ED7] border border-blue-200 font-semibold text-[10px]">
                📋 Sao chép mã Google Script
              </button>
              <button type="button" onclick="window.fbFeed.toggleSettings()"
                class="py-1 px-2.5 rounded bg-[#0B5ED7] text-white font-semibold text-[10px]">
                Dán URL ⚙
              </button>
            </div>
          ` : ''}
        </div>
      ` : '';

      let postsHtml = '';
      if (this.isLoading) {
        postsHtml = `
          <div class="p-6 text-center text-xs text-slate-500 space-y-2">
            <div class="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p>Đang tải tin từ Google Script...</p>
          </div>
        `;
      } else if (this.errorMsg) {
        postsHtml = `
          <div class="p-3 m-2.5 text-xs text-red-700 bg-red-50 rounded-xl border border-red-200 space-y-1.5">
            <p>${this.escapeHtml(this.errorMsg)}</p>
            <button type="button" onclick="window.fbFeed.toggleSettings()" class="text-[#0B5ED7] font-semibold underline">Kiểm tra lại URL ⚙</button>
          </div>
        `;
      } else {
        postsHtml = `
          <div class="p-2.5 space-y-2.5 xl:max-h-[calc(100vh-245px)] overflow-y-auto">
            ${this.posts.map(post => {
              const isUnread = !this.config.readIds.includes(post.id);
              return `
                <article class="rounded-xl border ${isUnread ? 'border-blue-200 bg-[#F4F8FF]/60' : 'border-slate-200 bg-white'} p-3 transition-colors hover:border-blue-300 space-y-2">
                  <div class="flex items-center justify-between gap-2 text-[10px]">
                    <span class="text-slate-500 font-semibold truncate">${this.escapeHtml(post.source || 'UMP')} • ${this.escapeHtml(post.date)}</span>
                    ${isUnread ? '<span class="px-1.5 py-0.5 rounded bg-red-500 text-white font-bold text-[9px] shrink-0">MỚI</span>' : '<span class="text-slate-400 shrink-0">Đã xem</span>'}
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
                      Xem chi tiết ↗
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

      tabContentHtml = `${setupGuideBanner}${postsHtml}`;
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
