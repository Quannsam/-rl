/**
 * SỔ TAY ĐRL UMP (QĐ 1714) - MODULE BẢN TIN FANPAGE FACEBOOK UMP
 * Hỗ trợ RSS2JSON (RSS.app / FetchRSS), Facebook Page Plugin Iframe,
 * Thông báo trình duyệt (Web Notifications API) và Lưu 1 chạm vào ĐRL.
 */

const UMP_FB_STORAGE_KEY = 'UMP_FB_FEED_CONFIG_V1';

const UMP_SAMPLE_FB_POSTS = [
  {
    id: 'sample_ump_1',
    title: '[ĐOÀN - HỘI UMP] Ngày hội Hiến máu tình nguyện "Giọt Hồng Blouse Trắng" Đợt 2',
    excerpt: 'Thân mời các bạn sinh viên Đại học Y Dược TP.HCM đăng ký tham gia hiến máu tình nguyện tại Sảnh A cơ sở Hồng Bàng. Mỗi lượt hiến máu được cấp GCN và cộng +5 điểm rèn luyện (Mục 4.2).',
    link: 'https://www.facebook.com/DoanHoiDHYDTPHCM',
    pubDate: '2026-11-21 08:30',
    isoDate: '2026-11-21',
    suggestedCritId: 'c_4_2_blood_donation'
  },
  {
    id: 'sample_ump_2',
    title: '[PHÒNG ĐBCL & CTSV] Khảo sát ý kiến người học về môn học Học kỳ 1',
    excerpt: 'Sinh viên vui lòng hoàn thành phiếu khảo sát trực tuyến trên cổng thông tin trước ngày 30/11 để được ghi nhận +3 điểm thưởng Mục 2.2 (Ý thức chấp hành nội quy, quy chế).',
    link: 'https://www.facebook.com/PhongCTSVDHYDTPHCM',
    pubDate: '2026-11-20 14:15',
    isoDate: '2026-11-20',
    suggestedCritId: 'c_2_2_survey_course'
  },
  {
    id: 'sample_ump_3',
    title: '[CLB NCKH UMP] Hội thảo Phương pháp Nghiên cứu Khoa học & Công bố Quốc tế',
    excerpt: 'Chuyên đề hướng dẫn thiết kế nghiên cứu lâm sàng và tìm kiếm tài liệu PubMed dành cho sinh viên Y Dược. Tham dự có điểm danh và cấp Giấy chứng nhận điện tử (+1đ Mục 1.2).',
    link: 'https://www.facebook.com/DoanHoiDHYDTPHCM',
    pubDate: '2026-11-19 19:00',
    isoDate: '2026-11-19',
    suggestedCritId: 'c_1_2_a'
  },
  {
    id: 'sample_ump_4',
    title: '[ĐỘI HÌNH TÌNH NGUYỆN] Tuyển TNV Chiến dịch Khám bệnh & Phát thuốc cộng đồng',
    excerpt: 'Chương trình khám bệnh thiện nguyện cuối tuần (2 ngày) tại huyện Cần Giờ dành cho sinh viên năm 2 trở lên. Có xác nhận của Đoàn Khoa/Trường (+2đ Mục 4.1.4).',
    link: 'https://www.facebook.com/DoanHoiDHYDTPHCM',
    pubDate: '2026-11-18 10:00',
    isoDate: '2026-11-18',
    suggestedCritId: 'c_4_1_volunteer_lt5d_faculty'
  },
  {
    id: 'sample_ump_5',
    title: '[HỘI THAO UMP] Giải Việt dã truyền thống "Blouse Trắng Khỏe" lần thứ XV',
    excerpt: 'Đăng ký cự ly 3km/5km để nhận huy chương hoàn thành và xét danh hiệu Sinh viên Khỏe cấp Khoa/Trường (+2đ Mục 3.1.a).',
    link: 'https://www.facebook.com/DoanHoiDHYDTPHCM',
    pubDate: '2026-11-16 09:20',
    isoDate: '2026-11-16',
    suggestedCritId: 'c_3_1_a'
  }
];

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

  loadConfig() {
    try {
      const raw = localStorage.getItem(UMP_FB_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          mode: parsed.mode || 'sample',
          rssUrl: parsed.rssUrl || '',
          fbPageUrl: parsed.fbPageUrl || 'https://www.facebook.com/DoanHoiDHYDTPHCM',
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
      mode: 'sample',
      rssUrl: '',
      fbPageUrl: 'https://www.facebook.com/DoanHoiDHYDTPHCM',
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
    this.fetchFeed(false);

    // Tự động kiểm tra bài mới mỗi 15 phút
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      this.fetchFeed(false);
    }, 15 * 60 * 1000);
  }

  async fetchFeed(isManual = false) {
    if (this.config.mode === 'sample') {
      this.posts = UMP_SAMPLE_FB_POSTS.map(p => ({ ...p }));
      this.errorMsg = null;
      this.isLoading = false;
      this.render();
      if (isManual) window.app?.showToast('Đã làm mới bản tin mẫu ĐRL UMP!');
      return;
    }

    if (this.config.mode === 'iframe') {
      this.posts = [];
      this.errorMsg = null;
      this.isLoading = false;
      this.render();
      return;
    }

    if (this.config.mode === 'rss') {
      if (!this.config.rssUrl) {
        this.errorMsg = 'Chưa nhập link RSS. Hãy mở Cài đặt (⚙) để dán link RSS hoặc chọn Tin mẫu.';
        this.posts = [];
        this.render();
        return;
      }

      this.isLoading = true;
      this.errorMsg = null;
      this.render();

      try {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(this.config.rssUrl)}`;
        const resp = await fetch(apiUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (data.status !== 'ok' || !Array.isArray(data.items)) {
          throw new Error(data.message || 'Không thể đọc dữ liệu RSS từ nguồn này.');
        }

        const mapped = data.items.map((item, idx) => {
          const id = item.guid || item.link || `rss_${idx}_${item.pubDate}`;
          const cleanText = this.stripHtml(item.description || item.content || '').trim();
          const rawTitle = this.stripHtml(item.title || '').trim();
          const title = rawTitle || (cleanText ? cleanText.split('\n')[0].substring(0, 110) : 'Bài đăng mới từ Fanpage UMP');
          const isoDate = item.pubDate ? item.pubDate.split(' ')[0] : new Date().toISOString().split('T')[0];

          return {
            id,
            title,
            excerpt: cleanText || title,
            link: item.link || this.config.fbPageUrl || 'https://www.facebook.com',
            pubDate: item.pubDate ? item.pubDate.slice(0, 16) : isoDate,
            isoDate,
            suggestedCritId: this.guessCriterionFromText(title + ' ' + cleanText)
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
        if (isManual) window.app?.showToast(`Đã cập nhật ${mapped.length} bài đăng mới nhất!`);
      } catch (err) {
        this.isLoading = false;
        this.errorMsg = `Lỗi tải RSS: ${err.message}. Bạn có thể thử lại hoặc chuyển sang Iframe/Tin mẫu.`;
        this.render();
      }
    }
  }

  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
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
      alert('Trình duyệt của bạn không hỗ trợ thông báo đẩy (Web Notifications).');
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
      window.app?.showToast('Đã bật thông báo bài đăng ĐRL mới!');
      new Notification('Sổ Tay ĐRL UMP (QĐ 1714)', {
        body: 'Bạn sẽ nhận được thông báo ngay khi Fanpage UMP có bài đăng hoạt động mới.',
        icon: 'assets/icons/icon-192.png'
      });
    } else {
      alert('Bạn đã chặn quyền Thông báo. Vui lòng cấp quyền trong cài đặt trình duyệt để nhận tin mới.');
    }
  }

  triggerNewPostNotification(post) {
    if (!this.config.notificationsEnabled) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification('📢 Tin ĐRL UMP mới!', {
        body: post.title,
        icon: 'assets/icons/icon-192.png'
      });
      notif.onclick = () => {
        window.focus();
        window.open(post.link, '_blank', 'noopener,noreferrer');
      };
    }
    if (this.config.soundEnabled) {
      this.playChime();
    }
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
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {
      // Ignore autoplay blocks
    }
  }

  markAsRead(postId) {
    if (!this.config.readIds.includes(postId)) {
      this.config.readIds.push(postId);
      if (this.config.readIds.length > 100) {
        this.config.readIds = this.config.readIds.slice(-100);
      }
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
      date: post.isoDate || new Date().toISOString().split('T')[0],
      proof: post.link || '',
      suggestedCritId: post.suggestedCritId || ''
    });
  }

  toggleSettings() {
    this.isSettingsOpen = !this.isSettingsOpen;
    this.render();
  }

  saveSourceSettings() {
    const mode = document.getElementById('fb-cfg-mode')?.value || 'sample';
    const rssUrl = document.getElementById('fb-cfg-rss')?.value.trim() || '';
    const fbPageUrl = document.getElementById('fb-cfg-page')?.value.trim() || 'https://www.facebook.com/DoanHoiDHYDTPHCM';
    const soundEnabled = !!document.getElementById('fb-cfg-sound')?.checked;

    if (mode === 'rss' && !rssUrl) {
      alert('Vui lòng dán đường dẫn RSS (từ RSS.app hoặc FetchRSS)!');
      return;
    }

    this.config.mode = mode;
    this.config.rssUrl = rssUrl;
    this.config.fbPageUrl = fbPageUrl;
    this.config.soundEnabled = soundEnabled;
    this.isSettingsOpen = false;
    this.saveConfig();
    this.fetchFeed(true);
  }

  openDrawer() {
    const col = document.getElementById('fb-feed-column');
    const backdrop = document.getElementById('fb-drawer-backdrop');
    if (col) col.classList.remove('translate-x-full');
    if (backdrop) backdrop.classList.remove('hidden');
  }

  closeDrawer() {
    const col = document.getElementById('fb-feed-column');
    const backdrop = document.getElementById('fb-drawer-backdrop');
    if (col) col.classList.add('translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
  }

  updateUnreadBadge() {
    const unreadCount = this.config.mode === 'iframe'
      ? 0
      : this.posts.filter(p => !this.config.readIds.includes(p.id)).length;

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

    const settingsHtml = this.isSettingsOpen ? `
      <div class="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5 text-xs">
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-800">Cài đặt nguồn tin Fanpage</span>
          <button type="button" onclick="window.fbFeed.toggleSettings()" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <div>
          <label class="block font-semibold text-slate-700 mb-1">Chế độ hiển thị</label>
          <select id="fb-cfg-mode" onchange="document.getElementById('fb-rss-wrap').classList.toggle('hidden', this.value !== 'rss'); document.getElementById('fb-page-wrap').classList.toggle('hidden', this.value !== 'iframe');"
            class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium">
            <option value="sample" ${this.config.mode === 'sample' ? 'selected' : ''}>Tin mẫu ĐRL UMP (Chạy thử ngay)</option>
            <option value="rss" ${this.config.mode === 'rss' ? 'selected' : ''}>Link RSS Fanpage (RSS.app / FetchRSS)</option>
            <option value="iframe" ${this.config.mode === 'iframe' ? 'selected' : ''}>Nhúng Fanpage Facebook trực tiếp (Iframe)</option>
          </select>
        </div>

        <div id="fb-rss-wrap" class="${this.config.mode === 'rss' ? '' : 'hidden'}">
          <label class="block font-semibold text-slate-700 mb-1">Link RSS Feed</label>
          <input type="url" id="fb-cfg-rss" value="${this.escapeHtml(this.config.rssUrl)}" placeholder="https://rss.app/feeds/..."
            class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs">
        </div>

        <div id="fb-page-wrap" class="${this.config.mode === 'iframe' ? '' : 'hidden'}">
          <label class="block font-semibold text-slate-700 mb-1">Link Fanpage Facebook</label>
          <input type="url" id="fb-cfg-page" value="${this.escapeHtml(this.config.fbPageUrl)}" placeholder="https://www.facebook.com/DoanHoiDHYDTPHCM"
            class="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs">
        </div>

        <label class="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600">
          <input type="checkbox" id="fb-cfg-sound" ${this.config.soundEnabled ? 'checked' : ''} class="rounded text-[#0B5ED7]">
          <span>Phát âm thanh nhẹ khi có bài mới</span>
        </label>

        <div class="flex justify-end gap-2 pt-1">
          <button type="button" onclick="window.fbFeed.saveSourceSettings()"
            class="px-3 py-1.5 rounded-lg bg-[#0B5ED7] hover:bg-[#004A99] text-white font-semibold text-xs">
            Lưu & Tải tin
          </button>
        </div>
      </div>
    ` : '';

    let bodyHtml = '';
    if (this.config.mode === 'iframe') {
      const iframeSrc = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(this.config.fbPageUrl)}&tabs=timeline&width=310&height=520&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`;
      bodyHtml = `
        <div class="p-2 bg-white">
          <iframe src="${iframeSrc}" width="100%" height="520" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
        </div>
      `;
    } else if (this.isLoading) {
      bodyHtml = `
        <div class="p-6 text-center text-xs text-slate-500 space-y-2">
          <div class="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p>Đang tải bản tin từ Fanpage...</p>
        </div>
      `;
    } else if (this.errorMsg) {
      bodyHtml = `
        <div class="p-4 text-xs text-red-700 bg-red-50/70 m-3 rounded-lg border border-red-200 space-y-2">
          <p>${this.escapeHtml(this.errorMsg)}</p>
          <button type="button" onclick="window.fbFeed.toggleSettings()" class="text-[#0B5ED7] font-semibold underline">Mở cài đặt nguồn tin</button>
        </div>
      `;
    } else if (this.posts.length === 0) {
      bodyHtml = `<p class="p-4 text-xs text-slate-400 italic text-center">Chưa có bài đăng nào.</p>`;
    } else {
      bodyHtml = `
        <div class="p-2.5 space-y-2.5 xl:max-h-[calc(100vh-175px)] overflow-y-auto">
          ${this.posts.map(post => {
            const isUnread = !this.config.readIds.includes(post.id);
            return `
              <article class="rounded-xl border ${isUnread ? 'border-blue-200 bg-[#F4F8FF]/60' : 'border-slate-200 bg-white'} p-3 transition-colors hover:border-blue-300 space-y-2">
                <div class="flex items-center justify-between gap-2 text-[10px]">
                  <span class="text-slate-400 font-medium">${this.escapeHtml(post.pubDate)}</span>
                  ${isUnread ? '<span class="px-1.5 py-0.5 rounded bg-red-500 text-white font-bold tracking-wide text-[9px]">MỚI</span>' : '<span class="text-slate-400">Đã xem</span>'}
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

    container.innerHTML = `
      <div class="bg-white xl:rounded-xl xl:border border-slate-200 shadow-2xs h-full xl:h-auto flex flex-col overflow-hidden">
        <!-- Header Bản tin -->
        <div class="px-3.5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-sm">📢</span>
            <h3 class="font-bold text-slate-800 text-xs uppercase tracking-wide truncate">Bản tin ĐRL UMP</h3>
            ${unreadCount > 0 && this.config.mode !== 'iframe' ? `<span class="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">${unreadCount}</span>` : ''}
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" onclick="window.fbFeed.toggleNotifications()"
              class="px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors ${isNotifOn ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}"
              title="Bật/tắt thông báo đẩy trình duyệt">
              🔔 ${isNotifOn ? 'Đang bật' : 'Nhận TB'}
            </button>
            <button type="button" onclick="window.fbFeed.fetchFeed(true)"
              class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              title="Làm mới bản tin">
              ↻
            </button>
            <button type="button" onclick="window.fbFeed.toggleSettings()"
              class="w-7 h-7 rounded-lg ${this.isSettingsOpen ? 'bg-blue-50 border-blue-200 text-[#0B5ED7]' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'} border flex items-center justify-center text-xs"
              title="Cài đặt nguồn tin RSS / Fanpage">
              ⚙
            </button>
            <button type="button" onclick="window.fbFeed.closeDrawer()"
              class="xl:hidden w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold"
              title="Đóng ngăn kéo">
              ✕
            </button>
          </div>
        </div>

        ${settingsHtml}
        <div class="flex-1 overflow-y-auto">
          ${bodyHtml}
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
