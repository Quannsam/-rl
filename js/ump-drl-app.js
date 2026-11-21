/**
 * SỔ TAY THEO DÕI & TÍNH ĐIỂM RÈN LUYỆN UMP (QĐ 1714)
 * Controller giao diện tối giản, gọn gàng cho màn hình laptop (max-w-[1380px])
 */

class UmpDrlApp {
  constructor() {
    this.data = UmpDrlStorage.loadData();
    this.activeTab = '1'; // '1', '2', '3', '4', '5', 'all' (Mặc định Phần 1)
    this.currentFilter = 'all'; // 'all', 'uncompleted', 'easy'
    this.searchQuery = '';
    this.showCompareCols = false; // Mặc định TẮT cột Lớp / Khoa
    this.showAllRecentActivities = false; // Chuyển đổi xem 5 gần nhất / Tất cả
    this.isEditingTargetScore = false; // Bật/tắt bộ điều chỉnh điểm mục tiêu
    this.lastDeletedActivity = null; // Lưu tạm để Hoàn tác trong 3s
    this.undoTimeout = null;
    this.saveTimeout = null;

    this.init();
  }

  init() {
    this.bindGlobalEvents();
    this.renderSemesterSelector();
    this.render();
  }

  getActiveSemester() {
    return UmpDrlStorage.getActiveSemester(this.data);
  }

