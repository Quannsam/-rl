/**
 * SỔ TAY THEO DÕI & TÍNH ĐIỂM RÈN LUYỆN UMP (QĐ 1714)
 * Engine tính toán điểm rèn luyện chính xác 100%
 */

class UmpDrlEngine {
  /**
   * Tính toán toàn bộ điểm cho một học kỳ
   * @param {Object} semesterData Dữ liệu trạng thái của học kỳ hiện tại
   * @returns {Object} Kết quả tính điểm chi tiết, xếp loại, cảnh báo
   */
  static calculate(semesterData) {
    const student = semesterData.student || {};
    const evals = semesterData.evaluations || {};
    const disc = semesterData.disciplinary || {};
    const gpa10 = parseFloat(student.gpa10) || 0;

    // --- PHẦN 1: Ý THỨC THAM GIA HỌC TẬP (Tối đa 20đ) ---
    const p1 = this.calculatePart1(evals, gpa10);

    // --- PHẦN 2: Ý THỨC CHẤP HÀNH NỘI QUY, QUY CHẾ (Tối đa 25đ) ---
    const p2 = this.calculatePart2(evals);

    // --- PHẦN 3: HĐ CHÍNH TRỊ, VH, VN, TT, PHÒNG CHỐNG TNXH (Tối đa 20đ) ---
    const p3 = this.calculatePart3(evals);

    // --- PHẦN 4: Ý THỨC CÔNG DÂN TRONG QUAN HỆ CỘNG ĐỒNG (Tối đa 25đ) ---
    const p4 = this.calculatePart4(evals);

    // --- PHẦN 5: CÔNG TÁC CÁN BỘ LỚP, ĐOÀN THỂ & THÀNH TÍCH ĐẶC BIỆT (Tối đa 10đ) ---
    const p5 = this.calculatePart5(evals, gpa10);

    // Điểm trừ vi phạm kỷ luật CTSV khác
    const discReprimandCount = parseInt(disc.reprimand, 10) || 0;
    const discWarningCount = parseInt(disc.warning, 10) || 0;
    const isSuspended = !!disc.suspended;
    const discPenaltyScore = (discReprimandCount * 5) + (discWarningCount * 10);

    // Kiểm tra điều kiện ngặt nghèo Mục 2.1.2: Đánh giá ĐRL trễ hạn -> 0đ cả học kỳ
    const isLateEvaluation = p2.isLateEvaluation;

    // Tổng điểm trước khi xét đình chỉ hoặc vi phạm hạn nộp
    const sumParts = p1.totalScore + p2.totalScore + p3.totalScore + p4.totalScore + p5.totalScore;
    let grandTotal = Math.max(0, Math.min(100, sumParts - discPenaltyScore));

    // Xử lý các trường hợp đặc biệt về 0đ
    let zeroReason = null;
    if (isSuspended) {
      grandTotal = 0;
      zeroReason = 'Bị đình chỉ học trở lên: Không đánh giá kết quả rèn luyện (QĐ 1714).';
    } else if (isLateEvaluation) {
      grandTotal = 0;
      zeroReason = 'Vi phạm Mục 2.1.2 (Đánh giá ĐRL không đúng hạn): Kết quả ĐRL học kỳ bằng 0 điểm.';
    }

    // Xếp loại rèn luyện kèm giới hạn trần kỷ luật
    const ranking = this.determineRanking(grandTotal, {
      isSuspended,
      isLateEvaluation,
      discReprimandCount,
      discWarningCount
    });

    // Tính mốc mục tiêu tiếp theo
    const milestone = this.calculateMilestone(grandTotal, ranking);

    // Tổng hợp điểm Lớp và Điểm Khoa (nếu có nhập)
    const classTotal = this.calculatePartyTotal(semesterData, 'classScore', discPenaltyScore, isSuspended || isLateEvaluation);
    const facultyTotal = this.calculatePartyTotal(semesterData, 'facultyScore', discPenaltyScore, isSuspended || isLateEvaluation);

    return {
      parts: {
        part1: p1,
        part2: p2,
        part3: p3,
        part4: p4,
        part5: p5
      },
      sumParts,
      discPenaltyScore,
      grandTotal,
      zeroReason,
      isZeroScore: grandTotal === 0 && (isSuspended || isLateEvaluation),
      ranking,
      milestone,
      classTotal,
      facultyTotal
    };
  }

