/**
 * SỔ TAY THEO DÕI & TÍNH ĐIỂM RÈN LUYỆN UMP (QĐ 1714)
 * Quản lý lưu trữ LocalStorage, đa học kỳ, sao lưu & khôi phục JSON
 */

const UMP_STORAGE_KEY = 'UMP_DRL_DATA_V1';

class UmpDrlStorage {
  /**
   * Khởi tạo hoặc nạp dữ liệu từ LocalStorage (kèm chuẩn hóa an toàn không làm mất dữ liệu cũ)
   */
  static loadData() {
    try {
      const raw = localStorage.getItem(UMP_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.semesters && typeof parsed.semesters === 'object' && Object.keys(parsed.semesters).length > 0) {
          return this.normalizeData(parsed);
        }
      }
    } catch (e) {
      console.error('Lỗi khi nạp dữ liệu từ LocalStorage:', e);
    }
    return this.createInitialData();
  }

  /**
   * Chuẩn hóa cấu trúc dữ liệu khi nâng cấp phiên bản mới để không bao giờ mất dữ liệu cũ
   */
  static normalizeData(parsed) {
    const semKeys = Object.keys(parsed.semesters);
    if (!parsed.activeSemesterId || !parsed.semesters[parsed.activeSemesterId]) {
      parsed.activeSemesterId = semKeys[0];
    }

    semKeys.forEach(key => {
      const sem = parsed.semesters[key];
      if (!sem || typeof sem !== 'object') return;
      if (!sem.student) sem.student = {};
      if (!sem.evaluations) sem.evaluations = {};
      if (!sem.disciplinary) sem.disciplinary = { reprimand: 0, warning: 0, suspended: false };
      if (sem.targetScore === undefined || sem.targetScore === null) sem.targetScore = 80;
    });

    parsed.version = '1.1';
    return parsed;
  }

  /**
   * Tạo bộ dữ liệu mặc định ban đầu
   */
  static createInitialData() {
    const defaultSemId = '2026-2027_HK1';
    const initialSem = this.createDefaultSemester('2026–2027', 'HK1', {
      fullName: 'Nguyễn Văn Minh',
      studentId: '2651010099',
      className: 'YK2026A',
      courseYear: 'Khóa 2026 - 2032',
      gpa10: '7.8'
    });

    // Cài đặt một số hoạt động mẫu thực tế tại ĐHYD TPHCM
    initialSem.evaluations['c_1_2_a'] = {
      activities: [
        {
          id: 'act_101',
          title: 'Tham gia Hội thảo Phương pháp NCKH trong Y sinh học',
          date: '2026-09-18',
          proof: 'Giấy chứng nhận số 45/GCN-NCKH Khoa Y'
        },
        {
          id: 'act_102',
          title: 'Hỗ trợ giảng viên thu thập số liệu lâm sàng Bệnh viện Chợ Rẫy',
          date: '2026-10-12',
          proof: 'Xác nhận của PGS.TS Trưởng bộ môn'
        }
      ]
    };

    initialSem.evaluations['c_2_2_survey_course'] = {
      activities: [
        {
          id: 'act_201',
          title: 'Hoàn thành Khảo sát ý kiến người học về môn Giải phẫu I đợt 1',
          date: '2026-10-25',
          proof: 'Mã xác nhận hệ thống ĐBCL UMP: QA-2026-9921'
        }
      ]
    };

    initialSem.evaluations['c_3_1_a'] = {
      activities: [
        {
          id: 'act_301',
          title: 'Tham gia Giải chạy sinh viên Blouse Trắng Khỏe cấp Trường',
          date: '2026-10-04',
          proof: 'Số BIB: 1042 - Huy chương hoàn thành cự ly 5km'
        }
      ]
    };

    initialSem.evaluations['c_4_1_volunteer_lt5d_faculty'] = {
      activities: [
        {
          id: 'act_401',
          title: 'Chiến dịch Ngày Chủ Nhật Xanh dọn dẹp khuôn viên bệnh viện',
          date: '2026-10-18',
          proof: 'Giấy chứng nhận Đoàn Khoa Y cấp'
        }
      ]
    };

    initialSem.evaluations['c_4_2_blood_donation'] = {
      activities: [
        {
          id: 'act_402',
          title: 'Hiến máu tình nguyện Đợt 1 - Giọt Hồng Blouse Trắng',
          date: '2026-10-28',
          proof: 'Giấy chứng nhận hiến máu tình nguyện số 26/HM-BVCR (350ml)'
        }
      ]
    };

    return {
      version: '1.0',
      activeSemesterId: defaultSemId,
      semesters: {
        [defaultSemId]: initialSem
      }
    };
  }

  /**
   * Tạo mới một học kỳ với dữ liệu khởi tạo chuẩn
   */
  static createDefaultSemester(academicYear = '2026–2027', semester = 'HK1', studentInfo = {}) {
    const id = `${academicYear.replace(/[^0-9]/g, '-')}_${semester}`;
    return {
      id,
      academicYear,
      semester,
      updatedAt: new Date().toISOString(),
      student: {
        fullName: studentInfo.fullName || '',
        studentId: studentInfo.studentId || '',
        className: studentInfo.className || '',
        courseYear: studentInfo.courseYear || 'Khóa 2026 - 2032',
        gpa10: studentInfo.gpa10 || ''
      },
      evaluations: {
        // Mục 1.1: Mặc định Đạt
        'c_1_1': { status: 'dat' },
        // Mục 1.3: Mặc định Đạt
        'c_1_3': { status: 'dat' },
        // Mục 1.4: Mặc định chọn mức Khá (7đ)
        'c_1_4': { selectedScore: 7 },
        // Mục 2.1: Mặc định cả 7 tiêu chí đạt
        'c_2_1_1': { passed: true },
        'c_2_1_2': { passed: true },
        'c_2_1_3': { passed: true },
        'c_2_1_4': { passed: true },
        'c_2_1_5': { passed: true },
        'c_2_1_6': { passed: true },
        'c_2_1_7': { passed: true },
        // Mục 4.1: Mặc định 3 tiêu chí ý thức đạt
        'c_4_1_1': { passed: true },
        'c_4_1_2': { passed: true },
        'c_4_1_3': { passed: true },
        // Mục 5.1: Mặc định Thành viên của lớp tham gia đầy đủ (6đ)
        'c_5_1_role': {
          group: 'D',
          classMemberMode: 'all',
          performance: 'none'
        }
      },
      disciplinary: {
        reprimand: 0,
        warning: 0,
        suspended: false
      }
    };
  }

  /**
   * Lưu toàn bộ dữ liệu vào LocalStorage
   */
  static saveData(data) {
    try {
      localStorage.setItem(UMP_STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Không thể lưu vào LocalStorage:', e);
      return false;
    }
  }

  /**
   * Lấy học kỳ đang kích hoạt
   */
  static getActiveSemester(data) {
    if (!data.semesters[data.activeSemesterId]) {
      const keys = Object.keys(data.semesters);
      if (keys.length > 0) {
        data.activeSemesterId = keys[0];
      } else {
        const fresh = this.createInitialData();
        return fresh.semesters[fresh.activeSemesterId];
      }
    }
    return data.semesters[data.activeSemesterId];
  }

  /**
   * Xuất toàn bộ dữ liệu ra tệp JSON tải về máy
   */
  static exportJson(data) {
    const activeSem = this.getActiveSemester(data);
    const mssv = activeSem.student.studentId || 'SV';
    const hk = activeSem.semester;
    const namHoc = activeSem.academicYear.replace(/[^0-9]/g, '_');
    const filename = `So_Tay_DRL_UMP_${mssv}_${hk}_${namHoc}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Khôi phục dữ liệu từ nội dung chuỗi JSON
   */
  static importJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.semesters || typeof parsed.semesters !== 'object' || Object.keys(parsed.semesters).length === 0) {
        throw new Error('Cấu trúc file JSON không hợp lệ với chuẩn Sổ tay ĐRL UMP.');
      }
      const normalized = this.normalizeData(parsed);
      this.saveData(normalized);
      return { success: true, data: normalized };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Chuẩn hóa ô CSV theo chuẩn RFC-4180
   */
  static escapeCsvCell(val) {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (/[",\r\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  static toCsvLine(cells) {
    return cells.map(c => this.escapeCsvCell(c)).join(',');
  }

  /**
   * Xuất dữ liệu học kỳ hiện tại ra file CSV chuẩn UTF-8 BOM (Excel / Chuyển máy)
   */
  static exportCsv(activeSem, result) {
    const s = activeSem.student || {};
    const evals = activeSem.evaluations || {};
    const disc = activeSem.disciplinary || {};
    const targetScore = activeSem.targetScore !== undefined ? activeSem.targetScore : 80;

    // Lấy thông tin GPA hệ 4 từ mục 1.4
    const c14Crit = UMP_CRITERIA_DATA[0]?.sections?.find(sec => sec.sectionId === '1.4')?.criteria[0];
    const selected14 = evals['c_1_4']?.selectedScore !== undefined ? evals['c_1_4'].selectedScore : 7;
    const opt14 = c14Crit?.options?.find(o => o.score == selected14);
    const gpa4Text = opt14 && opt14.range ? `${opt14.range} (${opt14.score}đ)` : `${selected14}đ`;

    const lines = [];

    // PHẦN 1: THÔNG TIN SINH VIÊN
    lines.push(this.toCsvLine(['[THONG_TIN_SINH_VIEN]']));
    lines.push(this.toCsvLine(['Truong_Thong_Tin', 'Gia_Tri']));
    lines.push(this.toCsvLine(['Họ và tên', s.fullName || '']));
    lines.push(this.toCsvLine(['MSSV', s.studentId || '']));
    lines.push(this.toCsvLine(['Lớp', s.className || '']));
    lines.push(this.toCsvLine(['Khóa', s.courseYear || '']));
    lines.push(this.toCsvLine(['Học kỳ', activeSem.semester || 'HK1']));
    lines.push(this.toCsvLine(['Năm học', activeSem.academicYear || '2026–2027']));
    lines.push(this.toCsvLine(['GPA hệ 4', gpa4Text]));
    lines.push(this.toCsvLine(['ĐTB học kỳ hệ 10', s.gpa10 || '']));
    lines.push(this.toCsvLine(['Điểm ĐRL mục tiêu', targetScore]));
    lines.push(this.toCsvLine(['Tổng điểm ĐRL đạt được', result.grandTotal.toFixed(1)]));
    lines.push(this.toCsvLine(['Xếp loại', result.ranking.name]));
    lines.push('');

    // PHẦN 2: TRẠNG THÁI TIÊU CHÍ
    lines.push(this.toCsvLine(['[TRANG_THAI_TIEU_CHI]']));
    lines.push(this.toCsvLine(['Ma_Muc', 'Noi_Dung_Tieu_Chi', 'Gia_Tri_Da_Chon', 'Diem_SV', 'Diem_Lop', 'Diem_Khoa']));

    UMP_CRITERIA_DATA.forEach(part => {
      part.sections.forEach(sec => {
        sec.criteria.forEach(crit => {
          const ev = evals[crit.id] || {};
          let selectedVal = '';
          let selfScore = 0;

          if (crit.type === 'discipline_status') {
            selectedVal = ev.status || 'dat';
            selfScore = selectedVal === 'dat' ? crit.ruleScore : 0;
          } else if (crit.type === 'academic_grade') {
            selectedVal = ev.selectedScore !== undefined ? ev.selectedScore : 7;
            selfScore = parseInt(selectedVal, 10) || 0;
          } else if (crit.type === 'pass_fail_toggle') {
            const passed = ev.passed !== false;
            selectedVal = passed ? 'dat' : 'vipham';
            selfScore = passed ? crit.passScore : 0;
          } else if (crit.type === 'checkbox_single') {
            selectedVal = !!ev.checked ? 'true' : 'false';
            selfScore = ev.checked ? crit.pointsIfChecked : 0;
          } else if (crit.type === 'penalty_checkbox') {
            selectedVal = !!ev.checked ? 'true' : 'false';
            selfScore = ev.checked ? -crit.penaltyPoints : 0;
          } else if (crit.type === 'step_counter') {
            const steps = parseInt(ev.steps, 10) || 0;
            selectedVal = steps;
            selfScore = steps * crit.pointsPerUnit;
          } else if (crit.type === 'penalty_counter') {
            const count = parseInt(ev.count, 10) || 0;
            selectedVal = count;
            selfScore = -(count * crit.penaltyPerUnit);
          } else if (crit.type === 'deduction_input') {
            const sc = parseFloat(ev.score) || 0;
            selectedVal = sc;
            selfScore = -sc;
          } else if (crit.type === 'cadre_role_select') {
            const grp = ev.group || 'D';
            const perf = ev.performance || 'none';
            const mode = ev.classMemberMode || 'all';
            selectedVal = `${grp}|${perf}|${mode}`;
            selfScore = result.parts.part5.evalScore;
          } else if (crit.type === 'auto_bonus_1_2') {
            selectedVal = 'auto';
            selfScore = result.parts.part1.auto_bonus_1_2;
          } else if (crit.type === 'activity_list') {
            selectedVal = 'activity_list';
            const acts = ev.activities || [];
            selfScore = acts.length * crit.pointsPerUnit;
            if (crit.maxCap) selfScore = Math.min(crit.maxCap, selfScore);
          }

          const classScore = ev.classScore !== undefined && ev.classScore !== '' ? ev.classScore : '';
          const facultyScore = ev.facultyScore !== undefined && ev.facultyScore !== '' ? ev.facultyScore : '';

          lines.push(this.toCsvLine([
            crit.code,
            crit.title,
            selectedVal,
            selfScore,
            classScore,
            facultyScore
          ]));
        });
      });
    });

    // Kỷ luật CTSV toàn phiếu
    const rep = parseInt(disc.reprimand, 10) || 0;
    const warn = parseInt(disc.warning, 10) || 0;
    const susp = !!disc.suspended;
    lines.push(this.toCsvLine(['KL_KHIEN_TRACH', 'Bị khiển trách (-5đ/lần)', rep, -(rep * 5), '', '']));
    lines.push(this.toCsvLine(['KL_CANH_CAO', 'Bị cảnh cáo (-10đ/lần)', warn, -(warn * 10), '', '']));
    lines.push(this.toCsvLine(['KL_DINH_CHI', 'Bị đình chỉ học trở lên', susp ? 'true' : 'false', 0, '', '']));
    lines.push('');

    // PHẦN 3: DANH SÁCH HOẠT ĐỘNG
    lines.push(this.toCsvLine(['[DANH_SACH_HOAT_DONG]']));
    lines.push(this.toCsvLine(['Ma_Muc', 'Ten_Tieu_Chi', 'Ten_Hoat_Dong', 'Ngay_Tham_Gia', 'Minh_Chung_Ghi_Chu', 'Diem_Quy_Doi']));

    UMP_CRITERIA_DATA.forEach(part => {
      part.sections.forEach(sec => {
        sec.criteria.forEach(crit => {
          if (crit.type === 'activity_list') {
            (evals[crit.id]?.activities || []).forEach(act => {
              lines.push(this.toCsvLine([
                crit.code,
                crit.title,
                act.title || '',
                act.date || '',
                act.proof || '',
                crit.pointsPerUnit
              ]));
            });
          }
        });
      });
    });

    (evals['c_5_1_role']?.classActivities || []).forEach(act => {
      lines.push(this.toCsvLine([
        '5.1.Lớp',
        'Tham gia hoạt động của lớp (Nhóm D)',
        act.title || '',
        act.date || '',
        act.proof || '',
        1
      ]));
    });

    // UTF-8 BOM bắt buộc cho Excel/Google Sheets
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const mssv = (s.studentId || 'SV').replace(/[^a-zA-Z0-9_-]/g, '');
    const hk = (activeSem.semester || 'HK1').replace(/\s+/g, '');
    const namHoc = (activeSem.academicYear || '2026-2027').replace(/[^0-9-]/g, '-').replace(/--+/g, '-');
    const filename = `DRL_UMP_${mssv}_${hk}_${namHoc}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Parser CSV chuẩn RFC-4180 (xử lý dấu phẩy, ngoặc kép, xuống dòng và loại bỏ BOM)
   */
  static parseCsvRows(rawText) {
    const text = rawText.replace(/^\uFEFF/, '');
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          currentCell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          currentCell += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          currentRow.push(currentCell);
          currentCell = '';
        } else if (ch === '\r' && next === '\n') {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
          i++;
        } else if (ch === '\n' || ch === '\r') {
          currentRow.push(currentCell);
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += ch;
        }
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    return rows.filter(r => r.some(cell => cell.trim() !== ''));
  }

  /**
   * Nhập và khôi phục dữ liệu từ file CSV
   */
  static importCsv(rawText, currentData) {
    try {
      const rows = this.parseCsvRows(rawText);
      if (rows.length === 0) {
        throw new Error('File CSV trống hoặc không thể đọc được.');
      }

      let section = null;
      const studentMap = {};
      const criteriaRows = [];
      const activityRows = [];

      rows.forEach(row => {
        const first = (row[0] || '').trim();
        if (first === '[THONG_TIN_SINH_VIEN]') {
          section = 'STUDENT';
          return;
        }
        if (first === '[TRANG_THAI_TIEU_CHI]') {
          section = 'CRITERIA';
          return;
        }
        if (first === '[DANH_SACH_HOAT_DONG]') {
          section = 'ACTIVITIES';
          return;
        }

        if (section === 'STUDENT') {
          if (first === 'Truong_Thong_Tin') return;
          studentMap[first] = (row[1] || '').trim();
        } else if (section === 'CRITERIA') {
          if (first === 'Ma_Muc') return;
          criteriaRows.push(row);
        } else if (section === 'ACTIVITIES') {
          if (first === 'Ma_Muc') return;
          activityRows.push(row);
        }
      });

      if (Object.keys(studentMap).length === 0 || (criteriaRows.length === 0 && activityRows.length === 0)) {
        throw new Error('File CSV không đúng định dạng Sổ tay ĐRL UMP (thiếu phần [THONG_TIN_SINH_VIEN] hoặc dữ liệu tiêu chí).');
      }

      const academicYear = studentMap['Năm học'] || '2026–2027';
      const semester = studentMap['Học kỳ'] || 'HK1';
      const newSem = this.createDefaultSemester(academicYear, semester, {
        fullName: studentMap['Họ và tên'] || '',
        studentId: studentMap['MSSV'] || '',
        className: studentMap['Lớp'] || '',
        courseYear: studentMap['Khóa'] || 'Khóa 2026 - 2032',
        gpa10: studentMap['ĐTB học kỳ hệ 10'] || ''
      });

      const targetParsed = parseInt(studentMap['Điểm ĐRL mục tiêu'], 10);
      newSem.targetScore = !isNaN(targetParsed) ? Math.max(50, Math.min(100, targetParsed)) : 80;

      // Map lookup tiêu chí theo code & id
      const critByCode = {};
      UMP_CRITERIA_DATA.forEach(part => {
        part.sections.forEach(sec => {
          sec.criteria.forEach(crit => {
            critByCode[crit.code] = crit;
          });
        });
      });

      // Khôi phục Phần 2: Trạng thái tiêu chí & kỷ luật
      criteriaRows.forEach(row => {
        const code = (row[0] || '').trim();
        const val = (row[2] || '').trim();
        const classScore = (row[4] || '').trim();
        const facultyScore = (row[5] || '').trim();

        if (code === 'KL_KHIEN_TRACH') {
          newSem.disciplinary.reprimand = parseInt(val, 10) || 0;
          return;
        }
        if (code === 'KL_CANH_CAO') {
          newSem.disciplinary.warning = parseInt(val, 10) || 0;
          return;
        }
        if (code === 'KL_DINH_CHI') {
          newSem.disciplinary.suspended = val === 'true';
          return;
        }

        const crit = critByCode[code];
        if (!crit) return;

        if (!newSem.evaluations[crit.id]) newSem.evaluations[crit.id] = {};
        const ev = newSem.evaluations[crit.id];

        if (crit.type === 'discipline_status') {
          ev.status = ['dat', 'vipham_1', 'vipham_2'].includes(val) ? val : 'dat';
        } else if (crit.type === 'academic_grade') {
          ev.selectedScore = parseInt(val, 10) || 0;
        } else if (crit.type === 'pass_fail_toggle') {
          ev.passed = val !== 'vipham' && val !== 'false';
        } else if (crit.type === 'checkbox_single' || crit.type === 'penalty_checkbox') {
          ev.checked = val === 'true';
        } else if (crit.type === 'step_counter') {
          ev.steps = parseInt(val, 10) || 0;
        } else if (crit.type === 'penalty_counter') {
          ev.count = parseInt(val, 10) || 0;
        } else if (crit.type === 'deduction_input') {
          ev.score = parseFloat(val) || 0;
        } else if (crit.type === 'cadre_role_select') {
          const parts = val.split('|');
          ev.group = parts[0] || 'D';
          ev.performance = parts[1] || 'none';
          ev.classMemberMode = parts[2] || 'all';
        }

        if (classScore !== '') ev.classScore = parseFloat(classScore);
        if (facultyScore !== '') ev.facultyScore = parseFloat(facultyScore);
      });

      // Khôi phục Phần 3: Danh sách hoạt động
      const baseTime = Date.now();
      activityRows.forEach((row, idx) => {
        const code = (row[0] || '').trim();
        const title = (row[2] || '').trim();
        const date = (row[3] || '').trim();
        const proof = (row[4] || '').trim();

        const actObj = {
          id: `act_${baseTime}_${idx}`,
          createdAt: baseTime - idx,
          title,
          date,
          proof
        };

        if (code === '5.1.Lớp') {
          if (!newSem.evaluations['c_5_1_role']) newSem.evaluations['c_5_1_role'] = { group: 'D', classMemberMode: 'count' };
          if (!newSem.evaluations['c_5_1_role'].classActivities) newSem.evaluations['c_5_1_role'].classActivities = [];
          newSem.evaluations['c_5_1_role'].classActivities.push(actObj);
          return;
        }

        const crit = critByCode[code];
        if (crit && crit.type === 'activity_list') {
          if (!newSem.evaluations[crit.id]) newSem.evaluations[crit.id] = {};
          if (!newSem.evaluations[crit.id].activities) newSem.evaluations[crit.id].activities = [];
          newSem.evaluations[crit.id].activities.push(actObj);
        }
      });

      const updatedData = currentData && currentData.semesters ? { ...currentData } : { version: '1.1', semesters: {} };
      updatedData.semesters[newSem.id] = newSem;
      updatedData.activeSemesterId = newSem.id;

      const normalized = this.normalizeData(updatedData);
      this.saveData(normalized);
      return { success: true, data: normalized };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
