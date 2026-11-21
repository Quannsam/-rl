/**
 * SỔ TAY THEO DÕI & TÍNH ĐIỂM RÈN LUYỆN UMP (QĐ 1714)
 * Biểu mẫu: BM.2026/CTSV/PĐGKQRL/29.1
 * Ban hành kèm theo Quyết định số 1714/QĐ-ĐHYD ngày 14 tháng 4 năm 2026 của Hiệu trưởng Đại học Y Dược TP.HCM
 * 
 * Dữ liệu cấu hình tiêu chí chính thức 100% chuẩn quy chế
 */

const UMP_CRITERIA_DATA = [
  {
    partId: 1,
    partCode: 'PART_1',
    title: '1. ĐÁNH GIÁ VỀ Ý THỨC THAM GIA HỌC TẬP',
    maxScore: 20,
    shortTitle: 'Ý thức tham gia học tập',
    description: 'Bao gồm ý thức giờ giấc, CLB/hoạt động học thuật, NCKH, ý thức thi cử, kết quả học lực và các điểm thưởng/đặc thù ngành.',
    sections: [
      {
        sectionId: '1.1',
        title: '1.1. Ý thức và thái độ trong học tập',
        maxScore: 2,
        criteria: [
          {
            id: 'c_1_1',
            code: '1.1',
            title: 'Nghiêm túc trong quá trình học và chấp hành quy định về giờ giấc, không vắng quá số buổi quy định của môn học/học phần',
            ruleScore: 2,
            type: 'discipline_status', // 'dat' (2đ), 'vipham_1' (0đ), 'vipham_2' (0đ + trừ 2đ)
            note: 'Nếu vi phạm lần 1 thì cho 0 điểm và lần vi phạm thứ 2 trở đi thì trừ 2 điểm vào tổng số điểm.',
            easyPoint: true,
            defaultStatus: 'dat'
          }
        ]
      },
      {
        sectionId: '1.2',
        title: '1.2. Ý thức và thái độ tham gia các CLB học thuật, hoạt động học thuật, kỹ năng, NCKH',
        maxScore: 6,
        subNote: 'Trong từng mục ghi tất cả điểm đạt được, nhưng tổng mục 1.2 không quá 6 điểm. Từ 10 điểm trở lên thì được thưởng +2 điểm vào mục 1.5.',
        criteria: [
          {
            id: 'c_1_2_a',
            code: '1.2.a',
            title: 'Tham gia các hoạt động (HĐ) của các câu lạc bộ học thuật (NCKH, ngoại ngữ, kỹ năng); tham gia hỗ trợ giảng viên NCKH có xác nhận của giảng viên; tham gia hội thảo, hội nghị khoa học và các cuộc thi NCKH cấp Trường/Khoa',
            ruleScore: 1,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 1,
            proofRequirement: 'Kèm theo giấy chứng nhận',
            easyPoint: true,
            sampleActivities: [
              'Tham gia Hội thảo Phương pháp nghiên cứu khoa học trong Y sinh',
              'Tham gia sinh hoạt định kỳ CLB Kỹ năng Y khoa',
              'Hỗ trợ giảng viên thu thập số liệu nghiên cứu lâm sàng'
            ]
          },
          {
            id: 'c_1_2_b',
            code: '1.2.b',
            title: 'Tham gia các hoạt động của các câu lạc bộ học thuật (NCKH, ngoại ngữ, kỹ năng); tham gia hỗ trợ giảng viên NCKH có xác nhận của giảng viên; tham gia hội thảo, hội nghị khoa học và các cuộc thi NCKH cấp ĐHYD TPHCM trở lên',
            ruleScore: 2,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 2,
            proofRequirement: 'Kèm theo giấy chứng nhận',
            easyPoint: false,
            sampleActivities: [
              'Hội nghị Khoa học Kỹ thuật thường niên UMP',
              'Hội thi Báo cáo viên Tiếng Anh chuyên ngành Y khoa toàn quốc'
            ]
          },
          {
            id: 'c_1_2_c',
            code: '1.2.c',
            title: 'Là thành viên Ban Tổ chức, Ban Chủ nhiệm (Trưởng/Phó) các HĐ, CLB học thuật, NCKH, Ngoại ngữ, Kỹ năng cấp ĐHYD TPHCM, Trường/Khoa (chưa kể tham gia)',
            ruleScore: 2,
            unit: 'điểm/HĐ, CLB',
            type: 'activity_list',
            pointsPerUnit: 2,
            proofRequirement: 'Kèm theo giấy chứng nhận hoặc quyết định/kế hoạch',
            easyPoint: false
          },
          {
            id: 'c_1_2_d',
            code: '1.2.d',
            title: 'Tham gia hoặc là thành viên Ban Tổ chức các hoạt động tương tự do các cơ quan, tổ chức ngoài trường thì tùy theo tính chất, nội dung được hội đồng cấp Trường/Khoa duyệt (tối đa 3 điểm)',
            ruleScore: 1,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 1,
            maxCap: 3,
            proofRequirement: 'Kèm theo giấy chứng nhận hoặc quyết định/kế hoạch',
            easyPoint: false
          }
        ]
      },
      {
        sectionId: '1.3',
        title: '1.3. Ý thức và thái độ tham gia các kỳ thi, cuộc thi',
        maxScore: 2,
        criteria: [
          {
            id: 'c_1_3',
            code: '1.3',
            title: 'Nghiêm túc trong thi cử, không vi phạm quy chế thi',
            ruleScore: 2,
            type: 'discipline_status', // 'dat' (2đ), 'vipham_1' (0đ), 'vipham_2' (0đ + trừ 2đ)
            note: 'Nếu vi phạm lần 1 thì cho 0 điểm và lần vi phạm thứ 2 trở đi thì trừ 2 điểm vào tổng số điểm.',
            easyPoint: true,
            defaultStatus: 'dat'
          }
        ]
      },
      {
        sectionId: '1.4',
        title: '1.4. Kết quả học tập',
        maxScore: 10,
        subNote: 'Dựa trên kết quả học tập học kỳ xét rèn luyện (chọn một mức tương ứng).',
        criteria: [
          {
            id: 'c_1_4',
            code: '1.4',
            title: 'Kết quả học tập theo thang điểm 4.0 quy định tại QĐ 1714',
            ruleScore: 10,
            type: 'academic_grade',
            options: [
              { label: 'Chọn mức học lực học kỳ...', score: 0, range: '' },
              { label: 'Xuất sắc (3,60 đến 4,00) - 10 điểm', score: 10, range: '3.60 - 4.00' },
              { label: 'Giỏi (3,20 đến 3,59) - 9 điểm', score: 9, range: '3.20 - 3.59' },
              { label: 'Khá (2,50 đến 3,19) - 7 điểm', score: 7, range: '2.50 - 3.19' },
              { label: 'Trung bình (2,00 đến 2,49) - 5 điểm', score: 5, range: '2.00 - 2.49' },
              { label: 'Yếu (1,80 đến 2,00) - 3 điểm', score: 3, range: '1.80 - 2.00' },
              { label: 'Yếu (1,40 đến 1,80) - 2 điểm', score: 2, range: '1.40 - 1.80' },
              { label: 'Kém (1,00 đến 1,40) - 1 điểm', score: 1, range: '1.00 - 1.40' }
            ],
            easyPoint: true
          }
        ]
      },
      {
        sectionId: '1.5',
        title: '1.5. Điểm thưởng, điểm trừ và đặc thù ngành (Phần 1)',
        maxScore: null, // tính vào tổng phần 1
        criteria: [
          {
            id: 'c_1_5_auto_1_2',
            code: '1.5.Thưởng 1.2',
            title: 'Điểm thưởng mục 1.2: Nếu đạt từ 10 điểm thô trở lên thì được thưởng +2 điểm vào tổng số điểm',
            ruleScore: 2,
            type: 'auto_bonus_1_2',
            note: 'Hệ thống tự động kiểm tra tổng điểm thực đạt các hoạt động ở mục 1.2. Nếu >= 10đ sẽ tự động cộng +2 điểm thưởng.',
            easyPoint: false
          },
          {
            id: 'c_1_5_awards',
            code: '1.5.Giải thưởng',
            title: 'Tham gia và đạt từ giải khuyến khích các cuộc thi học thuật, NCKH, ngoại ngữ, chính trị, Olympic các cấp (TW, ĐHYD TPHCM, Trường/Khoa) hoặc các tổ chức, cơ quan, trường học khác được công nhận',
            ruleScore: 1,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 1,
            proofRequirement: 'Kèm giấy chứng nhận, công nhận, giấy khen, bài báo,...',
            easyPoint: false
          },
          {
            id: 'c_1_5_thesis_domestic',
            code: '1.5.Đề tài cơ sở/Trong nước',
            title: 'Là thành viên trong đề tài cấp cơ sở được nghiệm thu hoặc bài báo khoa học trong nước',
            ruleScore: 1,
            unit: 'điểm/đề tài, bài báo',
            type: 'activity_list',
            pointsPerUnit: 1,
            proofRequirement: 'Kèm quyết định nghiệm thu hoặc minh chứng bài báo công bố'
          },
          {
            id: 'c_1_5_thesis_intl',
            code: '1.5.Đề tài Bộ-TP/Quốc tế',
            title: 'Là thành viên trong đề tài cấp TP, Bộ,... được nghiệm thu hoặc bài báo khoa học quốc tế',
            ruleScore: 2,
            unit: 'điểm/đề tài, bài báo',
            type: 'activity_list',
            pointsPerUnit: 2,
            proofRequirement: 'Kèm quyết định nghiệm thu hoặc minh chứng bài báo công bố quốc tế (ISI/Scopus/PubMed)'
          },
          {
            id: 'c_1_5_gpa_increase',
            code: '1.5.Tăng học lực',
            title: 'Có thành tích tăng học lực so với học kỳ trước: thưởng 2 điểm/1 bậc tăng lên',
            ruleScore: 2,
            unit: 'điểm/bậc',
            type: 'step_counter',
            pointsPerUnit: 2,
            note: 'Được hội đồng cấp Trường/Khoa ghi nhận (ví dụ từ Khá lên Giỏi tính 1 bậc = +2đ, từ TB lên Giỏi tính 2 bậc = +4đ)'
          },
          {
            id: 'c_1_5_hardship',
            code: '1.5.Vượt khó',
            title: 'Sinh viên có hoàn cảnh khó khăn trong cuộc sống, vượt khó trong học tập được phát hiện, biểu dương các cấp',
            ruleScore: 2,
            type: 'checkbox_single',
            pointsIfChecked: 2,
            note: 'Được hội đồng cấp Trường/Khoa ghi nhận'
          },
          {
            id: 'c_1_5_specific',
            code: '1.5.Đặc thù',
            title: 'Điểm đặc thù Ngành/Trường/Khoa/ĐHYD TPHCM, đột xuất không theo định kỳ (liên quan đến học tập, NCKH)',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Cần có thông tin rộng rãi hoặc công bố ngay từ đầu học kỳ, báo cáo về cho Phòng CTSV để ghi nhận. Đề nghị liệt kê và minh chứng'
          },
          {
            id: 'c_1_5_penalty',
            code: '1.5.Điểm trừ',
            title: 'Điểm trừ Phần 1 (Tự động cộng vi phạm mục 1.1, 1.3 và điểm trừ khác)',
            ruleScore: 0,
            type: 'deduction_input',
            note: 'Tự động tính từ lỗi vi phạm quy chế học tập/thi cử lần 2 trở đi (+2đ/lỗi) + ô nhập điểm trừ bổ sung của Khoa/Trường.'
          }
        ]
      }
    ]
  },
  {
    partId: 2,
    partCode: 'PART_2',
    title: '2. ĐÁNH GIÁ VỀ Ý THỨC CHẤP HÀNH NỘI QUY, QUY CHẾ, QUY ĐỊNH TRONG NHÀ TRƯỜNG',
    maxScore: 25,
    shortTitle: 'Ý thức chấp hành nội quy, quy chế',
    description: 'Chấp hành ngoại trú, nộp ĐRL đúng hạn, học phí, trang phục/bảng tên, văn minh học đường, bảo quản tài sản và khảo sát ý kiến.',
    sections: [
      {
        sectionId: '2.1',
        title: '2.1. Đánh giá về ý thức chấp hành nội quy, quy chế, quy định trong nhà trường',
        maxScore: 25,
        subNote: 'Tiêu chuẩn ý thức sinh viên. Mặc định tích sẵn ĐẠT để sinh viên đỡ thao tác. Nếu có vi phạm bấm chuyển sang Vi phạm.',
        criteria: [
          {
            id: 'c_2_1_1',
            code: '2.1.1',
            title: 'Thực hiện nhiệm vụ đăng ký thông tin ngoại trú đầy đủ theo đúng quy chế',
            ruleScore: 5,
            type: 'pass_fail_toggle',
            passScore: 5,
            failScore: 0,
            defaultPass: true,
            penaltyNote: 'Nếu vi phạm cho 0 điểm và xử lý theo Quy chế CTSV',
            easyPoint: true
          },
          {
            id: 'c_2_1_2',
            code: '2.1.2',
            title: 'Thực hiện đánh giá kết quả rèn luyện sinh viên đúng thời gian quy định',
            ruleScore: 3,
            type: 'pass_fail_toggle',
            passScore: 3,
            failScore: 0,
            defaultPass: true,
            isCriticalZeroTrigger: true, // Nếu vi phạm thì kết quả đánh giá rèn luyện cả học kỳ bằng 0
            penaltyNote: 'CẢNH BÁO QUAN TRỌNG: Nếu vi phạm thì kết quả đánh giá rèn luyện của học kỳ bằng 0!',
            easyPoint: true
          },
          {
            id: 'c_2_1_3',
            code: '2.1.3',
            title: 'Đóng học phí đúng quy định và thời hạn',
            ruleScore: 5,
            type: 'pass_fail_toggle',
            passScore: 5,
            failScore: 0,
            defaultPass: true,
            penaltyNote: 'Nếu vi phạm cho 0 điểm và xử lý theo Quy chế CTSV',
            easyPoint: true
          },
          {
            id: 'c_2_1_4',
            code: '2.1.4',
            title: 'Trang phục chỉnh tề, nghiêm túc; Đeo bảng tên khi vào trường',
            ruleScore: 3,
            type: 'pass_fail_toggle',
            passScore: 3,
            failScore: 0,
            defaultPass: true,
            penaltyNote: 'Nếu vi phạm cho 0 điểm và xử lý theo Quy chế CTSV',
            easyPoint: true
          },
          {
            id: 'c_2_1_5',
            code: '2.1.5',
            title: 'Không nói tục, chửi thề, không gây mất trật tự trong lớp học, không hút thuốc lá, uống rượu bia, đánh bài bạc trong khuôn viên nhà trường',
            ruleScore: 3,
            type: 'pass_fail_toggle',
            passScore: 3,
            failScore: 0,
            defaultPass: true,
            penaltyNote: 'Nếu vi phạm cho 0 điểm và xử lý theo Quy chế CTSV',
            easyPoint: true
          },
          {
            id: 'c_2_1_6',
            code: '2.1.6',
            title: 'Bảo quản tài sản chung, giữ gìn vệ sinh, bỏ rác đúng nơi quy định',
            ruleScore: 3,
            type: 'pass_fail_toggle',
            passScore: 3,
            failScore: 0,
            defaultPass: true,
            penaltyNote: 'Nếu vi phạm cho 0 điểm và xử lý theo Quy chế CTSV',
            easyPoint: true
          },
          {
            id: 'c_2_1_7',
            code: '2.1.7',
            title: 'Tôn trọng, lễ phép với Thầy Cô, cán bộ viên chức',
            ruleScore: 3,
            type: 'pass_fail_toggle',
            passScore: 3,
            failScore: 0,
            defaultPass: true,
            penaltyNote: 'Nếu vi phạm cho 0 điểm và xử lý theo Quy chế CTSV',
            easyPoint: true
          }
        ]
      },
      {
        sectionId: '2.2',
        title: '2.2. Điểm thưởng, điểm trừ và đặc thù ngành (Phần 2)',
        maxScore: null,
        criteria: [
          {
            id: 'c_2_2_security_team',
            code: '2.2.Đội tự quản/Vệ sinh',
            title: 'Tham gia hoạt động của đội hình/CLB an ninh, trật tự, tự quản KTX; đội/CLB văn minh học đường, và các đội hình tình nguyện tuyên truyền giữ gìn vệ sinh trường học: thưởng 3 điểm/HĐ',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Kèm giấy chứng nhận, công nhận',
            easyPoint: true,
            sampleActivities: [
              'Trực tự quản văn minh KTX Ngô Gia Tự',
              'Tham gia Đội hình Văn minh học đường UMP tuần tra cơ sở'
            ]
          },
          {
            id: 'c_2_2_survey_course',
            code: '2.2.Khảo sát môn học',
            title: 'Tham gia HĐ lấy ý kiến người học về môn học, khóa học, chương trình: thưởng 3 điểm/HĐ',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Hoàn thành phiếu khảo sát trực tuyến theo thông báo của Phòng Đảm bảo chất lượng',
            easyPoint: true,
            sampleActivities: [
              'Khảo sát ý kiến người học về môn học đợt 1',
              'Khảo sát chất lượng đào tạo học kỳ'
            ]
          },
          {
            id: 'c_2_2_survey_qa_other',
            code: '2.2.Khảo sát ĐBCL khác',
            title: 'Tham gia HĐ Đảm bảo chất lượng giáo dục khác lấy ý kiến: 2 điểm/HĐ',
            ruleScore: 2,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 2,
            proofRequirement: 'Minh chứng xác nhận tham gia khảo sát/đóng góp ý kiến',
            easyPoint: true
          },
          {
            id: 'c_2_2_specific',
            code: '2.2.Đặc thù',
            title: 'Điểm đặc thù Ngành/Trường/Khoa/ĐHYD TPHCM, đột xuất không theo định kỳ (Hỗ trợ công tác tổ chức Lễ, Sự kiện của ĐHYD TPHCM, Trường/Khoa...): 3 điểm/HĐ',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Cần có thông tin rộng rãi hoặc công bố ngay từ đầu học kỳ, báo cáo về cho Phòng CTSV để ghi nhận. Đề nghị liệt kê và minh chứng'
          },
          {
            id: 'c_2_2_penalty_citizen_week',
            code: '2.2.Trừ SHCD',
            title: 'Không tham gia hoặc kết quả đánh giá Tuần sinh hoạt công dân - Sinh viên không đạt: trừ 10 điểm',
            ruleScore: -10,
            type: 'penalty_checkbox',
            penaltyPoints: 10,
            note: 'Trừ trực tiếp 10 điểm vào Phần 2 nếu không học hoặc thi không đạt Tuần SHCD'
          },
          {
            id: 'c_2_2_penalty_copyright',
            code: '2.2.Trừ bản quyền',
            title: 'Vi phạm quy định bản quyền tác giả (sao lưu và mua tài liệu do Nhà trường phát hành dưới bất kì hình thức nào nếu chưa được sự đồng ý): trừ 5 điểm/lần',
            ruleScore: -5,
            unit: 'điểm/lần',
            type: 'penalty_counter',
            penaltyPerUnit: 5
          },
          {
            id: 'c_2_2_penalty_other_rules',
            code: '2.2.Trừ nội quy khác',
            title: 'Vi phạm các nội quy, quy chế, quy định khác của Nhà trường: trừ 5 điểm/lần',
            ruleScore: -5,
            unit: 'điểm/lần',
            type: 'penalty_counter',
            penaltyPerUnit: 5
          }
        ]
      }
    ]
  },
  {
    partId: 3,
    partCode: 'PART_3',
    title: '3. ĐÁNH GIÁ VỀ Ý THỨC THAM GIA CÁC HOẠT ĐỘNG CHÍNH TRỊ, VĂN HÓA, VĂN NGHỆ, THỂ THAO, PHÒNG CHỐNG TỘI PHẠM VÀ CÁC TỆ NẠN XÃ HỘI',
    maxScore: 20,
    shortTitle: 'HĐ Chính trị, VH, VN, Thể thao, PCTP & TNXH',
    description: 'Các giải đấu thể thao, hội diễn văn nghệ, mít tinh, phòng chống tệ nạn xã hội, phát triển Đảng và rèn luyện thể lực.',
    sections: [
      {
        sectionId: '3.1',
        title: '3.1. Ý thức tham gia các hoạt động chính trị, văn hóa, văn nghệ, thể thao, phòng chống tội phạm và các tệ nạn xã hội',
        maxScore: 20,
        criteria: [
          {
            id: 'c_3_1_a',
            code: '3.1.a',
            title: 'Tham gia các hoạt động chính trị, văn hóa, văn nghệ, thể thao cấp Trường/Khoa, Lớp: 2 điểm/HĐ',
            ruleScore: 2,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 2,
            proofRequirement: 'Kèm theo chứng nhận, công nhận',
            easyPoint: true,
            sampleActivities: [
              'Tham gia Hội thao sinh viên cấp Khoa',
              'Tham gia Cổ vũ hoặc dự Hội thi Tiếng hát sinh viên UMP',
              'Tham gia giải chạy rèn luyện sức khỏe của Lớp/Khoa'
            ]
          },
          {
            id: 'c_3_1_b',
            code: '3.1.b',
            title: 'Tham gia các hoạt động chính trị, văn hóa, văn nghệ, thể thao cấp ĐHYD TPHCM trở lên: 3 điểm/HĐ',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Kèm theo chứng nhận, công nhận',
            easyPoint: false,
            sampleActivities: [
              'Vận động viên thi đấu Hội thao truyền thống ĐHYD TPHCM',
              'Thành viên đội tuyển văn nghệ biểu diễn Lễ kỷ niệm 20/11 cấp Trường'
            ]
          },
          {
            id: 'c_3_1_c',
            code: '3.1.c',
            title: 'Là thành viên Ban Tổ chức, Ban Chủ nhiệm (Trưởng/Phó) các HĐ, CLB chính trị, văn hóa, văn nghệ, thể thao, hoạt động công ích, tình nguyện, công tác xã hội cấp ĐHYD TPHCM, Trường/Khoa (chưa kể tham gia): 3 điểm/HĐ, CLB',
            ruleScore: 3,
            unit: 'điểm/HĐ, CLB',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Kèm theo giấy chứng nhận hoặc quyết định/kế hoạch',
            easyPoint: false
          },
          {
            id: 'c_3_1_d',
            code: '3.1.d',
            title: 'Tham gia các hoạt động tuyên truyền về phòng chống tội phạm và phòng chống tệ nạn xã hội các cấp: 2 điểm/HĐ',
            ruleScore: 2,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 2,
            proofRequirement: 'Kèm theo chứng nhận, công nhận',
            easyPoint: true,
            sampleActivities: [
              'Tham gia Tọa đàm Tuyên truyền Pháp luật An toàn giao thông & Phòng chống Ma túy',
              'Làm bài thi trực tuyến Tìm hiểu pháp luật về phòng chống tham nhũng, tội phạm'
            ]
          },
          {
            id: 'c_3_1_e',
            code: '3.1.e',
            title: 'Là thành viên Ban Tổ chức, Ban Chủ nhiệm (Trưởng/Phó) các HĐ, CLB các hoạt động tuyên truyền về phòng chống tội phạm và phòng chống tệ nạn xã hội các cấp: 3 điểm/HĐ, CLB',
            ruleScore: 3,
            unit: 'điểm/HĐ, CLB',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Kèm theo giấy chứng nhận hoặc quyết định/kế hoạch',
            easyPoint: false
          },
          {
            id: 'c_3_1_f',
            code: '3.1.f',
            title: 'Tham gia hoặc là thành viên Ban Tổ chức các hoạt động tương tự do các cơ quan, tổ chức ngoài trường thì tùy theo tính chất, nội dung được Hội đồng cấp Trường/Khoa duyệt: 1 điểm/HĐ (tối đa 3 điểm)',
            ruleScore: 1,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 1,
            maxCap: 3,
            proofRequirement: 'Kèm theo giấy chứng nhận hoặc quyết định/kế hoạch',
            easyPoint: false
          }
        ]
      },
      {
        sectionId: '3.2',
        title: '3.2. Điểm thưởng, điểm trừ và đặc thù ngành (Phần 3)',
        maxScore: null,
        criteria: [
          {
            id: 'c_3_2_party_member',
            code: '3.2.Đảng/Đoàn ưu tú',
            title: 'Được kết nạp Đảng trong học kỳ; Đảng viên hoàn thành nhiệm vụ, Đoàn viên ưu tú: thưởng 3 điểm',
            ruleScore: 3,
            type: 'checkbox_single',
            pointsIfChecked: 3,
            note: 'Kèm quyết định kết nạp Đảng hoặc giấy chứng nhận Đoàn viên ưu tú/Đảng viên HTNV',
            easyPoint: true
          },
          {
            id: 'c_3_2_healthy_faculty',
            code: '3.2.SV Khỏe Khoa',
            title: 'Đạt danh hiệu Sinh viên khỏe cấp Trường/Khoa: thưởng 1 điểm',
            ruleScore: 1,
            type: 'checkbox_single',
            pointsIfChecked: 1,
            proofRequirement: 'Kèm giấy chứng nhận đạt danh hiệu',
            easyPoint: true
          },
          {
            id: 'c_3_2_healthy_uni',
            code: '3.2.SV Khỏe ĐHYD trở lên',
            title: 'Đạt danh hiệu Sinh viên khỏe cấp Trường trở lên: thưởng 2 điểm',
            ruleScore: 2,
            type: 'checkbox_single',
            pointsIfChecked: 2,
            proofRequirement: 'Kèm giấy chứng nhận đạt danh hiệu cấp Trường/Thành phố',
            easyPoint: false
          },
          {
            id: 'c_3_2_awards_consolation',
            code: '3.2.Giải Khuyến khích',
            title: 'Đạt giải thưởng các cuộc thi về chính trị, VH, VN, thể thao, tuyên truyền PCTP & TNXH: Giải khuyến khích (thưởng 1 điểm/HĐ)',
            ruleScore: 1,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 1,
            proofRequirement: 'Kèm giấy khen, chứng nhận giải thưởng',
            easyPoint: false
          },
          {
            id: 'c_3_2_awards_top3',
            code: '3.2.Giải Ba trở lên',
            title: 'Đạt giải thưởng các cuộc thi về chính trị, VH, VN, thể thao, tuyên truyền PCTP & TNXH: Giải 3 trở lên từ cấp Trường/Khoa trở lên (thưởng 2 điểm/HĐ)',
            ruleScore: 2,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 2,
            proofRequirement: 'Kèm giấy khen, huy chương, giấy chứng nhận',
            easyPoint: false
          },
          {
            id: 'c_3_2_mobilization',
            code: '3.2.Huy động lực lượng',
            title: 'Tham gia huy động lực lượng cấp ĐHYD TPHCM trở lên để dự các Lễ mít tinh, Lễ chào đón, tổng kết...: thưởng 2 điểm/HĐ',
            ruleScore: 2,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 2,
            proofRequirement: 'Có danh sách triệu tập / điểm danh của Đoàn - Hội hoặc Phòng CTSV',
            easyPoint: true,
            sampleActivities: [
              'Lực lượng đón tiếp khách quốc tế và Lễ Khai giảng năm học',
              'Tham gia Lễ diễu hành kỷ niệm Ngày Thầy thuốc Việt Nam 27/2'
            ]
          },
          {
            id: 'c_3_2_specific',
            code: '3.2.Đặc thù',
            title: 'Điểm đặc thù Ngành/Trường/Khoa/ĐHYD TPHCM, đột xuất không theo định kỳ (liên quan đến chính trị, VH, VN, TT, phòng chống tệ nạn xã hội): 3 điểm/HĐ',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Cần có thông tin rộng rãi hoặc công bố ngay từ đầu học kỳ, báo cáo về cho Phòng CTSV để ghi nhận. Đề nghị liệt kê và minh chứng'
          },
          {
            id: 'c_3_2_penalty',
            code: '3.2.Điểm trừ',
            title: 'Điểm trừ Phần 3: Tổng điểm trừ từ các vi phạm quy định về VH, VN, TT, phòng chống tệ nạn xã hội (nếu có)',
            ruleScore: 0,
            type: 'deduction_input'
          }
        ]
      }
    ]
  },
  {
    partId: 4,
    partCode: 'PART_4',
    title: '4. ĐÁNH GIÁ VỀ Ý THỨC CÔNG DÂN TRONG QUAN HỆ CỘNG ĐỒNG',
    maxScore: 25,
    shortTitle: 'Ý thức công dân trong quan hệ cộng đồng',
    description: 'Chấp hành pháp luật, an toàn giao thông, đoàn kết tập thể, hoạt động tình nguyện, công tác xã hội và hiến máu nhân đạo.',
    sections: [
      {
        sectionId: '4.1',
        title: '4.1. Ý thức công dân trong quan hệ cộng đồng',
        maxScore: 25,
        subNote: 'Gồm 3 tiêu chí ý thức cơ bản (mặc định Đạt) và các hoạt động tình nguyện, công tác xã hội.',
        criteria: [
          {
            id: 'c_4_1_1',
            code: '4.1.1',
            title: 'Chấp hành nghiêm chỉnh chủ trương, chính sách của Đảng, pháp luật Nhà nước và địa phương nơi cư trú, học tập',
            ruleScore: 5,
            type: 'pass_fail_toggle',
            passScore: 5,
            failScore: 0,
            defaultPass: true,
            penaltyNote: 'Nếu vi phạm cho 0 điểm và xử lý theo quy chế CTSV',
            easyPoint: true
          },
          {
            id: 'c_4_1_2',
            code: '4.1.2',
            title: 'Không vi phạm về công tác giữ gìn an ninh trật tự, luật giao thông',
            ruleScore: 5,
            type: 'pass_fail_toggle',
            passScore: 5,
            failScore: 0,
            defaultPass: true,
            penaltyNote: 'Nếu vi phạm cho 0 điểm và xử lý theo quy chế CTSV',
            easyPoint: true
          },
          {
            id: 'c_4_1_3',
            code: '4.1.3',
            title: 'Hòa đồng, nhiệt tình giúp đỡ bạn bè trong Lớp, Trường/Khoa, ĐHYD TPHCM cùng tiến bộ. Không chia rẽ bè phái, gây bất hòa, xích mích trong nội bộ, làm ảnh hưởng đến tinh thần đoàn kết của tập thể',
            ruleScore: 5,
            type: 'pass_fail_toggle',
            passScore: 5,
            failScore: 0,
            defaultPass: true,
            penaltyNote: 'Nếu vi phạm cho 0 điểm và xử lý theo quy chế CTSV',
            easyPoint: true
          },
          {
            id: 'c_4_1_volunteer_lt5d_faculty',
            code: '4.1.4',
            title: 'Tham gia các hoạt động công ích, tình nguyện, công tác xã hội cấp Lớp, Trường/Khoa, ĐHYD TPHCM (thời gian dưới 5 ngày): 2 điểm/HĐ',
            ruleScore: 2,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 2,
            proofRequirement: 'Kèm theo chứng nhận, công nhận',
            easyPoint: true,
            sampleActivities: [
              'Ngày Chủ Nhật Xanh vệ sinh khuôn viên bệnh viện thực hành',
              'Chương trình Trung thu yêu thương cho bệnh nhi ung bướu',
              'Tham gia ngày công ích hỗ trợ người cao tuổi neo đơn'
            ]
          },
          {
            id: 'c_4_1_volunteer_lt5d_uni',
            code: '4.1.5',
            title: 'Tham gia các hoạt động công ích, tình nguyện, công tác xã hội cấp ĐHYD TPHCM trở lên (thời gian dưới 5 ngày): 3 điểm/HĐ',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Kèm theo chứng nhận, công nhận',
            easyPoint: true,
            sampleActivities: [
              'Chuyến xe Y tế cộng đồng khám bệnh vùng sâu vùng xa (3 ngày)',
              'Chương trình Xuân Tình Nguyện cấp Trường ĐHYD TPHCM'
            ]
          },
          {
            id: 'c_4_1_volunteer_gte5d',
            code: '4.1.6',
            title: 'Tham gia các hoạt động công ích, tình nguyện, công tác xã hội có thời gian từ 05 ngày trở lên: 4 điểm/HĐ',
            ruleScore: 4,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 4,
            proofRequirement: 'Kèm theo chứng nhận, công nhận',
            easyPoint: false,
            sampleActivities: [
              'Chiến dịch Mùa Hè Xanh mặt trận tỉnh Bến Tre (15 ngày)',
              'Chiến dịch Tiếp Sức Mùa Thi đợt tuyển sinh đại học (7 ngày)'
            ]
          },
          {
            id: 'c_4_1_lead_volunteer',
            code: '4.1.7',
            title: 'Là thành viên Ban Tổ chức, Ban Chủ nhiệm (Trưởng/Phó) các HĐ, CLB hoạt động công ích, tình nguyện, công tác xã hội cấp ĐHYD TPHCM/Trường/Khoa (chưa kể tham gia): 3 điểm/HĐ, CLB',
            ruleScore: 3,
            unit: 'điểm/HĐ, CLB',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Kèm theo giấy chứng nhận hoặc quyết định/kế hoạch',
            easyPoint: false
          },
          {
            id: 'c_4_1_outside',
            code: '4.1.8',
            title: 'Tham gia hoặc là thành viên Ban Tổ chức các hoạt động tương tự do các cơ quan, tổ chức ngoài trường thì tùy theo tính chất, nội dung được hội đồng cấp Trường/Khoa duyệt: 1 điểm/HĐ (tối đa 3 điểm)',
            ruleScore: 1,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 1,
            maxCap: 3,
            proofRequirement: 'Kèm theo giấy chứng nhận hoặc quyết định/kế hoạch',
            easyPoint: false
          }
        ]
      },
      {
        sectionId: '4.2',
        title: '4.2. Điểm thưởng, điểm trừ và đặc thù ngành (Phần 4)',
        maxScore: null,
        criteria: [
          {
            id: 'c_4_2_blood_donation',
            code: '4.2.Hiến máu',
            title: 'Hiến máu nhân đạo: thưởng 5 điểm/HĐ',
            ruleScore: 5,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 5,
            proofRequirement: 'Kèm theo Giấy chứng nhận hiến máu tình nguyện',
            easyPoint: true,
            sampleActivities: [
              'Hiến máu tình nguyện giọt hồng Blouse Trắng đợt 1',
              'Hiến tiểu cầu tại Bệnh viện Truyền máu Huyết học'
            ]
          },
          {
            id: 'c_4_2_commendation',
            code: '4.2.Khen thưởng CTXH',
            title: 'Được khen thưởng các cấp về ý thức cộng đồng, công tác xã hội: 3 điểm/HĐ',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Kèm theo giấy khen / bằng khen của Thành Đoàn, Hội LHTN hoặc UBND các cấp',
            easyPoint: false
          },
          {
            id: 'c_4_2_specific',
            code: '4.2.Đặc thù',
            title: 'Điểm đặc thù Ngành/Trường/Khoa/ĐHYD TPHCM, đột xuất không theo định kỳ (thể hiện vai trò, ý thức sinh viên trong quan hệ cộng đồng): 3 điểm/HĐ',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Cần có thông tin rộng rãi hoặc công bố ngay từ đầu học kỳ, báo cáo về cho Phòng CTSV để ghi nhận. Đề nghị liệt kê và minh chứng'
          },
          {
            id: 'c_4_2_penalty',
            code: '4.2.Điểm trừ',
            title: 'Điểm trừ Phần 4: Tổng điểm trừ từ các vi phạm quan hệ cộng đồng (nếu có)',
            ruleScore: 0,
            type: 'deduction_input'
          }
        ]
      }
    ]
  },
  {
    partId: 5,
    partCode: 'PART_5',
    title: '5. ĐÁNH GIÁ VỀ Ý THỨC VÀ KẾT QUẢ KHI THAM GIA CÔNG TÁC CÁN BỘ LỚP, CÁC ĐOÀN THỂ, TỔ CHỨC TRONG NHÀ TRƯỜNG, NGƯỜI HỌC ĐẠT THÀNH TÍCH ĐẶC BIỆT TRONG HỌC TẬP, RÈN LUYỆN',
    maxScore: 10,
    shortTitle: 'Công tác cán bộ lớp, đoàn thể & Thành tích đặc biệt',
    description: 'Chức danh BCH Đoàn - Hội, BCS Lớp, Tổ trưởng, mức độ hoàn thành nhiệm vụ (có cơ chế nâng điểm theo GPA), danh hiệu SV 5 tốt.',
    sections: [
      {
        sectionId: '5.1',
        title: '5.1. Ý thức và kết quả khi tham gia công tác cán bộ lớp, các đoàn thể, tổ chức trong nhà trường, người học đạt thành tích đặc biệt trong học tập, rèn luyện',
        maxScore: 10,
        subNote: 'Chọn vai trò phụ trách phù hợp nhất trong học kỳ. Tự động nâng 2 điểm với Nhóm B & C khi điểm TB học kỳ thang 10 >= 6.5.',
        criteria: [
          {
            id: 'c_5_1_role',
            code: '5.1',
            title: 'Vai trò công tác cán bộ lớp, đoàn thể và mức độ hoàn thành',
            ruleScore: 10,
            type: 'cadre_role_select',
            easyPoint: true
          }
        ]
      },
      {
        sectionId: '5.2',
        title: '5.2. Điểm thưởng, điểm trừ và đặc thù ngành (Phần 5)',
        maxScore: null,
        criteria: [
          {
            id: 'c_5_2_sv5t_faculty',
            code: '5.2.SV5T Khoa',
            title: 'Đạt danh hiệu Sinh viên 5 tốt và các danh hiệu khác cấp Trường/Khoa (khác SV khoẻ): thưởng 3 điểm',
            ruleScore: 3,
            type: 'checkbox_single',
            pointsIfChecked: 3,
            proofRequirement: 'Kèm theo chứng nhận, công nhận',
            easyPoint: false
          },
          {
            id: 'c_5_2_sv5t_uni_blouse',
            code: '5.2.SV5T ĐHYD/Blouse trắng',
            title: 'Được tuyên dương cấp ĐHYD TPHCM trở lên (Sinh viên 5 tốt, Blouse trắng làm theo lời Bác): thưởng 5 điểm',
            ruleScore: 5,
            type: 'checkbox_single',
            pointsIfChecked: 5,
            proofRequirement: 'Kèm giấy khen / quyết định tuyên dương',
            easyPoint: false
          },
          {
            id: 'c_5_2_special_award',
            code: '5.2.Khen thưởng đặc biệt',
            title: 'Được khen thưởng các cấp về thành tích đặc biệt: 3 điểm/HĐ',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Kèm quyết định khen thưởng / giấy khen các cấp'
          },
          {
            id: 'c_5_2_specific',
            code: '5.2.Đặc thù',
            title: 'Điểm đặc thù Ngành/Trường/Khoa/ĐHYD TPHCM, đột xuất không theo định kỳ: 3 điểm/HĐ',
            ruleScore: 3,
            unit: 'điểm/HĐ',
            type: 'activity_list',
            pointsPerUnit: 3,
            proofRequirement: 'Cần có thông tin rộng rãi hoặc công bố ngay từ đầu học kỳ, báo cáo về cho Phòng CTSV để ghi nhận. Đề nghị liệt kê và minh chứng'
          },
          {
            id: 'c_5_2_penalty',
            code: '5.2.Điểm trừ',
            title: 'Điểm trừ Phần 5: Tổng điểm trừ từ các vi phạm công tác cán bộ, đoàn thể (nếu có)',
            ruleScore: 0,
            type: 'deduction_input'
          }
        ]
      }
    ]
  }
];