  // --- TÍNH PHẦN 1 ---
  static calculatePart1(evals, gpa10) {
    // 1.1
    const val_1_1 = evals['c_1_1']?.status || 'dat';
    let score_1_1 = 0;
    let penalty_1_1 = 0;
    if (val_1_1 === 'dat') {
      score_1_1 = 2;
    } else if (val_1_1 === 'vipham_1') {
      score_1_1 = 0;
    } else if (val_1_1 === 'vipham_2') {
      score_1_1 = 0;
      penalty_1_1 = 2;
    }

    // 1.2
    const acts_1_2_a = evals['c_1_2_a']?.activities || [];
    const count_1_2_a = acts_1_2_a.length || (parseInt(evals['c_1_2_a']?.count, 10) || 0);
    const score_1_2_a = count_1_2_a * 1;

    const acts_1_2_b = evals['c_1_2_b']?.activities || [];
    const count_1_2_b = acts_1_2_b.length || (parseInt(evals['c_1_2_b']?.count, 10) || 0);
    const score_1_2_b = count_1_2_b * 2;

    const acts_1_2_c = evals['c_1_2_c']?.activities || [];
    const count_1_2_c = acts_1_2_c.length || (parseInt(evals['c_1_2_c']?.count, 10) || 0);
    const score_1_2_c = count_1_2_c * 2;

    const acts_1_2_d = evals['c_1_2_d']?.activities || [];
    const count_1_2_d = acts_1_2_d.length || (parseInt(evals['c_1_2_d']?.count, 10) || 0);
    const score_1_2_d = Math.min(3, count_1_2_d * 1);

    const raw_1_2 = score_1_2_a + score_1_2_b + score_1_2_c + score_1_2_d;
    const score_1_2 = Math.min(6, raw_1_2);
    const auto_bonus_1_2 = raw_1_2 >= 10 ? 2 : 0;

    // 1.3
    const val_1_3 = evals['c_1_3']?.status || 'dat';
    let score_1_3 = 0;
    let penalty_1_3 = 0;
    if (val_1_3 === 'dat') {
      score_1_3 = 2;
    } else if (val_1_3 === 'vipham_1') {
      score_1_3 = 0;
    } else if (val_1_3 === 'vipham_2') {
      score_1_3 = 0;
      penalty_1_3 = 2;
    }

    // 1.4
    const score_1_4 = parseInt(evals['c_1_4']?.selectedScore, 10) || 0;

    // 1.5 Điểm thưởng, điểm trừ & đặc thù
    const acts_1_5_awards = evals['c_1_5_awards']?.activities || [];
    const count_1_5_awards = acts_1_5_awards.length || (parseInt(evals['c_1_5_awards']?.count, 10) || 0);
    const score_1_5_awards = count_1_5_awards * 1;

    const acts_1_5_thesis_dom = evals['c_1_5_thesis_domestic']?.activities || [];
    const count_1_5_thesis_dom = acts_1_5_thesis_dom.length || (parseInt(evals['c_1_5_thesis_domestic']?.count, 10) || 0);
    const score_1_5_thesis_dom = count_1_5_thesis_dom * 1;

    const acts_1_5_thesis_intl = evals['c_1_5_thesis_intl']?.activities || [];
    const count_1_5_thesis_intl = acts_1_5_thesis_intl.length || (parseInt(evals['c_1_5_thesis_intl']?.count, 10) || 0);
    const score_1_5_thesis_intl = count_1_5_thesis_intl * 2;

    const steps_1_5_gpa = parseInt(evals['c_1_5_gpa_increase']?.steps, 10) || 0;
    const score_1_5_gpa = steps_1_5_gpa * 2;

    const isHardship = !!evals['c_1_5_hardship']?.checked;
    const score_1_5_hardship = isHardship ? 2 : 0;

    const acts_1_5_specific = evals['c_1_5_specific']?.activities || [];
    const count_1_5_specific = acts_1_5_specific.length || (parseInt(evals['c_1_5_specific']?.count, 10) || 0);
    const score_1_5_specific = count_1_5_specific * 3;

    const otherPenalty1 = parseFloat(evals['c_1_5_penalty']?.score) || 0;
    const totalPenalty1 = penalty_1_1 + penalty_1_3 + otherPenalty1;

    const evalScore = score_1_1 + score_1_2 + score_1_3 + score_1_4;
    const bonusScore = auto_bonus_1_2 + score_1_5_awards + score_1_5_thesis_dom + score_1_5_thesis_intl + score_1_5_gpa + score_1_5_hardship;
    const specificScore = score_1_5_specific;

    const rawTotal = evalScore + bonusScore + specificScore - totalPenalty1;
    const totalScore = Math.min(20, Math.max(0, rawTotal));
    const isCapped = rawTotal >= 20;

    return {
      partId: 1,
      maxScore: 20,
      evalScore,
      bonusScore,
      specificScore,
      penaltyScore: totalPenalty1,
      rawTotal,
      totalScore,
      isCapped,
      raw_1_2,
      score_1_2,
      auto_bonus_1_2,
      penalty_1_1,
      penalty_1_3
    };
  }