  scheduleAutoSave() {
    const saveIndicator = document.getElementById('save-indicator');
    if (saveIndicator) {
      saveIndicator.innerHTML = '<span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 saving-pulse"></span>Đang lưu...';
    }

    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      const activeSem = this.getActiveSemester();
      activeSem.updatedAt = new Date().toISOString();
      UmpDrlStorage.saveData(this.data);
      if (saveIndicator) {
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        saveIndicator.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span>Lưu ${timeStr}`;
      }
    }, 400);
  }

  bindGlobalEvents() {
    // Chuyển đổi học kỳ
    const semSelect = document.getElementById('semester-select');
    if (semSelect) {
      semSelect.addEventListener('change', (e) => {
        this.data.activeSemesterId = e.target.value;
        UmpDrlStorage.saveData(this.data);
        this.render();
      });
    }

    // Dropdown "Thêm ▾"
    const btnMore = document.getElementById('btn-more-menu');
    const dropdownMore = document.getElementById('more-menu-dropdown');
    if (btnMore && dropdownMore) {
      btnMore.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMore.classList.toggle('hidden');
      });
      document.addEventListener('click', (e) => {
        if (!dropdownMore.contains(e.target) && e.target !== btnMore) {
          dropdownMore.classList.add('hidden');
        }
      });
    }

    // Nút tạo học kỳ mới
    const btnNewSem = document.getElementById('btn-new-semester');
    if (btnNewSem) {
      btnNewSem.addEventListener('click', () => {
        dropdownMore?.classList.add('hidden');
        this.openNewSemesterModal();
      });
    }

    // Nút Xuất / In phiếu
    const btnPrint = document.getElementById('btn-print-official');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => this.openPrintPreview());
    }

    // Nút Sao lưu JSON
    const btnExport = document.getElementById('btn-export-json');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        dropdownMore?.classList.add('hidden');
        UmpDrlStorage.exportJson(this.data);
        this.showToast('Đã tải xuống file sao lưu JSON!');
      });
    }

    // Nút Khôi phục JSON
    const btnImport = document.getElementById('btn-import-json');
    const fileImport = document.getElementById('file-import-input');
    if (btnImport && fileImport) {
      btnImport.addEventListener('click', () => {
        dropdownMore?.classList.add('hidden');
        fileImport.click();
      });
      fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = UmpDrlStorage.importJson(event.target.result);
          if (res.success) {
            this.data = res.data;
            this.renderSemesterSelector();
            this.render();
            this.showToast('Khôi phục dữ liệu thành công!');
          } else {
            alert('Lỗi: ' + res.error);
          }
          fileImport.value = '';
        };
        reader.readAsText(file);
      });
    }

    // Nút Nạp dữ liệu mẫu
    const btnSample = document.getElementById('btn-load-sample');
    if (btnSample) {
      btnSample.addEventListener('click', () => {
        dropdownMore?.classList.add('hidden');
        if (confirm('Nạp dữ liệu mẫu sinh viên Y khoa UMP? Dữ liệu hiện tại sẽ được thay thế.')) {
          this.data = UmpDrlStorage.createInitialData();
          UmpDrlStorage.saveData(this.data);
          this.renderSemesterSelector();
          this.render();
          this.showToast('Đã nạp dữ liệu mẫu sinh viên Y khoa!');
        }
      });
    }

    // Nút Sửa thông tin sinh viên
    const btnEditStudent = document.getElementById('btn-edit-student');
    if (btnEditStudent) {
      btnEditStudent.addEventListener('click', () => this.openEditStudentModal());
    }

    // Nút Kỷ luật CTSV
    const btnDisc = document.getElementById('btn-open-disciplinary');
    if (btnDisc) {
      btnDisc.addEventListener('click', () => this.openDisciplinaryModal());
    }

    // Toggle cột đối chiếu Lớp / Khoa
    const toggleCompare = document.getElementById('toggle-compare-cols');
    if (toggleCompare) {
      toggleCompare.checked = this.showCompareCols;
      toggleCompare.addEventListener('change', (e) => {
        this.showCompareCols = e.target.checked;
        this.renderMainContent();
      });
    }

    // Tìm kiếm nhanh
    const searchInput = document.getElementById('criteria-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderMainContent();
      });
    }

    // 3 nút lọc ngang (Tất cả | Chưa đạt | ⭐ Dễ kiếm điểm)
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => {
          p.classList.remove('bg-[#0B5ED7]', 'text-white');
          p.classList.add('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
        });
        pill.classList.remove('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
        pill.classList.add('bg-[#0B5ED7]', 'text-white');

        this.currentFilter = pill.dataset.filter;
        this.renderMainContent();
      });
    });
  }

  renderSemesterSelector() {
    const semSelect = document.getElementById('semester-select');
    if (!semSelect) return;
    semSelect.innerHTML = '';

    Object.keys(this.data.semesters).forEach(key => {
      const sem = this.data.semesters[key];
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `${sem.semester} • ${sem.academicYear}`;
      if (key === this.data.activeSemesterId) opt.selected = true;
      semSelect.appendChild(opt);
    });
  }

  render() {
    const activeSem = this.getActiveSemester();
    const result = UmpDrlEngine.calculate(activeSem);

    this.renderStudentBar(activeSem);
    this.renderScoreSummaryCard(result);
    this.renderRecentActivitiesCard(activeSem);
    this.renderPartTabsBar(result);
    this.renderToolbar(activeSem, result);
    this.renderMainContent(result);

    const discModal = document.getElementById('disciplinary-modal');
    if (discModal && !discModal.classList.contains('hidden')) {
      this.renderDisciplinaryModalBody(activeSem);
    }
  }

  // --- THANH THÔNG TIN SINH VIÊN DẠNG DÒNG NGANG ---
  renderStudentBar(activeSem) {
    const container = document.getElementById('student-bar-summary');
    if (!container) return;

    const s = activeSem.student || {};
    const name = this.escapeHtml(s.fullName) || '<span class="text-slate-400 italic">Chưa nhập họ tên</span>';
    const mssv = this.escapeHtml(s.studentId) || '---';
    const cls = this.escapeHtml(s.className) || '---';
    const course = this.escapeHtml(s.courseYear) || '---';
    const gpa = s.gpa10 ? parseFloat(s.gpa10).toFixed(2) : '---';
    const gpaBoostBadge = parseFloat(s.gpa10) >= 6.5
      ? '<span class="ml-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">+2đ Cán bộ</span>'
      : '';

    container.innerHTML = `
      <span class="font-bold text-slate-900">${name}</span>
      <span class="text-slate-300">•</span>
      <span>MSSV: <strong class="font-mono text-slate-800">${mssv}</strong></span>
      <span class="text-slate-300">•</span>
      <span>Lớp: <strong class="text-slate-800">${cls}</strong></span>
      <span class="text-slate-300">•</span>
      <span class="hidden sm:inline">Khóa: <strong class="text-slate-800">${course}</strong></span>
      <span class="hidden sm:inline text-slate-300">•</span>
      <span class="inline-flex items-center">
        ĐTB HK (hệ 10): <strong class="text-[#0B5ED7] ml-1">${gpa}</strong>${gpaBoostBadge}
      </span>
    `;
  }

  getTargetScore(activeSem) {
    const val = parseInt(activeSem.targetScore, 10);
    if (isNaN(val)) return 80;
    return Math.max(50, Math.min(100, val));
  }

  getRankNameForScore(score) {
    const found = UMP_RANKING_LEVELS.find(r => score >= r.minScore && score <= r.maxScore);
    return found ? found.name : 'Kém';
  }

  // --- CỘT TRÁI - THẺ 1: VÒNG TRÒN ĐIỂM TỔNG + MỤC TIÊU TÙY CHỈNH ---
  renderScoreSummaryCard(result) {
    const card = document.getElementById('score-summary-card');
    if (!card) return;

    const activeSem = this.getActiveSemester();
    const targetScore = this.getTargetScore(activeSem);
    const targetRankName = this.getRankNameForScore(targetScore);

    const { grandTotal, ranking, isZeroScore, zeroReason } = result;
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.max(0, Math.min(1, grandTotal / targetScore));
    const offset = circumference * (1 - pct);

    const isGoalReached = grandTotal >= targetScore;
    const diff = Math.abs(grandTotal - targetScore);
    const diffText = diff % 1 === 0 ? diff.toFixed(0) : diff.toFixed(1);

    let goalMessageHtml = '';
    if (isGoalReached) {
      goalMessageHtml = `
        <div class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 leading-snug">
          🎉 Tuyệt vời! Bạn đã đạt mục tiêu ${targetScore}đ (vượt +${diffText} điểm).
        </div>
      `;
    } else {
      goalMessageHtml = `
        <p class="text-xs text-slate-600 leading-snug font-medium">
          Còn thiếu <strong class="text-[#0B5ED7]">${diffText} điểm</strong> để đạt mục tiêu <strong>${targetScore}đ</strong> (${targetRankName})!
        </p>
      `;
    }

    let warningHtml = '';
    if (isZeroScore) {
      warningHtml = `
        <div class="mt-2.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] leading-snug">
          <strong>ĐRL = 0đ:</strong> ${this.escapeHtml(zeroReason)}
        </div>
      `;
    } else if (ranking.isCappedByDiscipline) {
      warningHtml = `
        <div class="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-snug">
          <strong>Áp trần kỷ luật:</strong> ${this.escapeHtml(ranking.capReason)}
        </div>
      `;
    }

    const adjusterHtml = this.isEditingTargetScore ? `
      <div id="target-score-adjuster" class="mt-3 pt-3 border-t border-slate-100 space-y-2 text-[11px]">
        <div class="flex items-center justify-between">
          <span class="font-bold text-slate-700">Chỉnh điểm rèn luyện mong muốn</span>
          <button type="button" onclick="window.app.toggleTargetScoreEditor()" class="text-[#0B5ED7] font-semibold hover:underline">Xong</button>
        </div>
        <div class="grid grid-cols-3 gap-1">
          <button type="button" onclick="window.app.setTargetScore(65)"
            class="py-1 px-1.5 rounded border text-center font-semibold transition-colors ${targetScore === 65 ? 'bg-[#0B5ED7] text-white border-[#0B5ED7]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}">
            65đ • Khá
          </button>
          <button type="button" onclick="window.app.setTargetScore(80)"
            class="py-1 px-1.5 rounded border text-center font-semibold transition-colors ${targetScore === 80 ? 'bg-[#0B5ED7] text-white border-[#0B5ED7]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}">
            80đ • Tốt
          </button>
          <button type="button" onclick="window.app.setTargetScore(90)"
            class="py-1 px-1.5 rounded border text-center font-semibold transition-colors ${targetScore === 90 ? 'bg-[#0B5ED7] text-white border-[#0B5ED7]' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}">
            90đ • XS
          </button>
        </div>
        <div class="flex items-center justify-between gap-2">
          <span class="text-slate-500 font-medium">Số điểm (50–100):</span>
          <div class="inline-flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
            <button type="button" onclick="window.app.adjustTargetScore(-1)" class="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700">-</button>
            <input type="number" id="inp-target-score" min="50" max="100" value="${targetScore}"
              onchange="window.app.setTargetScore(this.value)"
              class="w-12 text-center py-1 font-bold text-[#0B5ED7] focus:outline-none">
            <button type="button" onclick="window.app.adjustTargetScore(1)" class="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700">+</button>
          </div>
        </div>
      </div>
    ` : '';

    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tổng Điểm ĐRL</span>
        <button type="button" id="btn-edit-target-score" onclick="window.app.toggleTargetScoreEditor()"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F8FF] hover:bg-blue-100 text-[#0B5ED7] border border-blue-200 transition-colors">
          <span>🎯 Mục tiêu: ${targetScore}đ ✎</span>
        </button>
      </div>

      <div class="flex items-center gap-3.5">
        <!-- Vòng tròn điểm tổng -->
        <div class="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg class="w-20 h-20" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="${radius}" fill="none" stroke="#E2E8F0" stroke-width="7"></circle>
            <circle cx="40" cy="40" r="${radius}" fill="none" stroke="${isGoalReached ? '#16A34A' : (ranking.color || '#0B5ED7')}" stroke-width="7"
              stroke-linecap="round" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
              class="score-ring-circle"></circle>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span class="text-xl font-extrabold text-slate-900">${grandTotal % 1 === 0 ? grandTotal.toFixed(0) : grandTotal.toFixed(1)}</span>
            <span class="text-[10px] font-semibold text-slate-400 mt-0.5">/ 100</span>
          </div>
        </div>

        <!-- Xếp loại & Mục tiêu -->
        <div class="min-w-0 flex-1 space-y-1.5">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[11px] font-semibold text-slate-500">Xếp loại:</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold ${ranking.badgeClass}">
              ${ranking.name}
            </span>
          </div>
          ${goalMessageHtml}
        </div>
      </div>
      ${adjusterHtml}
      ${warningHtml}
    `;
  }

  // --- CỘT TRÁI - THẺ 3: HOẠT ĐỘNG VỪA GHI NHẬN (THÊM / XÓA TRỰC TIẾP) ---
  renderRecentActivitiesCard(activeSem) {
    const card = document.getElementById('recent-activities-card');
    if (!card) return;

    const allActs = this.collectAllActivitiesForAppendix(activeSem)
      .sort((a, b) => {
        const timeCmp = (b.createdAt || 0) - (a.createdAt || 0);
        if (timeCmp !== 0) return timeCmp;
        const dateCmp = (b.date || '').localeCompare(a.date || '');
        if (dateCmp !== 0) return dateCmp;
        return (b.id || '').localeCompare(a.id || '');
      });

    const visibleActs = this.showAllRecentActivities ? allActs : allActs.slice(0, 5);

    let listHtml = '';
    if (allActs.length === 0) {
      listHtml = `<p class="text-[11px] text-slate-400 italic py-2">Chưa có hoạt động nào được ghi nhận.</p>`;
    } else {
      listHtml = `
        <ul class="divide-y divide-slate-100 ${this.showAllRecentActivities ? 'max-h-56 overflow-y-auto pr-1' : ''}">
          ${visibleActs.map(act => `
            <li class="py-1.5 flex items-center justify-between gap-2 text-[11px] group">
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-slate-800 truncate" title="${this.escapeHtml(act.title)}">
                  ${this.escapeHtml(act.title || 'Hoạt động chưa đặt tên')}
                </div>
                <div class="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span class="font-semibold text-[#0B5ED7]">${act.critCode}</span>
                  <span>•</span>
                  <span>${act.date || 'Chưa rõ ngày'}</span>
                </div>
              </div>
              <button type="button" onclick="window.app.deleteActivityFromSidebar('${act.critId}', '${act.id}')"
                class="shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Xóa hoạt động này">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </li>
          `).join('')}
        </ul>
      `;
    }

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <div class="flex items-center gap-1.5 min-w-0">
          <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wide truncate">Hoạt động vừa ghi nhận</h3>
        </div>
        <button type="button" id="btn-quick-add-activity" onclick="window.app.openQuickAddModal()"
          class="shrink-0 px-2 py-0.5 rounded-md bg-[#0B5ED7] hover:bg-[#004A99] text-white text-[11px] font-semibold transition-colors">
          + Thêm
        </button>
      </div>
      ${allActs.length > 5 ? `
        <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>${this.showAllRecentActivities ? `Đang xem tất cả (${allActs.length})` : `5 gần nhất / ${allActs.length} HĐ`}</span>
          <button type="button" onclick="window.app.toggleShowAllRecentActivities()" class="text-[#0B5ED7] hover:underline font-semibold">
            ${this.showAllRecentActivities ? 'Thu gọn 5 gần nhất' : `Xem tất cả (${allActs.length})`}
          </button>
        </div>
      ` : ''}
      ${listHtml}
    `;
  }

  // --- CỘT PHẢI: THANH 5 TAB NGANG + TAB TẤT CẢ ---
  renderPartTabsBar(result) {
    const bar = document.getElementById('part-tabs-bar');
    if (!bar) return;

    const { parts, grandTotal } = result;
    const tabs = [
      { id: '1', label: 'P1. Học tập', score: parts.part1.totalScore, max: 20, capped: parts.part1.isCapped },
      { id: '2', label: 'P2. Nội quy', score: parts.part2.totalScore, max: 25, capped: parts.part2.isCapped },
      { id: '3', label: 'P3. VH-TT', score: parts.part3.totalScore, max: 20, capped: parts.part3.isCapped },
      { id: '4', label: 'P4. Cộng đồng', score: parts.part4.totalScore, max: 25, capped: parts.part4.isCapped },
      { id: '5', label: 'P5. Cán bộ', score: parts.part5.totalScore, max: 10, capped: parts.part5.isCapped },
      { id: 'all', label: 'Tất cả', score: grandTotal, max: 100, capped: false }
    ];

    bar.innerHTML = tabs.map(t => {
      const isActive = this.activeTab === t.id;
      const pct = Math.min(100, Math.round((t.score / t.max) * 100));
      const scoreText = `${t.score % 1 === 0 ? t.score.toFixed(0) : t.score.toFixed(1)}/${t.max}`;

      return `
        <button type="button" onclick="window.app.switchTab('${t.id}')"
          class="flex flex-col justify-between p-2 rounded-lg border text-left transition-all ${isActive
            ? 'bg-[#F4F8FF] border-[#0B5ED7] shadow-2xs'
            : 'bg-white border-transparent hover:bg-slate-50'}">
          <div class="flex items-center justify-between w-full gap-1">
            <span class="text-[11px] font-bold truncate ${isActive ? 'text-[#0B5ED7]' : 'text-slate-700'}">${t.label}</span>
            <span class="text-[11px] font-bold shrink-0 ${t.capped ? 'text-amber-600' : (isActive ? 'text-[#0B5ED7]' : 'text-slate-500')}">${scoreText}</span>
          </div>
          <div class="w-full bg-slate-200/80 rounded-full h-1 mt-1.5 overflow-hidden">
            <div class="h-1 rounded-full transition-all duration-300 ${t.capped ? 'bg-amber-500' : 'bg-[#0B5ED7]'}" style="width: ${pct}%"></div>
          </div>
        </button>
      `;
    }).join('');
  }

  // --- THANH CÔNG CỤ NHỎ TRÊN BẢNG TIÊU CHÍ ---
  renderToolbar(activeSem, result) {
    const subtitle = document.getElementById('active-tab-subtitle');
    if (subtitle) {
      if (this.activeTab === 'all') {
        subtitle.textContent = 'Toàn bộ 5 phần đánh giá (Tối đa 100đ)';
      } else {
        const part = UMP_CRITERIA_DATA.find(p => String(p.partId) === this.activeTab);
        if (part) {
          subtitle.textContent = `Phần ${part.partId}: ${part.shortTitle} (Tối đa ${part.maxScore}đ)`;
        }
      }
    }

    const btnDisc = document.getElementById('btn-open-disciplinary');
    if (btnDisc) {
      const disc = activeSem.disciplinary || {};
      const hasDisc = (parseInt(disc.reprimand, 10) || 0) > 0 || (parseInt(disc.warning, 10) || 0) > 0 || !!disc.suspended;
      if (hasDisc) {
        btnDisc.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold bg-red-50 border-red-200 text-red-700 hover:bg-red-100 transition-colors';
        btnDisc.innerHTML = `<span>⚠️ Kỷ luật CTSV: ${disc.suspended ? 'Đình chỉ (0đ)' : '-' + result.discPenaltyScore + 'đ'}</span>`;
      } else {
        btnDisc.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors';
        btnDisc.innerHTML = `<span>Kỷ luật CTSV (0đ)</span>`;
      }
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    const result = UmpDrlEngine.calculate(this.getActiveSemester());
    this.renderPartTabsBar(result);
    this.renderToolbar(this.getActiveSemester(), result);
    this.renderMainContent(result);
  }

  // --- CỘT PHẢI: BẢNG TIÊU CHÍ RÚT GỌN 3 CỘT (+2 CỘT ĐỐI CHIẾU KHI BẬT TOGGLE) ---
  renderMainContent(result) {
    const mainCol = document.getElementById('main-content-col');
    if (!mainCol) return;

    const activeSem = this.getActiveSemester();
    if (!result) result = UmpDrlEngine.calculate(activeSem);
    const evals = activeSem.evaluations || {};

    const partsToShow = this.activeTab === 'all'
      ? UMP_CRITERIA_DATA
      : UMP_CRITERIA_DATA.filter(p => String(p.partId) === this.activeTab);

    let html = '';

    partsToShow.forEach(part => {
      const partResult = result.parts[`part${part.partId}`];
      const filteredSections = this.filterPartSections(part, evals);
      if (filteredSections.length === 0) return;

      html += `
        <div class="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-visible">
          ${this.activeTab === 'all' ? `
            <div class="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between rounded-t-xl">
              <span class="font-bold text-slate-800 text-xs uppercase">${part.partId}. ${part.shortTitle}</span>
              <span class="text-xs font-bold text-[#0B5ED7]">${partResult.totalScore.toFixed(1)} / ${part.maxScore}đ</span>
            </div>
          ` : ''}

          ${filteredSections.map((sec, sIdx) => `
            <div class="${sIdx > 0 ? 'border-t border-slate-200' : ''}">
              <div class="px-3.5 py-2 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                  <h4 class="font-bold text-slate-800 text-xs">${sec.title}</h4>
                  ${sec.subNote ? this.renderInfoTooltip(sec.subNote) : ''}
                </div>
                ${sec.maxScore ? `<span class="text-[11px] font-semibold text-slate-500 shrink-0">Tối đa ${sec.maxScore}đ</span>` : ''}
              </div>

              <table class="criteria-table text-xs">
                <thead>
                  <tr>
                    <th class="${this.showCompareCols ? 'w-[44%]' : 'w-[52%]'} text-left">Nội dung tiêu chí & Hoạt động đã lưu</th>
                    <th class="${this.showCompareCols ? 'w-[30%]' : 'w-[36%]'} text-left">Thao tác</th>
                    <th class="${this.showCompareCols ? 'w-[10%]' : 'w-[12%]'} text-center">Điểm đạt</th>
                    ${this.showCompareCols ? `
                      <th class="w-[8%] text-center">Lớp</th>
                      <th class="w-[8%] text-center">Khoa</th>
                    ` : ''}
                  </tr>
                </thead>
                <tbody>
                  ${sec.criteria.map(crit => this.renderCriterionRow(crit, evals[crit.id] || {}, activeSem)).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>
      `;
    });

    if (!html) {
      html = `
        <div class="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Không tìm thấy tiêu chí nào phù hợp với bộ lọc hiện tại.
        </div>
      `;
    }

    mainCol.innerHTML = html;
  }

  // --- TOOLTIP (ⓘ) CHỨA GHI CHÚ QUY ĐỊNH DÀI ---
  renderInfoTooltip(text) {
    if (!text) return '';
    return `
      <span class="info-tooltip-wrap" tabindex="0">
        <span class="info-tooltip-btn" aria-label="Xem ghi chú quy định">i</span>
        <span class="info-tooltip-box">${this.escapeHtml(text)}</span>
      </span>
    `;
  }

  // --- LỌC TIÊU CHÍ (TẤT CẢ | CHƯA ĐẠT | ⭐ DỄ KIẾM) ---
  filterPartSections(part, evals) {
    return part.sections.map(section => {
      const filteredCriteria = section.criteria.filter(crit => {
        if (this.searchQuery) {
          const q = this.searchQuery;
          const matchTitle = crit.title.toLowerCase().includes(q);
          const matchCode = (crit.code || '').toLowerCase().includes(q);
          const matchNote = (crit.note || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCode && !matchNote) return false;
        }

        if (this.currentFilter === 'easy') {
          return !!crit.easyPoint;
        }

        if (this.currentFilter === 'uncompleted') {
          const critEval = evals[crit.id] || {};
          return this.getCriterionScore(crit, critEval) === 0;
        }

        return true;
      });

      return { ...section, criteria: filteredCriteria };
    }).filter(s => s.criteria.length > 0);
  }

  getCriterionScore(crit, evalData) {
    if (crit.type === 'pass_fail_toggle') return evalData.passed !== false ? crit.passScore : 0;
    if (crit.type === 'discipline_status') return (evalData.status || 'dat') === 'dat' ? crit.ruleScore : 0;
    if (crit.type === 'academic_grade') return parseInt(evalData.selectedScore, 10) || 0;
    if (crit.type === 'checkbox_single') return evalData.checked ? crit.pointsIfChecked : 0;
    if (crit.type === 'step_counter') return (parseInt(evalData.steps, 10) || 0) * crit.pointsPerUnit;
    if (crit.type === 'activity_list') {
      const acts = evalData.activities || [];
      const count = acts.length || (parseInt(evalData.count, 10) || 0);
      let s = count * crit.pointsPerUnit;
      if (crit.maxCap) s = Math.min(crit.maxCap, s);
      return s;
    }
    if (crit.type === 'auto_bonus_1_2') {
      const activeSem = this.getActiveSemester();
      return UmpDrlEngine.calculatePart1(activeSem.evaluations || {}, activeSem.student?.gpa10 || 0).auto_bonus_1_2;
    }
    if (crit.type === 'cadre_role_select') {
      const activeSem = this.getActiveSemester();
      return UmpDrlEngine.calculatePart5(activeSem.evaluations || {}, activeSem.student?.gpa10 || 0).evalScore;
    }
    return 0;
  }

  // --- RENDER 1 DÒNG TIÊU CHÍ RÚT GỌN ---
  renderCriterionRow(crit, critEval, activeSem) {
    const selfScore = this.getCriterionScore(crit, critEval);
    const isAchieved = selfScore > 0;
    const classScoreVal = critEval.classScore !== undefined ? critEval.classScore : '';
    const facultyScoreVal = critEval.facultyScore !== undefined ? critEval.facultyScore : '';

    // Gom các ghi chú dài vào tooltip (ⓘ)
    const tooltipParts = [];
    if (crit.proofRequirement) tooltipParts.push(`Minh chứng: ${crit.proofRequirement}`);
    if (crit.note) tooltipParts.push(crit.note);
    if (crit.penaltyNote) tooltipParts.push(crit.penaltyNote);
    if (crit.maxCap) tooltipParts.push(`Tối đa ${crit.maxCap} điểm cho mục này.`);
    const tooltipText = tooltipParts.join(' • ');

    const ruleBadge = crit.ruleScore !== 0
      ? `<span class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 ml-1">${crit.ruleScore > 0 ? '+' + crit.ruleScore : crit.ruleScore}${crit.unit ? ' ' + crit.unit : 'đ'}</span>`
      : '';

    return `
      <tr id="row-${crit.id}" class="criteria-row ${isAchieved ? 'criteria-row-achieved' : ''}">
        <!-- Cột 1: Nội dung tiêu chí & Hoạt động đã lưu -->
        <td>
          <div class="text-xs text-slate-800 leading-snug">
            ${crit.easyPoint ? '<span class="text-amber-500 mr-1" title="Dễ kiếm điểm">⭐</span>' : ''}
            <span class="font-bold text-[#004A99]">${crit.code}</span>
            <span class="font-medium ml-1">${crit.title}</span>
            ${ruleBadge}
            ${tooltipText ? this.renderInfoTooltip(tooltipText) : ''}
          </div>
          ${crit.type === 'activity_list' ? this.renderSavedActivitiesList(crit, critEval) : ''}
        </td>

        <!-- Cột 2: Thao tác -->
        <td>
          ${this.renderCriterionControl(crit, critEval, activeSem)}
        </td>

        <!-- Cột 3: Điểm đạt -->
        <td class="text-center whitespace-nowrap">
          <span class="inline-block px-2 py-0.5 rounded font-bold text-xs ${isAchieved ? 'bg-blue-100 text-[#004A99]' : 'bg-slate-100 text-slate-400'}">
            ${isAchieved ? '+' + selfScore : selfScore}đ
          </span>
        </td>

        ${this.showCompareCols ? `
          <td class="text-center">
            <input type="number" step="0.5" min="0" max="25" placeholder="-" value="${classScoreVal}"
              onchange="window.app.updatePartyScore('${crit.id}', 'classScore', this.value)"
              class="w-12 text-center text-xs py-1 border border-slate-300 rounded font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none">
          </td>
          <td class="text-center">
            <input type="number" step="0.5" min="0" max="25" placeholder="-" value="${facultyScoreVal}"
              onchange="window.app.updatePartyScore('${crit.id}', 'facultyScore', this.value)"
              class="w-12 text-center text-xs py-1 border border-slate-300 rounded font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none">
          </td>
        ` : ''}
      </tr>
    `;
  }

  // --- DANH SÁCH HOẠT ĐỘNG ĐÃ LƯU HIỂN THỊ GỌN TRONG CỘT 1 ---
  renderSavedActivitiesList(crit, critEval) {
    const activities = critEval.activities || [];
    if (activities.length === 0) return '';

    return `
      <div class="mt-2 space-y-1.5">
        ${activities.map((act, idx) => `
          <div class="sub-activity-item px-2.5 py-1.5 text-[11px] flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 flex-1 min-w-0">
                <span class="w-4 h-4 rounded-full bg-blue-50 text-[#0B5ED7] text-[10px] font-bold inline-flex items-center justify-center shrink-0">${idx + 1}</span>
                <input type="text" value="${this.escapeHtml(act.title || '')}" placeholder="Nhập tên hoạt động / sự kiện..."
                  onchange="window.app.updateActivityField('${crit.id}', '${act.id}', 'title', this.value)"
                  class="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#0B5ED7] focus:outline-none font-semibold text-slate-800">
              </div>
              <button type="button" onclick="window.app.removeActivity('${crit.id}', '${act.id}')"
                class="text-slate-400 hover:text-red-600 p-0.5 rounded" title="Xóa hoạt động">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="flex flex-wrap items-center gap-2 pl-5 text-[10px] text-slate-500">
              <input type="date" value="${act.date || ''}"
                onchange="window.app.updateActivityField('${crit.id}', '${act.id}', 'date', this.value)"
                class="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none focus:border-blue-400">
              <input type="text" value="${this.escapeHtml(act.proof || '')}" placeholder="Minh chứng / Số GCN..."
                onchange="window.app.updateActivityField('${crit.id}', '${act.id}', 'proof', this.value)"
                class="flex-1 min-w-[140px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none focus:border-blue-400">
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- RENDER CONTROL THAO TÁC CỘT 2 ---
  renderCriterionControl(crit, critEval, activeSem) {
    if (crit.type === 'pass_fail_toggle') {
      const isPassed = critEval.passed !== false;
      return `
        <div class="inline-flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
          <button type="button" onclick="window.app.togglePassFail('${crit.id}', true)"
            class="px-2.5 py-1 text-[11px] font-semibold transition-colors ${isPassed ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">
            ✓ Đạt
          </button>
          <button type="button" onclick="window.app.togglePassFail('${crit.id}', false)"
            class="px-2.5 py-1 text-[11px] font-semibold transition-colors ${!isPassed ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">
            Vi phạm
          </button>
        </div>
        ${!isPassed && crit.isCriticalZeroTrigger ? `<div class="text-[10px] text-red-600 font-bold mt-1">🚨 Khiến ĐRL cả kỳ = 0đ!</div>` : ''}
      `;
    }

    if (crit.type === 'discipline_status') {
      const status = critEval.status || 'dat';
      return `
        <select onchange="window.app.updateDisciplineStatus('${crit.id}', this.value)"
          class="w-full text-[11px] py-1 px-2 border rounded-lg font-medium focus:outline-none ${status === 'dat' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}">
          <option value="dat" ${status === 'dat' ? 'selected' : ''}>✓ Đạt (+2đ)</option>
          <option value="vipham_1" ${status === 'vipham_1' ? 'selected' : ''}>⚠️ Vi phạm lần 1 (0đ)</option>
          <option value="vipham_2" ${status === 'vipham_2' ? 'selected' : ''}>❌ Vi phạm ≥ 2 lần (0đ, -2đ)</option>
        </select>
      `;
    }

    if (crit.type === 'academic_grade') {
      const currentVal = critEval.selectedScore !== undefined ? critEval.selectedScore : 7;
      return `
        <select onchange="window.app.updateAcademicGrade('${crit.id}', this.value)"
          class="w-full text-[11px] py-1 px-2 border border-slate-300 rounded-lg font-medium bg-white text-slate-800 focus:ring-1 focus:ring-blue-500">
          ${crit.options.map(opt => `<option value="${opt.score}" ${currentVal == opt.score ? 'selected' : ''}>${opt.label}</option>`).join('')}
        </select>
      `;
    }

    if (crit.type === 'cadre_role_select') {
      return this.renderCadreRoleControl(crit, critEval, activeSem);
    }

    if (crit.type === 'auto_bonus_1_2') {
      const p1 = UmpDrlEngine.calculatePart1(activeSem.evaluations || {}, activeSem.student?.gpa10 || 0);
      return `
        <span class="inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${p1.auto_bonus_1_2 > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}">
          Mục 1.2 thô: ${p1.raw_1_2}đ ${p1.auto_bonus_1_2 > 0 ? '(Đã cộng +2đ)' : '(Cần ≥10đ)'}
        </span>
      `;
    }

    if (crit.type === 'checkbox_single') {
      const isChecked = !!critEval.checked;
      return `
        <label class="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="window.app.toggleSingleCheckbox('${crit.id}', this.checked)"
            class="w-3.5 h-3.5 text-[#0B5ED7] rounded border-slate-300 cursor-pointer">
          <span class="${isChecked ? 'text-[#004A99] font-semibold' : 'text-slate-600'}">${isChecked ? 'Đã đạt' : 'Chọn nếu đạt'}</span>
        </label>
      `;
    }

    if (crit.type === 'step_counter') {
      const steps = parseInt(critEval.steps, 10) || 0;
      return `
        <div class="inline-flex items-center gap-2 text-[11px]">
          <div class="inline-flex items-center border border-slate-300 rounded-md overflow-hidden bg-white">
            <button type="button" onclick="window.app.adjustCounter('${crit.id}', 'steps', -1, 0, 5)" class="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 font-bold">-</button>
            <span class="px-2 font-bold text-slate-800">${steps} bậc</span>
            <button type="button" onclick="window.app.adjustCounter('${crit.id}', 'steps', 1, 0, 5)" class="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 font-bold">+</button>
          </div>
        </div>
      `;
    }

    if (crit.type === 'penalty_checkbox') {
      const isPenalized = !!critEval.checked;
      return `
        <label class="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px]">
          <input type="checkbox" ${isPenalized ? 'checked' : ''} onchange="window.app.toggleSingleCheckbox('${crit.id}', this.checked)"
            class="w-3.5 h-3.5 text-red-600 rounded border-red-300 cursor-pointer">
          <span class="${isPenalized ? 'text-red-700 font-bold' : 'text-slate-600'}">${isPenalized ? 'Không đạt (-10đ)' : 'Đã đạt (0đ trừ)'}</span>
        </label>
      `;
    }

    if (crit.type === 'penalty_counter') {
      const count = parseInt(critEval.count, 10) || 0;
      return `
        <div class="inline-flex items-center gap-2 text-[11px]">
          <div class="inline-flex items-center border border-slate-300 rounded-md overflow-hidden bg-white">
            <button type="button" onclick="window.app.adjustCounter('${crit.id}', 'count', -1, 0, 20)" class="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 font-bold">-</button>
            <span class="px-2 font-bold ${count > 0 ? 'text-red-600' : 'text-slate-600'}">${count} lần</span>
            <button type="button" onclick="window.app.adjustCounter('${crit.id}', 'count', 1, 0, 20)" class="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 font-bold">+</button>
          </div>
          ${count > 0 ? `<span class="text-red-600 font-bold">-${count * crit.penaltyPerUnit}đ</span>` : ''}
        </div>
      `;
    }

    if (crit.type === 'deduction_input') {
      const score = critEval.score || '';
      return `
        <div class="inline-flex items-center gap-1.5 text-[11px]">
          <span class="text-slate-500">Trừ:</span>
          <input type="number" step="0.5" min="0" max="25" value="${score}" placeholder="0"
            onchange="window.app.updateDeductionScore('${crit.id}', this.value)"
            class="w-14 px-1.5 py-0.5 text-center border border-red-200 rounded bg-red-50/40 font-bold text-red-700 focus:outline-none">
          <span class="text-slate-400">đ</span>
        </div>
      `;
    }

    if (crit.type === 'activity_list') {
      const acts = critEval.activities || [];
      return `
        <div class="space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" onclick="window.app.addEmptyActivity('${crit.id}')"
              class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-blue-50 text-[#0B5ED7] hover:bg-blue-100 border border-blue-200 transition-colors">
              <span>+ Thêm hoạt động</span>
            </button>
            <span class="text-[11px] text-slate-500 font-medium">${acts.length} HĐ</span>
          </div>
          ${crit.sampleActivities && crit.sampleActivities.length > 0 ? `
            <div class="flex flex-wrap gap-1">
              ${crit.sampleActivities.slice(0, 1).map(sample => `
                <button type="button" onclick="window.app.addPresetActivity('${crit.id}', '${this.escapeHtml(sample)}')"
                  class="text-[10px] text-slate-500 hover:text-[#0B5ED7] bg-slate-100 hover:bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-[220px]" title="${this.escapeHtml(sample)}">
                  + Mẫu: ${this.escapeHtml(sample)}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    return '-';
  }

  renderCadreRoleControl(crit, critEval, activeSem) {
    const roleGroup = critEval.group || 'D';
    const performance = critEval.performance || 'none';
    const classMemberMode = critEval.classMemberMode || 'all';
    const gpa10 = parseFloat(activeSem.student?.gpa10) || 0;
    const hasBoost = (roleGroup === 'B' || roleGroup === 'C') && performance === 'xuat_sac' && gpa10 >= 6.5;

    return `
      <div class="space-y-1.5 text-[11px]">
        <select onchange="window.app.updateCadreGroup(this.value)"
          class="w-full py-1 px-2 border border-slate-300 rounded-lg font-medium bg-white focus:ring-1 focus:ring-blue-500">
          <option value="D" ${roleGroup === 'D' ? 'selected' : ''}>Nhóm D: Thành viên lớp</option>
          <option value="A" ${roleGroup === 'A' ? 'selected' : ''}>Nhóm A: BCH Đoàn-Hội ĐHYD/Khoa</option>
          <option value="B" ${roleGroup === 'B' ? 'selected' : ''}>Nhóm B: BCS Lớp, BCH Lớp, CLB Khoa</option>
          <option value="C" ${roleGroup === 'C' ? 'selected' : ''}>Nhóm C: Tổ trưởng, nhóm trưởng</option>
        </select>

        ${roleGroup !== 'D' ? `
          <select onchange="window.app.updateCadrePerformance(this.value)"
            class="w-full py-1 px-2 border border-slate-300 rounded-lg font-medium bg-white focus:ring-1 focus:ring-blue-500">
            <option value="none" ${performance === 'none' ? 'selected' : ''}>-- Mức hoàn thành --</option>
            <option value="xuat_sac" ${performance === 'xuat_sac' ? 'selected' : ''}>Hoàn thành xuất sắc ${hasBoost ? '(+2đ GPA ≥ 6.5)' : ''}</option>
            <option value="tot" ${performance === 'tot' ? 'selected' : ''}>Hoàn thành tốt</option>
            <option value="hoan_thanh" ${performance === 'hoan_thanh' ? 'selected' : ''}>Hoàn thành nhiệm vụ</option>
          </select>
        ` : `
          <div class="space-y-1 bg-slate-50 p-1.5 rounded border border-slate-200">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="classMemberMode" value="all" ${classMemberMode === 'all' ? 'checked' : ''}
                onchange="window.app.updateClassMemberMode('all')" class="text-[#0B5ED7]">
              <span>Tham gia đủ HĐ lớp (+6đ)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="classMemberMode" value="count" ${classMemberMode === 'count' ? 'checked' : ''}
                onchange="window.app.updateClassMemberMode('count')" class="text-[#0B5ED7]">
              <span>Theo số HĐ (1đ/HĐ, tối đa 6đ)</span>
            </label>
            ${classMemberMode === 'count' ? `
              <div class="pt-1">
                <button type="button" onclick="window.app.addEmptyActivity('c_5_1_role_class_acts')"
                  class="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-[#0B5ED7] border border-blue-200">
                  + Thêm HĐ lớp (${(critEval.classActivities || []).length})
                </button>
              </div>
            ` : ''}
          </div>
        `}
      </div>
    `;
  }

  // --- MODALS ---
  openEditStudentModal() {
    const s = this.getActiveSemester().student || {};
    document.getElementById('modal-student-name').value = s.fullName || '';
    document.getElementById('modal-student-id').value = s.studentId || '';
    document.getElementById('modal-student-class').value = s.className || '';
    document.getElementById('modal-student-course').value = s.courseYear || 'Khóa 2026 - 2032';
    document.getElementById('modal-student-gpa').value = s.gpa10 || '';
    document.getElementById('edit-student-modal').classList.remove('hidden');
  }

  closeEditStudentModal() {
    document.getElementById('edit-student-modal').classList.add('hidden');
  }

  saveStudentModal() {
    const activeSem = this.getActiveSemester();
    activeSem.student = {
      fullName: document.getElementById('modal-student-name').value.trim(),
      studentId: document.getElementById('modal-student-id').value.trim(),
      className: document.getElementById('modal-student-class').value.trim(),
      courseYear: document.getElementById('modal-student-course').value.trim(),
      gpa10: document.getElementById('modal-student-gpa').value.trim()
    };
    this.scheduleAutoSave();
    this.closeEditStudentModal();
    this.render();
    this.showToast('Đã cập nhật thông tin sinh viên!');
  }

  openDisciplinaryModal() {
    this.renderDisciplinaryModalBody(this.getActiveSemester());
    document.getElementById('disciplinary-modal').classList.remove('hidden');
  }

  closeDisciplinaryModal() {
    document.getElementById('disciplinary-modal').classList.add('hidden');
  }

  renderDisciplinaryModalBody(activeSem) {
    const body = document.getElementById('disciplinary-modal-body');
    if (!body) return;
    const disc = activeSem.disciplinary || {};
    const reprimand = parseInt(disc.reprimand, 10) || 0;
    const warning = parseInt(disc.warning, 10) || 0;
    const isSuspended = !!disc.suspended;

    body.innerHTML = `
      <div class="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
        <div>
          <div class="font-bold text-slate-800">Khiển trách (-5đ/lần)</div>
          <div class="text-[11px] text-slate-500">Xếp loại tối đa chỉ được mức Khá.</div>
        </div>
        <div class="inline-flex items-center border border-slate-300 rounded-md bg-white">
          <button type="button" onclick="window.app.adjustDisciplineCount('reprimand', -1)" class="px-2.5 py-1 font-bold">-</button>
          <span class="px-2.5 font-bold text-red-600">${reprimand}</span>
          <button type="button" onclick="window.app.adjustDisciplineCount('reprimand', 1)" class="px-2.5 py-1 font-bold">+</button>
        </div>
      </div>

      <div class="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
        <div>
          <div class="font-bold text-slate-800">Cảnh cáo (-10đ/lần)</div>
          <div class="text-[11px] text-slate-500">Xếp loại tối đa chỉ được mức Trung bình.</div>
        </div>
        <div class="inline-flex items-center border border-slate-300 rounded-md bg-white">
          <button type="button" onclick="window.app.adjustDisciplineCount('warning', -1)" class="px-2.5 py-1 font-bold">-</button>
          <span class="px-2.5 font-bold text-red-600">${warning}</span>
          <button type="button" onclick="window.app.adjustDisciplineCount('warning', 1)" class="px-2.5 py-1 font-bold">+</button>
        </div>
      </div>

      <label class="p-3 rounded-lg border ${isSuspended ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} flex items-center justify-between text-xs cursor-pointer">
        <div>
          <div class="font-bold text-red-700">Bị đình chỉ học trở lên</div>
          <div class="text-[11px] text-slate-500">Tổng điểm ĐRL học kỳ = 0đ (Không đánh giá).</div>
        </div>
        <input type="checkbox" ${isSuspended ? 'checked' : ''} onchange="window.app.toggleDisciplineSuspended(this.checked)"
          class="w-4 h-4 text-red-600 rounded border-red-300">
      </label>
    `;
  }

  openNewSemesterModal() {
    document.getElementById('new-semester-modal')?.classList.remove('hidden');
  }

  closeNewSemesterModal() {
    document.getElementById('new-semester-modal')?.classList.add('hidden');
  }

  confirmCreateSemester() {
    const year = document.getElementById('new-sem-year').value.trim();
    const sem = document.getElementById('new-sem-term').value;
    const keepStudent = document.getElementById('new-sem-keep-student').checked;
    if (!year) return alert('Vui lòng nhập năm học');

    const studentInfo = keepStudent ? { ...this.getActiveSemester().student } : {};
    const newSem = UmpDrlStorage.createDefaultSemester(year, sem, studentInfo);
    this.data.semesters[newSem.id] = newSem;
    this.data.activeSemesterId = newSem.id;

    UmpDrlStorage.saveData(this.data);
    this.closeNewSemesterModal();
    this.renderSemesterSelector();
    this.render();
    this.showToast(`Đã tạo ${sem} (${year})!`);
  }

  // --- HANDLERS CẬP NHẬT DỮ LIỆU ---
  togglePassFail(critId, passed) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
    activeSem.evaluations[critId].passed = passed;
    this.scheduleAutoSave();
    this.render();
  }

  updateDisciplineStatus(critId, status) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
    activeSem.evaluations[critId].status = status;
    this.scheduleAutoSave();
    this.render();
  }

  updateAcademicGrade(critId, val) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
    activeSem.evaluations[critId].selectedScore = parseInt(val, 10) || 0;
    this.scheduleAutoSave();
    this.render();
  }

  toggleSingleCheckbox(critId, checked) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
    activeSem.evaluations[critId].checked = checked;
    this.scheduleAutoSave();
    this.render();
  }

  adjustCounter(critId, field, delta, min = 0, max = 50) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
    let cur = parseInt(activeSem.evaluations[critId][field], 10) || 0;
    activeSem.evaluations[critId][field] = Math.max(min, Math.min(max, cur + delta));
    this.scheduleAutoSave();
    this.render();
  }

  updateDeductionScore(critId, val) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
    activeSem.evaluations[critId].score = parseFloat(val) || 0;
    this.scheduleAutoSave();
    this.render();
  }

  updatePartyScore(critId, partyKey, val) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
    activeSem.evaluations[critId][partyKey] = val !== '' ? parseFloat(val) : '';
    this.scheduleAutoSave();
  }

  addEmptyActivity(critId) {
    const activeSem = this.getActiveSemester();
    const newAct = {
      id: 'act_' + Date.now(),
      createdAt: Date.now(),
      title: '',
      date: new Date().toISOString().split('T')[0],
      proof: ''
    };
    if (critId === 'c_5_1_role_class_acts') {
      if (!activeSem.evaluations['c_5_1_role']) activeSem.evaluations['c_5_1_role'] = {};
      if (!activeSem.evaluations['c_5_1_role'].classActivities) activeSem.evaluations['c_5_1_role'].classActivities = [];
      activeSem.evaluations['c_5_1_role'].classActivities.push(newAct);
    } else {
      if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
      if (!activeSem.evaluations[critId].activities) activeSem.evaluations[critId].activities = [];
      activeSem.evaluations[critId].activities.push(newAct);
    }
    this.scheduleAutoSave();
    this.render();
  }

  addPresetActivity(critId, title) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
    if (!activeSem.evaluations[critId].activities) activeSem.evaluations[critId].activities = [];
    activeSem.evaluations[critId].activities.push({
      id: 'act_' + Date.now(),
      createdAt: Date.now(),
      title,
      date: new Date().toISOString().split('T')[0],
      proof: 'Đã hoàn thành theo danh sách của BTC'
    });
    this.scheduleAutoSave();
    this.render();
    this.showToast(`Đã thêm: "${title}"`);
  }

  updateActivityField(critId, actId, field, val) {
    const activeSem = this.getActiveSemester();
    const acts = critId === 'c_5_1_role_class_acts'
      ? (activeSem.evaluations['c_5_1_role']?.classActivities || [])
      : (activeSem.evaluations[critId]?.activities || []);
    const item = acts.find(a => a.id === actId);
    if (item) {
      item[field] = val;
      this.scheduleAutoSave();
      this.renderRecentActivitiesCard(activeSem);
    }
  }

  removeActivity(critId, actId) {
    const activeSem = this.getActiveSemester();
    if (critId === 'c_5_1_role_class_acts') {
      if (activeSem.evaluations['c_5_1_role']?.classActivities) {
        activeSem.evaluations['c_5_1_role'].classActivities = activeSem.evaluations['c_5_1_role'].classActivities.filter(a => a.id !== actId);
      }
    } else if (activeSem.evaluations[critId]?.activities) {
      activeSem.evaluations[critId].activities = activeSem.evaluations[critId].activities.filter(a => a.id !== actId);
    }
    this.scheduleAutoSave();
    this.render();
  }

  updateCadreGroup(group) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations['c_5_1_role']) activeSem.evaluations['c_5_1_role'] = {};
    activeSem.evaluations['c_5_1_role'].group = group;
    if (group === 'D') {
      activeSem.evaluations['c_5_1_role'].classMemberMode = 'all';
    } else if (!activeSem.evaluations['c_5_1_role'].performance || activeSem.evaluations['c_5_1_role'].performance === 'none') {
      activeSem.evaluations['c_5_1_role'].performance = 'xuat_sac';
    }
    this.scheduleAutoSave();
    this.render();
  }

  updateCadrePerformance(perf) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations['c_5_1_role']) activeSem.evaluations['c_5_1_role'] = {};
    activeSem.evaluations['c_5_1_role'].performance = perf;
    this.scheduleAutoSave();
    this.render();
  }

  updateClassMemberMode(mode) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.evaluations['c_5_1_role']) activeSem.evaluations['c_5_1_role'] = {};
    activeSem.evaluations['c_5_1_role'].classMemberMode = mode;
    this.scheduleAutoSave();
    this.render();
  }

  adjustDisciplineCount(field, delta) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.disciplinary) activeSem.disciplinary = {};
    const cur = parseInt(activeSem.disciplinary[field], 10) || 0;
    activeSem.disciplinary[field] = Math.max(0, Math.min(10, cur + delta));
    this.scheduleAutoSave();
    this.render();
  }

  toggleDisciplineSuspended(checked) {
    const activeSem = this.getActiveSemester();
    if (!activeSem.disciplinary) activeSem.disciplinary = {};
    activeSem.disciplinary.suspended = checked;
    this.scheduleAutoSave();
    this.render();
  }

  // --- XUẤT / IN PHIẾU ĐRL CHUẨN MẪU BM.2026/CTSV/PĐGKQRL/29.1 ---
  openPrintPreview() {
    this.generateOfficialPrintDocument();
    window.print();
  }

  generateOfficialPrintDocument() {
    const printContainer = document.getElementById('official-print-sheet');
    if (!printContainer) return;

    const activeSem = this.getActiveSemester();
    const result = UmpDrlEngine.calculate(activeSem);
    const student = activeSem.student || {};

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const allActivities = this.collectAllActivitiesForAppendix(activeSem);

    printContainer.innerHTML = `
      <div class="print-page-content font-serif text-black leading-snug">
        <div class="flex justify-between items-start pb-2">
          <div class="text-center w-[48%]">
            <div class="font-normal text-xs uppercase">BỘ Y TẾ</div>
            <div class="font-bold text-xs uppercase tracking-tight">ĐẠI HỌC Y DƯỢC THÀNH PHỐ HỒ CHÍ MINH</div>
            <div class="w-24 h-[1px] bg-black mx-auto mt-1"></div>
          </div>
          <div class="text-center w-[48%]">
            <div class="text-right text-[10px] font-mono mb-1">BM.2026/CTSV/PĐGKQRL/29.1</div>
            <div class="font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="font-bold text-xs">Độc lập - Tự do - Hạnh phúc</div>
            <div class="w-32 h-[1px] bg-black mx-auto mt-1 mb-1"></div>
            <div class="text-[11px] italic">Thành phố Hồ Chí Minh, ngày ${day} tháng ${month} năm ${year}</div>
          </div>
        </div>

        <div class="text-center my-3">
          <h1 class="font-bold text-sm uppercase leading-snug">
            PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN CỦA NGƯỜI HỌC<br>
            ĐƯỢC ĐÀO TẠO TRÌNH ĐỘ ĐẠI HỌC HỆ CHÍNH QUY
          </h1>
          <p class="text-[11px] italic mt-0.5">
            (Ban hành kèm theo Quyết định số 1714 /QĐ-ĐHYD ngày 14 tháng 4 năm 2026 của Hiệu trưởng Đại học Y Dược Thành phố Hồ Chí Minh)
          </p>
        </div>

        <div class="text-[11px] space-y-1 mb-3">
          <div class="flex justify-between">
            <div><strong>Học kỳ:</strong> ${activeSem.semester}</div>
            <div><strong>Năm học:</strong> ${activeSem.academicYear}</div>
            <div><strong>Điểm TB học kỳ (thang 10):</strong> ${student.gpa10 || '.......'}</div>
          </div>
          <div class="flex justify-between">
            <div class="w-1/2"><strong>Họ và tên:</strong> ${this.escapeHtml(student.fullName || '...................................................')}</div>
            <div class="w-1/2"><strong>MSSV:</strong> ${this.escapeHtml(student.studentId || '..........................')}</div>
          </div>
          <div class="flex justify-between">
            <div class="w-1/2"><strong>Lớp:</strong> ${this.escapeHtml(student.className || '...................................................')}</div>
            <div class="w-1/2"><strong>Khóa:</strong> ${this.escapeHtml(student.courseYear || '..........................')}</div>
          </div>
        </div>

        <table class="official-table text-[10px]">
          <thead>
            <tr>
              <th rowspan="2" class="w-[45%]">NỘI DUNG ĐÁNH GIÁ</th>
              <th colspan="4" class="w-[30%]">ĐIỂM</th>
              <th rowspan="2" class="w-[25%]">GHI CHÚ</th>
            </tr>
            <tr>
              <th class="w-[7.5%]">Quy định</th>
              <th class="w-[7.5%]">SV tự đánh giá</th>
              <th class="w-[7.5%]">Lớp</th>
              <th class="w-[7.5%]">Khoa</th>
            </tr>
          </thead>
          <tbody>
            ${this.generateOfficialTableRowsHtml(activeSem, result)}
          </tbody>
        </table>

        <table class="official-table text-[10px] mt-2">
          <tbody>
            <tr class="font-bold">
              <td class="w-[45%] text-left">Điểm trừ vi phạm quy chế CTSV khác (khiển trách/cảnh cáo)</td>
              <td class="w-[7.5%] text-center">-</td>
              <td class="w-[7.5%] text-center">${result.discPenaltyScore > 0 ? '-' + result.discPenaltyScore : '0'}</td>
              <td class="w-[7.5%] text-center">-</td>
              <td class="w-[7.5%] text-center">-</td>
              <td class="w-[25%] text-left italic">Trừ thẳng vào tổng số điểm toàn phiếu</td>
            </tr>
            <tr class="font-bold text-xs bg-slate-100">
              <td class="text-center uppercase font-bold">TỔNG ĐIỂM</td>
              <td class="text-center font-bold">100</td>
              <td class="text-center font-bold text-blue-900">${result.grandTotal.toFixed(1)}</td>
              <td class="text-center font-bold">${result.classTotal !== null ? result.classTotal.toFixed(1) : ''}</td>
              <td class="text-center font-bold">${result.facultyTotal !== null ? result.facultyTotal.toFixed(1) : ''}</td>
              <td class="text-center font-bold uppercase text-blue-900">Xếp loại: ${result.ranking.name}</td>
            </tr>
          </tbody>
        </table>

        <div class="mt-8 page-avoid-break">
          <div class="grid grid-cols-2 text-center text-xs">
            <div>
              <div class="font-bold uppercase">Giáo viên chủ nhiệm/ nhân viên phụ trách khối</div>
              <div class="italic text-[10px] mt-0.5">(Ký và ghi rõ họ tên)</div>
              <div class="h-20"></div>
            </div>
            <div>
              <div class="font-bold uppercase">SINH VIÊN TỰ XẾP LOẠI</div>
              <div class="italic text-[10px] mt-0.5">(Ký và ghi rõ họ tên)</div>
              <div class="h-20 flex items-end justify-center font-bold">${this.escapeHtml(student.fullName || '')}</div>
            </div>
          </div>
          <div class="mt-4 text-center text-xs">
            <div class="font-bold uppercase">HỘI ĐỒNG XÉT CẤP KHOA</div>
            <div class="font-bold uppercase">Chủ tịch</div>
            <div class="italic text-[10px] mt-0.5">(Ký đóng dấu và ghi rõ họ tên)</div>
            <div class="h-24"></div>
          </div>
        </div>

        ${allActivities.length > 0 ? `
          <div class="page-break-before mt-8">
            <div class="text-center pb-2 mb-3">
              <h2 class="font-bold text-xs uppercase tracking-wider">PHỤ LỤC DANH SÁCH CHI TIẾT HOẠT ĐỘNG & MINH CHỨNG</h2>
              <p class="text-[10px] italic">(${student.fullName || 'SV'} - MSSV: ${student.studentId || ''} - ${activeSem.semester} ${activeSem.academicYear})</p>
            </div>
            <table class="official-table text-[10px]">
              <thead>
                <tr>
                  <th class="w-[6%]">STT</th>
                  <th class="w-[18%] text-left">Mục tiêu chí</th>
                  <th class="w-[42%] text-left">Tên hoạt động / Sự kiện</th>
                  <th class="w-[12%]">Ngày tham gia</th>
                  <th class="w-[22%] text-left">Minh chứng</th>
                </tr>
              </thead>
              <tbody>
                ${allActivities.map((act, index) => `
                  <tr>
                    <td class="text-center font-bold">${index + 1}</td>
                    <td class="text-left font-semibold">${act.critCode} - ${act.critShort}</td>
                    <td class="text-left">${this.escapeHtml(act.title)}</td>
                    <td class="text-center">${act.date || '-'}</td>
                    <td class="text-left text-[9.5px] italic">${this.escapeHtml(act.proof || 'Đã có xác nhận')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;
  }

  generateOfficialTableRowsHtml(activeSem, result) {
    const evals = activeSem.evaluations || {};
    let html = '';

    UMP_CRITERIA_DATA.forEach(part => {
      const pRes = result.parts[`part${part.partId}`];
      html += `
        <tr class="bg-slate-200/80 font-bold text-slate-900">
          <td class="text-left font-bold uppercase">${part.title}</td>
          <td colspan="4" class="text-center font-bold">Thang điểm tối đa: ${part.maxScore} điểm</td>
          <td></td>
        </tr>
      `;
      part.sections.forEach(sec => {
        html += `
          <tr class="bg-slate-100 font-semibold text-slate-800">
            <td class="text-left pl-2">${sec.title}</td>
            <td colspan="4" class="text-center font-semibold">${sec.maxScore ? `Tối đa ${sec.maxScore} điểm` : ''}</td>
            <td class="text-left text-[9px] italic">${sec.subNote || ''}</td>
          </tr>
        `;
        sec.criteria.forEach(crit => {
          const evalItem = evals[crit.id] || {};
          const selfScore = this.getCriterionScore(crit, evalItem);
          const classScore = evalItem.classScore !== undefined ? evalItem.classScore : '';
          const facultyScore = evalItem.facultyScore !== undefined ? evalItem.facultyScore : '';
          const noteText = crit.note || crit.penaltyNote || crit.proofRequirement || '';
          html += `
            <tr>
              <td class="text-left pl-4 leading-snug">${crit.title}</td>
              <td class="text-center">${crit.ruleScore} ${crit.unit || ''}</td>
              <td class="text-center font-bold text-blue-900">${selfScore > 0 ? selfScore : '0'}</td>
              <td class="text-center">${classScore}</td>
              <td class="text-center">${facultyScore}</td>
              <td class="text-left text-[9px] italic leading-tight">${noteText}</td>
            </tr>
          `;
        });
      });
      html += `
        <tr class="font-bold bg-slate-50 border-t border-b border-black">
          <td class="text-left uppercase font-bold pl-2">Tổng điểm phần ${part.partId}</td>
          <td class="text-center font-bold">${part.maxScore}</td>
          <td class="text-center font-bold text-blue-900">${pRes.totalScore.toFixed(1)}</td>
          <td class="text-center">-</td>
          <td class="text-center">-</td>
          <td class="text-left italic text-[9px]">Không vượt quá ${part.maxScore}đ</td>
        </tr>
      `;
    });

    return html;
  }

  // --- ĐIỀU CHỈNH ĐIỂM MỤC TIÊU ---
  toggleTargetScoreEditor() {
    this.isEditingTargetScore = !this.isEditingTargetScore;
    const result = UmpDrlEngine.calculate(this.getActiveSemester());
    this.renderScoreSummaryCard(result);
  }

  setTargetScore(val) {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.max(50, Math.min(100, parsed));
    const activeSem = this.getActiveSemester();
    activeSem.targetScore = clamped;
    this.scheduleAutoSave();
    const result = UmpDrlEngine.calculate(activeSem);
    this.renderScoreSummaryCard(result);
  }

  adjustTargetScore(delta) {
    const activeSem = this.getActiveSemester();
    const cur = this.getTargetScore(activeSem);
    this.setTargetScore(cur + delta);
  }

  // --- CHUYỂN ĐỔI XEM 5 GẦN NHẤT / TẤT CẢ HOẠT ĐỘNG ---
  toggleShowAllRecentActivities() {
    this.showAllRecentActivities = !this.showAllRecentActivities;
    this.renderRecentActivitiesCard(this.getActiveSemester());
  }

  // --- MODAL THÊM NHANH HOẠT ĐỘNG TỪ SIDEBAR ---
  openQuickAddModal() {
    const select = document.getElementById('quick-act-criterion');
    if (select) {
      let optionsHtml = '';
      UMP_CRITERIA_DATA.forEach(part => {
        const groupOpts = [];
        part.sections.forEach(sec => {
          sec.criteria.forEach(crit => {
            if (crit.type === 'activity_list') {
              const shortTitle = crit.title.length > 65 ? crit.title.substring(0, 65) + '...' : crit.title;
              groupOpts.push(`<option value="${crit.id}">${crit.code} - ${this.escapeHtml(shortTitle)} (+${crit.pointsPerUnit}đ/HĐ)</option>`);
            }
          });
        });
        if (part.partId === 5) {
          groupOpts.push(`<option value="c_5_1_role_class_acts">5.1.Lớp - Tham gia hoạt động của lớp (+1đ/HĐ, tối đa 6đ)</option>`);
        }
        if (groupOpts.length > 0) {
          optionsHtml += `<optgroup label="Phần ${part.partId}: ${this.escapeHtml(part.shortTitle)}">${groupOpts.join('')}</optgroup>`;
        }
      });
      select.innerHTML = optionsHtml;
    }

    document.getElementById('quick-act-title').value = '';
    document.getElementById('quick-act-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('quick-act-proof').value = '';
    document.getElementById('quick-add-activity-modal')?.classList.remove('hidden');
    setTimeout(() => document.getElementById('quick-act-title')?.focus(), 50);
  }

  closeQuickAddModal() {
    document.getElementById('quick-add-activity-modal')?.classList.add('hidden');
  }

  submitQuickAddActivity() {
    const critId = document.getElementById('quick-act-criterion').value;
    const title = document.getElementById('quick-act-title').value.trim();
    const date = document.getElementById('quick-act-date').value;
    const proof = document.getElementById('quick-act-proof').value.trim();

    if (!title) {
      alert('Vui lòng nhập Tên hoạt động / Sự kiện!');
      return;
    }

    const activeSem = this.getActiveSemester();
    const newAct = {
      id: 'act_' + Date.now(),
      createdAt: Date.now(),
      title,
      date: date || new Date().toISOString().split('T')[0],
      proof
    };

    if (critId === 'c_5_1_role_class_acts') {
      if (!activeSem.evaluations['c_5_1_role']) activeSem.evaluations['c_5_1_role'] = {};
      activeSem.evaluations['c_5_1_role'].group = 'D';
      activeSem.evaluations['c_5_1_role'].classMemberMode = 'count';
      if (!activeSem.evaluations['c_5_1_role'].classActivities) activeSem.evaluations['c_5_1_role'].classActivities = [];
      activeSem.evaluations['c_5_1_role'].classActivities.push(newAct);
    } else {
      if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
      if (!activeSem.evaluations[critId].activities) activeSem.evaluations[critId].activities = [];
      activeSem.evaluations[critId].activities.push(newAct);
    }

    this.scheduleAutoSave();
    this.closeQuickAddModal();
    this.render();
    this.showToast(`Đã ghi nhận: "${title}"`);
  }

  // --- XÓA HOẠT ĐỘNG TRỰC TIẾP TỪ SIDEBAR KÈM HOÀN TÁC 3 GIÂY ---
  deleteActivityFromSidebar(critId, actId) {
    const activeSem = this.getActiveSemester();
    let arr = null;
    if (critId === 'c_5_1_role_class_acts') {
      arr = activeSem.evaluations['c_5_1_role']?.classActivities;
    } else {
      arr = activeSem.evaluations[critId]?.activities;
    }
    if (!arr) return;

    const index = arr.findIndex(a => a.id === actId);
    if (index === -1) return;

    const [removed] = arr.splice(index, 1);
    this.lastDeletedActivity = { critId, activity: removed, index };

    this.scheduleAutoSave();
    this.render();
    this.showUndoToast(`Đã xóa "${removed.title || 'Hoạt động'}"`);
  }

  undoDeleteActivity() {
    if (!this.lastDeletedActivity) return;
    const { critId, activity, index } = this.lastDeletedActivity;
    const activeSem = this.getActiveSemester();

    let arr = null;
    if (critId === 'c_5_1_role_class_acts') {
      if (!activeSem.evaluations['c_5_1_role']) activeSem.evaluations['c_5_1_role'] = {};
      if (!activeSem.evaluations['c_5_1_role'].classActivities) activeSem.evaluations['c_5_1_role'].classActivities = [];
      arr = activeSem.evaluations['c_5_1_role'].classActivities;
    } else {
      if (!activeSem.evaluations[critId]) activeSem.evaluations[critId] = {};
      if (!activeSem.evaluations[critId].activities) activeSem.evaluations[critId].activities = [];
      arr = activeSem.evaluations[critId].activities;
    }

    arr.splice(Math.min(index, arr.length), 0, activity);
    this.lastDeletedActivity = null;
    if (this.undoTimeout) clearTimeout(this.undoTimeout);

    const existingUndo = document.getElementById('undo-toast-item');
    if (existingUndo) existingUndo.remove();

    this.scheduleAutoSave();
    this.render();
    this.showToast('Đã hoàn tác khôi phục hoạt động!');
  }

  showUndoToast(msg) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-4 right-4 z-50 flex flex-col space-y-2 no-print toast-container';
      document.body.appendChild(container);
    }

    const existing = document.getElementById('undo-toast-item');
    if (existing) existing.remove();
    if (this.undoTimeout) clearTimeout(this.undoTimeout);

    const toast = document.createElement('div');
    toast.id = 'undo-toast-item';
    toast.className = 'bg-slate-900 text-white text-xs px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-200';
    toast.innerHTML = `
      <span class="truncate max-w-[220px]">${this.escapeHtml(msg)}</span>
      <button type="button" onclick="window.app.undoDeleteActivity()" class="text-amber-400 hover:text-amber-300 font-bold uppercase text-[11px] shrink-0 underline">
        Hoàn tác
      </button>
    `;
    container.appendChild(toast);

    this.undoTimeout = setTimeout(() => {
      this.lastDeletedActivity = null;
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  collectAllActivitiesForAppendix(activeSem) {
    const list = [];
    const evals = activeSem.evaluations || {};

    UMP_CRITERIA_DATA.forEach(part => {
      part.sections.forEach(sec => {
        sec.criteria.forEach(crit => {
          if (crit.type === 'activity_list') {
            (evals[crit.id]?.activities || []).forEach(a => {
              list.push({
                id: a.id,
                createdAt: a.createdAt || 0,
                critId: crit.id,
                critCode: crit.code,
                critShort: crit.title.substring(0, 42) + '...',
                title: a.title,
                date: a.date,
                proof: a.proof
              });
            });
          }
        });
      });
    });

    (evals['c_5_1_role']?.classActivities || []).forEach(a => {
      list.push({
        id: a.id,
        createdAt: a.createdAt || 0,
        critId: 'c_5_1_role_class_acts',
        critCode: '5.1.Lớp',
        critShort: 'Hoạt động của lớp đã tham gia',
        title: a.title,
        date: a.date,
        proof: a.proof
      });
    });

    return list;
  }

  showToast(msg) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-4 right-4 z-50 flex flex-col space-y-2 no-print toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'bg-slate-900 text-white text-xs px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 translate-y-2 opacity-0';
    toast.innerHTML = `<span class="text-emerald-400 font-bold">✓</span><span>${this.escapeHtml(msg)}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 250);
    }, 2600);
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
  window.app = new UmpDrlApp();
});