/**
 * Danh mục vi phạm quy chế CTSV khác (Trừ thẳng vào Tổng điểm toàn phiếu)
 */
const UMP_DISCIPLINARY_RULES = [
  {
    id: 'disc_reprimand',
    title: 'Bị khiển trách trong học kỳ',
    penaltyPoints: 5,
    unit: 'điểm/lần',
    maxRankCap: 'Khá',
    description: 'Bị khiển trách: trừ 5 điểm/lần (Xếp loại rèn luyện toàn học kỳ tối đa chỉ được mức Khá dù tổng điểm trên 80đ).'
  },
  {
    id: 'disc_warning',
    title: 'Bị cảnh cáo trong học kỳ',
    penaltyPoints: 10,
    unit: 'điểm/lần',
    maxRankCap: 'Trung bình',
    description: 'Bị cảnh cáo: trừ 10 điểm/lần (Xếp loại rèn luyện toàn học kỳ tối đa chỉ được mức Trung bình dù tổng điểm trên 65đ).'
  },
  {
    id: 'disc_suspended',
    title: 'Bị đình chỉ học trở lên',
    isZeroScoreTrigger: true,
    description: 'Bị đình chỉ học trở lên: Không đánh giá kết quả rèn luyện (Tổng điểm rèn luyện toàn phiếu = 0 điểm).'
  }
];