  // --- TÍNH PHẦN 2 ---
  static calculatePart2(evals) {
    // 2.1 (7 tiêu chí)
    const p_2_1_1 = evals['c_2_1_1']?.passed !== false;
    const score_2_1_1 = p_2_1_1 ? 5 : 0;

    const p_2_1_2 = evals['c_2_1_2']?.passed !== false;
    const score_2_1_2 = p_2_1_2 ? 3 : 0;
    const isLateEvaluation = !p_2_1_2;

    const p_2_1_3 = evals['c_2_1_3']?.passed !== false;
    const score_2_1_3 = p_2_1_3 ? 5 : 0;

    const p_2_1_4 = evals['c_2_1_4']?.passed !== false;
    const score_2_1_4 = p_2_1_4 ? 3 : 0;

    const p_2_1_5 = evals['c_2_1_5']?.passed !== false;
    const score_2_1_5 = p_2_1_5 ? 3 : 0;

    const p_2_1_6 = evals['c_2_1_6']?.passed !== false;
    const score_2_1_6 = p_2_1_6 ? 3 : 0;

    const p_2_1_7 = evals['c_2_1_7']?.passed !== false;
    const score_2_1_7 = p_2_1_7 ? 3 : 0;

    const evalScore = score_2_1_1 + score_2_1_2 + score_2_1_3 + score_2_1_4 + score_2_1_5 + score_2_1_6 + score_2_1_7;

    // 2.2 Thưởng, phạt & đặc thù
    const acts_security = evals['c_2_2_security_team']?.activities || [];
    const count_security = acts_security.length || (parseInt(evals['c_2_2_security_team']?.count, 10) || 0);
    const score_security = count_security * 3;

    const acts_survey = evals['c_2_2_survey_course']?.activities || [];
    const count_survey = acts_survey.length || (parseInt(evals['c_2_2_survey_course']?.count, 10) || 0);
    const score_survey = count_survey * 3;

    const acts_qa_other = evals['c_2_2_survey_qa_other']?.activities || [];
    const count_qa_other = acts_qa_other.length || (parseInt(evals['c_2_2_survey_qa_other']?.count, 10) || 0);
    const score_qa_other = count_qa_other * 2;

    const bonusScore = score_security + score_survey + score_qa_other;

    const acts_specific_2 = evals['c_2_2_specific']?.activities || [];
    const count_specific_2 = acts_specific_2.length || (parseInt(evals['c_2_2_specific']?.count, 10) || 0);
    const specificScore = count_specific_2 * 3;

    // Phạt phần 2
    const citizenWeekFailed = !!evals['c_2_2_penalty_citizen_week']?.checked;
    const penaltyCitizen = citizenWeekFailed ? 10 : 0;

    const copyrightCount = parseInt(evals['c_2_2_penalty_copyright']?.count, 10) || 0;
    const penaltyCopyright = copyrightCount * 5;

    const otherRulesCount = parseInt(evals['c_2_2_penalty_other_rules']?.count, 10) || 0;
    const penaltyOtherRules = otherRulesCount * 5;

    const penaltyScore = penaltyCitizen + penaltyCopyright + penaltyOtherRules;

    const rawTotal = evalScore + bonusScore + specificScore - penaltyScore;
    const totalScore = Math.min(25, Math.max(0, rawTotal));
    const isCapped = rawTotal >= 25;

    return {
      partId: 2,
      maxScore: 25,
      evalScore,
      bonusScore,
      specificScore,
      penaltyScore,
      rawTotal,
      totalScore,
      isCapped,
      isLateEvaluation
    };
  }

