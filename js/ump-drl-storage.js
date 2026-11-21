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
}