/**
 * Xếp loại rèn luyện theo thang chuẩn UMP
 */
const UMP_RANKING_LEVELS = [
  { key: 'xuat_sac', name: 'Xuất sắc', minScore: 90, maxScore: 100, color: '#4F46E5', bg: '#EEF2FF', badgeClass: 'badge-xuat-sac', desc: 'Đạt từ 90 đến 100 điểm' },
  { key: 'tot', name: 'Tốt', minScore: 80, maxScore: 89.99, color: '#0B5ED7', bg: '#EFF6FF', badgeClass: 'badge-tot', desc: 'Đạt từ 80 đến 89 điểm (Chuẩn xét học bổng)' },
  { key: 'kha', name: 'Khá', minScore: 65, maxScore: 79.99, color: '#16A34A', bg: '#F0FDF4', badgeClass: 'badge-kha', desc: 'Đạt từ 65 đến 79 điểm' },
  { key: 'trung_binh', name: 'Trung bình', minScore: 50, maxScore: 64.99, color: '#D97706', bg: '#FFFBEB', badgeClass: 'badge-trung-binh', desc: 'Đạt từ 50 đến 64 điểm' },
  { key: 'yeu', name: 'Yếu', minScore: 35, maxScore: 49.99, color: '#EA580C', bg: '#FFF7ED', badgeClass: 'badge-yeu', desc: 'Đạt từ 35 đến 49 điểm' },
  { key: 'kem', name: 'Kém', minScore: 0, maxScore: 34.99, color: '#DC2626', bg: '#FEF2F2', badgeClass: 'badge-kem', desc: 'Dưới 35 điểm hoặc vi phạm mức đình chỉ/trễ hạn' }
];