  // --- TÍNH PHẦN 3 ---
  static calculatePart3(evals) {
    // 3.1
    const acts_3_1_a = evals['c_3_1_a']?.activities || [];
    const count_3_1_a = acts_3_1_a.length || (parseInt(evals['c_3_1_a']?.count, 10) || 0);
    const score_3_1_a = count_3_1_a * 2;

    const acts_3_1_b = evals['c_3_1_b']?.activities || [];
    const count_3_1_b = acts_3_1_b.length || (parseInt(evals['c_3_1_b']?.count, 10) || 0);
    const score_3_1_b = count_3_1_b * 3;

    const acts_3_1_c = evals['c_3_1_c']?.activities || [];
    const count_3_1_c = acts_3_1_c.length || (parseInt(evals['c_3_1_c']?.count, 10) || 0);
    const score_3_1_c = count_3_1_c * 3;

    const acts_3_1_d = evals['c_3_1_d']?.activities || [];
    const count_3_1_d = acts_3_1_d.length || (parseInt(evals['c_3_1_d']?.count, 10) || 0);
    const score_3_1_d = count_3_1_d * 2;

    const acts_3_1_e = evals['c_3_1_e']?.activities || [];
    const count_3_1_e = acts_3_1_e.length || (parseInt(evals['c_3_1_e']?.count, 10) || 0);
    const score_3_1_e = count_3_1_e * 3;

    const acts_3_1_f = evals['c_3_1_f']?.activities || [];
    const count_3_1_f = acts_3_1_f.length || (parseInt(evals['c_3_1_f']?.count, 10) || 0);
    const score_3_1_f = Math.min(3, count_3_1_f * 1);

    const sum_3_1 = score_3_1_a + score_3_1_b + score_3_1_c + score_3_1_d + score_3_1_e + score_3_1_f;
    const evalScore = Math.min(20, sum_3_1);

    // 3.2
    const isPartyMember = !!evals['c_3_2_party_member']?.checked;
    const score_party = isPartyMember ? 3 : 0;

    const isHealthyFaculty = !!evals['c_3_2_healthy_faculty']?.checked;
    const score_healthy_fac = isHealthyFaculty ? 1 : 0;

    const isHealthyUni = !!evals['c_3_2_healthy_uni']?.checked;
    const score_healthy_uni = isHealthyUni ? 2 : 0;

    const acts_consolation = evals['c_3_2_awards_consolation']?.activities || [];
    const count_consolation = acts_consolation.length || (parseInt(evals['c_3_2_awards_consolation']?.count, 10) || 0);
    const score_consolation = count_consolation * 1;

    const acts_top3 = evals['c_3_2_awards_top3']?.activities || [];
    const count_top3 = acts_top3.length || (parseInt(evals['c_3_2_awards_top3']?.count, 10) || 0);
    const score_top3 = count_top3 * 2;

    const acts_mobilization = evals['c_3_2_mobilization']?.activities || [];
    const count_mobilization = acts_mobilization.length || (parseInt(evals['c_3_2_mobilization']?.count, 10) || 0);
    const score_mobilization = count_mobilization * 2;

    const bonusScore = score_party + score_healthy_fac + score_healthy_uni + score_consolation + score_top3 + score_mobilization;

    const acts_specific_3 = evals['c_3_2_specific']?.activities || [];
    const count_specific_3 = acts_specific_3.length || (parseInt(evals['c_3_2_specific']?.count, 10) || 0);
    const specificScore = count_specific_3 * 3;

    const penaltyScore = parseFloat(evals['c_3_2_penalty']?.score) || 0;

    const rawTotal = evalScore + bonusScore + specificScore - penaltyScore;
    const totalScore = Math.min(20, Math.max(0, rawTotal));
    const isCapped = rawTotal >= 20;

    return {
      partId: 3,
      maxScore: 20,
      evalScore,
      bonusScore,
      specificScore,
      penaltyScore,
      rawTotal,
      totalScore,
      isCapped
    };
  }

  // --- TÍNH PHẦN 4 ---
  static calculatePart4(evals) {
    // 4.1.1, 4.1.2, 4.1.3
    const p_4_1_1 = evals['c_4_1_1']?.passed !== false;
    const score_4_1_1 = p_4_1_1 ? 5 : 0;

    const p_4_1_2 = evals['c_4_1_2']?.passed !== false;
    const score_4_1_2 = p_4_1_2 ? 5 : 0;

    const p_4_1_3 = evals['c_4_1_3']?.passed !== false;
    const score_4_1_3 = p_4_1_3 ? 5 : 0;

    // 4.1.4 đến 4.1.8
    const acts_lt5d_fac = evals['c_4_1_volunteer_lt5d_faculty']?.activities || [];
    const count_lt5d_fac = acts_lt5d_fac.length || (parseInt(evals['c_4_1_volunteer_lt5d_faculty']?.count, 10) || 0);
    const score_lt5d_fac = count_lt5d_fac * 2;

    const acts_lt5d_uni = evals['c_4_1_volunteer_lt5d_uni']?.activities || [];
    const count_lt5d_uni = acts_lt5d_uni.length || (parseInt(evals['c_4_1_volunteer_lt5d_uni']?.count, 10) || 0);
    const score_lt5d_uni = count_lt5d_uni * 3;

    const acts_gte5d = evals['c_4_1_volunteer_gte5d']?.activities || [];
    const count_gte5d = acts_gte5d.length || (parseInt(evals['c_4_1_volunteer_gte5d']?.count, 10) || 0);
    const score_gte5d = count_gte5d * 4;

    const acts_lead_vol = evals['c_4_1_lead_volunteer']?.activities || [];
    const count_lead_vol = acts_lead_vol.length || (parseInt(evals['c_4_1_lead_volunteer']?.count, 10) || 0);
    const score_lead_vol = count_lead_vol * 3;

    const acts_outside = evals['c_4_1_outside']?.activities || [];
    const count_outside = acts_outside.length || (parseInt(evals['c_4_1_outside']?.count, 10) || 0);
    const score_outside = Math.min(3, count_outside * 1);

    const sum_4_1 = score_4_1_1 + score_4_1_2 + score_4_1_3 + score_lt5d_fac + score_lt5d_uni + score_gte5d + score_lead_vol + score_outside;
    const evalScore = Math.min(25, sum_4_1);

    // 4.2 Thưởng, phạt & đặc thù
    const acts_blood = evals['c_4_2_blood_donation']?.activities || [];
    const count_blood = acts_blood.length || (parseInt(evals['c_4_2_blood_donation']?.count, 10) || 0);
    const score_blood = count_blood * 5;

    const acts_commend = evals['c_4_2_commendation']?.activities || [];
    const count_commend = acts_commend.length || (parseInt(evals['c_4_2_commendation']?.count, 10) || 0);
    const score_commend = count_commend * 3;

    const bonusScore = score_blood + score_commend;

    const acts_specific_4 = evals['c_4_2_specific']?.activities || [];
    const count_specific_4 = acts_specific_4.length || (parseInt(evals['c_4_2_specific']?.count, 10) || 0);
    const specificScore = count_specific_4 * 3;

    const penaltyScore = parseFloat(evals['c_4_2_penalty']?.score) || 0;

    const rawTotal = evalScore + bonusScore + specificScore - penaltyScore;
    const totalScore = Math.min(25, Math.max(0, rawTotal));
    const isCapped = rawTotal >= 25;

    return {
      partId: 4,
      maxScore: 25,
      evalScore,
      bonusScore,
      specificScore,
      penaltyScore,
      rawTotal,
      totalScore,
      isCapped
    };
  }

  // --- TÍNH PHẦN 5 ---
  static calculatePart5(evals, gpa10) {
    const roleState = evals['c_5_1_role'] || {};
    const roleGroup = roleState.group || 'none'; // 'A', 'B', 'C', 'D', 'none'
    const performance = roleState.performance || 'none'; // 'xuat_sac', 'tot', 'hoan_thanh', 'none'
    const classMemberMode = roleState.classMemberMode || 'all'; // 'all' (6đ), 'count' (1đ/HĐ max 6)
    const classActs = roleState.classActivities || [];
    const classActsCount = classActs.length || (parseInt(roleState.classActsCount, 10) || 0);

    let evalScore = 0;
    let isGpaBoosted = false;

    if (roleGroup === 'A') {
      if (performance === 'xuat_sac') evalScore = 8;
      else if (performance === 'tot') evalScore = 6;
      else if (performance === 'hoan_thanh') evalScore = 4;
    } else if (roleGroup === 'B') {
      if (performance === 'xuat_sac') {
        if (gpa10 >= 6.5) {
          evalScore = 8;
          isGpaBoosted = true;
        } else {
          evalScore = 6;
        }
      } else if (performance === 'tot') {
        evalScore = 4;
      } else if (performance === 'hoan_thanh') {
        evalScore = 2;
      }
    } else if (roleGroup === 'C') {
      if (performance === 'xuat_sac') {
        if (gpa10 >= 6.5) {
          evalScore = 6;
          isGpaBoosted = true;
        } else {
          evalScore = 4;
        }
      } else if (performance === 'tot') {
        evalScore = 2;
      } else if (performance === 'hoan_thanh') {
        evalScore = 1;
      }
    } else if (roleGroup === 'D') {
      if (classMemberMode === 'all') {
        evalScore = 6;
      } else if (classMemberMode === 'count') {
        evalScore = Math.min(6, classActsCount * 1);
      }
    }

    // 5.2 Thưởng, phạt & đặc thù
    const isSv5tFac = !!evals['c_5_2_sv5t_faculty']?.checked;
    const score_sv5t_fac = isSv5tFac ? 3 : 0;

    const isSv5tUni = !!evals['c_5_2_sv5t_uni_blouse']?.checked;
    const score_sv5t_uni = isSv5tUni ? 5 : 0;

    const acts_special = evals['c_5_2_special_award']?.activities || [];
    const count_special = acts_special.length || (parseInt(evals['c_5_2_special_award']?.count, 10) || 0);
    const score_special = count_special * 3;

    const bonusScore = score_sv5t_fac + score_sv5t_uni + score_special;

    const acts_specific_5 = evals['c_5_2_specific']?.activities || [];
    const count_specific_5 = acts_specific_5.length || (parseInt(evals['c_5_2_specific']?.count, 10) || 0);
    const specificScore = count_specific_5 * 3;

    const penaltyScore = parseFloat(evals['c_5_2_penalty']?.score) || 0;

    const rawTotal = evalScore + bonusScore + specificScore - penaltyScore;
    const totalScore = Math.min(10, Math.max(0, rawTotal));
    const isCapped = rawTotal >= 10;

    return {
      partId: 5,
      maxScore: 10,
      evalScore,
      bonusScore,
      specificScore,
      penaltyScore,
      rawTotal,
      totalScore,
      isCapped,
      isGpaBoosted,
      roleGroup,
      performance
    };
  }

  // --- XÁC ĐỊNH XẾP LOẠI & ÁP TRẦN KỶ LUẬT ---
  static determineRanking(score, { isSuspended, isLateEvaluation, discReprimandCount, discWarningCount }) {
    if (isSuspended || isLateEvaluation) {
      return {
        key: 'kem',
        name: 'Kém (Không đánh giá)',
        badgeClass: 'badge-kem',
        color: '#DC2626',
        isCappedByDiscipline: true,
        capReason: isSuspended ? 'Bị đình chỉ học' : 'Đánh giá rèn luyện trễ hạn'
      };
    }

    // Xếp loại tự nhiên theo điểm số
    let baseLevel = UMP_RANKING_LEVELS.find(r => score >= r.minScore && score <= r.maxScore) || UMP_RANKING_LEVELS[UMP_RANKING_LEVELS.length - 1];

    let finalLevel = { ...baseLevel };
    let isCappedByDiscipline = false;
    let capReason = null;

    // Quy định trần kỷ luật theo QĐ 1714:
    // 1. Cảnh cáo: Xếp loại tối đa chỉ được mức Trung bình
    if (discWarningCount > 0) {
      const tbLevel = UMP_RANKING_LEVELS.find(r => r.key === 'trung_binh');
      if (score >= 65) { // Nếu tự nhiên là Khá, Tốt hoặc Xuất sắc
        finalLevel = { ...tbLevel };
        isCappedByDiscipline = true;
        capReason = `Bị cảnh cáo (${discWarningCount} lần): Xếp loại tối đa chỉ được loại Trung bình (QĐ 1714).`;
      }
    } 
    // 2. Khiển trách: Xếp loại tối đa chỉ được mức Khá
    else if (discReprimandCount > 0) {
      const khaLevel = UMP_RANKING_LEVELS.find(r => r.key === 'kha');
      if (score >= 80) { // Nếu tự nhiên là Tốt hoặc Xuất sắc
        finalLevel = { ...khaLevel };
        isCappedByDiscipline = true;
        capReason = `Bị khiển trách (${discReprimandCount} lần): Xếp loại tối đa chỉ được loại Khá (QĐ 1714).`;
      }
    }

    return {
      ...finalLevel,
      baseRankName: baseLevel.name,
      isCappedByDiscipline,
      capReason
    };
  }

  // --- TÍNH KHOẢNG CÁCH MỐC MỤC TIÊU TIẾP THEO ---
  static calculateMilestone(currentScore, ranking) {
    if (ranking.key === 'xuat_sac') {
      return {
        targetName: 'Xuất sắc (Đã đạt tối đa)',
        targetScore: 100,
        remainingPoints: 0,
        percent: 100,
        message: 'Xuất sắc! Bạn đã đạt mức điểm tối đa loại Xuất sắc (>= 90 điểm).'
      };
    }

    if (currentScore < 50) {
      const gap = (50 - currentScore).toFixed(1);
      return {
        targetName: 'Trung bình (50đ)',
        targetScore: 50,
        remainingPoints: gap,
        percent: Math.min(100, Math.round((currentScore / 50) * 100)),
        message: `Còn thiếu ${gap} điểm để thoát loại Yếu/Kém (Mốc 50đ Trung bình).`
      };
    }

    if (currentScore < 65) {
      const gap = (65 - currentScore).toFixed(1);
      return {
        targetName: 'Khá (65đ)',
        targetScore: 65,
        remainingPoints: gap,
        percent: Math.min(100, Math.round(((currentScore - 50) / 15) * 100)),
        message: `Còn thiếu ${gap} điểm để đạt mức Khá (Mốc 65đ).`
      };
    }

    if (currentScore < 80) {
      const gap = (80 - currentScore).toFixed(1);
      return {
        targetName: 'Tốt (80đ - Chuẩn xét học bổng)',
        targetScore: 80,
        remainingPoints: gap,
        percent: Math.min(100, Math.round(((currentScore - 65) / 15) * 100)),
        message: `Còn thiếu ${gap} điểm để đạt loại TỐT (Chuẩn xét học bổng KKHT)!`
      };
    }

    if (currentScore < 90) {
      const gap = (90 - currentScore).toFixed(1);
      return {
        targetName: 'Xuất sắc (90đ)',
        targetScore: 90,
        remainingPoints: gap,
        percent: Math.min(100, Math.round(((currentScore - 80) / 10) * 100)),
        message: `Tuyệt vời! Chỉ còn thiếu ${gap} điểm để đạt mức XUẤT SẮC!`
      };
    }

    return {
      targetName: 'Xuất sắc',
      targetScore: 90,
      remainingPoints: 0,
      percent: 100,
      message: 'Đã hoàn thành xuất sắc mục tiêu rèn luyện!'
    };
  }

  // --- TÍNH TỔNG ĐIỂM CHO LỚP HOẶC KHOA (ĐỐI CHIẾU) ---
  static calculatePartyTotal(semesterData, partyKey, discPenaltyScore, isZeroScore) {
    if (isZeroScore) return 0;
    const evals = semesterData.evaluations || {};
    let hasAnyInput = false;
    let sum = 0;

    Object.keys(evals).forEach(k => {
      if (evals[k] && evals[k][partyKey] !== undefined && evals[k][partyKey] !== null && evals[k][partyKey] !== '') {
        const val = parseFloat(evals[k][partyKey]);
        if (!isNaN(val)) {
          hasAnyInput = true;
          sum += val;
        }
      }
    });

    if (!hasAnyInput) return null;
    return Math.max(0, Math.min(100, sum - discPenaltyScore));
  }
}
