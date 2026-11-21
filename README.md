# SỔ TAY THEO DÕI & TÍNH ĐIỂM RÈN LUYỆN UMP (QĐ 1714)
### Ứng dụng Web Single-Page Dành Cho Sinh Viên Đại Học Y Dược TP.HCM

> **Cơ sở pháp lý & Chuẩn biểu mẫu:**
> - **Biểu mẫu:** `BM.2026/CTSV/PĐGKQRL/29.1` (Phiếu đánh giá kết quả rèn luyện của người học được đào tạo trình độ đại học hệ chính quy).
> - **Căn cứ ban hành:** Quyết định số **1714/QĐ-ĐHYD** ngày 14 tháng 4 năm 2026 của Hiệu trưởng Đại học Y Dược Thành phố Hồ Chí Minh.

---

## 🌟 TỔNG QUAN ỨNG DỤNG

**Sổ tay Theo dõi & Tính Điểm Rèn Luyện UMP** là giải pháp phần mềm web hiện đại, hoàn chỉnh (Single-Page Web Application), được thiết kế chuyên biệt nhằm giải quyết triệt để khó khăn của sinh viên Y Dược trong việc:
1. **Ghi nhớ và lưu vết minh chứng** tất cả các hoạt động học thuật, tình nguyện, văn thể mỹ, hiến máu, NCKH đã tham gia trong suốt học kỳ.
2. **Tự động tính toán Điểm Rèn Luyện (ĐRL)** chính xác 100% theo đúng từng công thức trần, điểm thưởng, điểm phạt và điểm đặc thù ngành của Quyết định 1714.
3. **Cảnh báo sớm và định hướng mục tiêu:** Tự động xếp loại (Xuất sắc, Tốt, Khá, Trung bình, Yếu, Kém), tính toán khoảng cách điểm đến mốc mục tiêu học bổng (80đ Tốt / 90đ Xuất sắc), phát hiện các phần đã chạm trần tối đa để tránh lãng phí thời gian.
4. **Xuất và In phiếu ĐRL chuẩn mẫu hành chính:** Tự động sinh bản in A4 theo đúng định dạng văn bản hành chính 8 trang của Nhà trường, kèm theo **Phụ lục danh mục hoạt động & số giấy chứng nhận** để nộp Ban Cán sự lớp và Phòng CTSV.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY NHANH

Ứng dụng được lập trình thuần Frontend hiện đại, **hoàn toàn không có phụ thuộc phức tạp** và hỗ trợ 2 cách chạy mượt mà:

### Cách 1: Mở trực tiếp bằng trình duyệt (Không cần cài đặt)
Chỉ cần nhấp đúp vào tệp `index.html` trong thư mục dự án hoặc kéo thả vào bất kỳ trình duyệt nào (Chrome, Edge, Firefox, Safari). Toàn bộ dữ liệu được lưu cục bộ an toàn trong `LocalStorage` của trình duyệt.

### Cách 2: Khởi chạy bằng Node.js Server
```bash
# Khởi chạy server tĩnh siêu nhẹ (cổng 3000)
node server.js
```
Truy cập địa chỉ: [http://localhost:3000](http://localhost:3000)

---

## 💎 CÁC TÍNH NĂNG NỔI BẬT

### 1. Bố cục Desktop 2 cột Chuẩn Y Khoa
- **Bảng màu chủ đạo:** Xanh dương Y khoa (`#0B5ED7` / `#004A99`), Xanh nhạt nền thẻ (`#F0F6FF`), Trắng tinh khiết (`#FFFFFF`), Viền xám nhạt (`#E2E8F0`), Chữ xám đậm (`#1E293B`).
- **Thanh Header trên cùng:**
  - Bộ chọn Học kỳ (HK1, HK2, Hè) và Năm học (mặc định 2026–2027).
  - Nút **"Tạo học kỳ mới"** (cho phép nhân bản thông tin sinh viên sang kỳ mới).
  - Nút **"Xuất / In Phiếu ĐRL"** mở bản in ấn chuẩn mẫu công văn.
  - Bộ công cụ **Sao lưu / Khôi phục JSON** và nút **"Nạp mẫu Y Khoa"** để trải nghiệm ngay.
  - Đèn báo **"Đã lưu tự động"** với độ trễ tối ưu (debounce 400ms).
- **Cột Trái (Sticky Sidebar ~30%):**
  - **Thẻ thông tin sinh viên:** Họ tên, MSSV, Lớp, Khóa, Điểm trung bình học kỳ thang 10.
  - **Bảng Tổng hợp điểm động:** Hiển thị điểm số lớn trên thang 100, huy hiệu xếp loại tự động, thanh tiến trình trực quan và câu nhắc định hướng mốc mục tiêu.
  - **Bảng tóm tắt 5 phần:** Hiển thị `[Điểm thực đạt / Điểm tối đa]`, kèm huy hiệu màu cam cảnh báo khi phần nào đã **chạm trần tối đa** (tránh dồn quá nhiều hoạt động vào phần đã đầy điểm).
  - **Bộ lọc thông minh:** Lọc theo *"Tất cả mục"*, *"Đã đạt điểm (>0)"*, *"Chưa có điểm (0đ)"*, *"⭐ Dễ kiếm điểm"*, và thanh tìm kiếm từ khóa tức thì.
- **Cột Phải (Khu vực thao tác chính ~70%):**
  - 5 Phần lớn thiết kế dạng thẻ Accordion đóng mở mượt mà.
  - Bảng tiêu chí 6 cột:
    `[Nội dung & Quy định]` | `[Mức điểm quy định]` | `[Thao tác tích chọn / Sổ tay HĐ]` | `[SV tự chấm]` | `[Điểm Lớp]` | `[Điểm Khoa]`.

---

### 2. Tính năng "Sổ tay ghi nhớ hoạt động con" (Activity Notebook)
Khác với các công cụ nhập số khô khan, đối với các tiêu chí tính điểm theo số lượng hoạt động (1đ/HĐ, 2đ/HĐ, 3đ/HĐ, 5đ/HĐ...):
- Nút **"+ Thêm hoạt động"** sẽ mở danh sách thẻ hoạt động con ngay dưới tiêu chí.
- Cho phép lưu đầy đủ:
  - **Tên hoạt động / Sự kiện** (kèm danh mục gợi ý hoạt động đặc trưng UMP).
  - **Ngày tham gia** (bộ chọn lịch).
  - **Ghi chú minh chứng** (Số giấy chứng nhận, quyết định, link ảnh chứng nhận).
  - Nút xóa nhanh từng hoạt động.
- Hệ thống tự động đếm số lượng hoạt động thực tế để nhân hệ số điểm và áp trần quy định.

---

### 3. Logic Tính Điểm 100% Theo Quyết Định 1714/QĐ-ĐHYD

Công thức tính điểm cho từng Phần $i$ ($i = 1..5$):
$$\text{Tổng điểm Phần } i = \min\Big(\text{Điểm tối đa Phần } i, \, \max\big(0, \, \text{Đánh giá} + \text{Thưởng} + \text{Đặc thù} - \text{Trừ}\big)\Big)$$

#### 🔹 Phần 1: Ý thức tham gia học tập (Tối đa: 20 điểm)
- **1.1 Giờ giấc & số buổi vắng (Tối đa 2đ):** Đạt (+2đ) | Vi phạm lần 1 (0đ) | Vi phạm lần 2 trở đi (0đ và tự động cộng 2đ vào Điểm trừ Phần 1).
- **1.2 Hoạt động CLB học thuật, Kỹ năng, NCKH (Tối đa 6đ vào 1.2):**
  - Cấp Trường/Khoa: 1đ/HĐ.
  - Cấp ĐHYD TPHCM trở lên: 2đ/HĐ.
  - Ban Tổ chức / Ban Chủ nhiệm: 2đ/HĐ, CLB.
  - Ngoài trường được duyệt: 1đ/HĐ (tối đa 3đ).
  - **Cơ chế thưởng tự động:** Nếu tổng điểm thô đạt từ 10 điểm trở lên $\rightarrow$ Hệ thống tự động kích hoạt **+2 điểm thưởng** vào mục 1.5!
- **1.3 Ý thức thi cử (Tối đa 2đ):** Đạt (+2đ) | Vi phạm lần 1 (0đ) | Vi phạm lần 2 trở đi (0đ và trừ 2đ).
- **1.4 Kết quả học tập (Tối đa 10đ):** Dropdown chọn theo thang 4.0 (Xuất sắc: 10đ, Giỏi: 9đ, Khá: 7đ, TB: 5đ, Yếu: 2-3đ, Kém: 1đ).
- **1.5 Điểm thưởng, trừ & đặc thù:**
  - Giải Khuyến khích trở lên: +1đ/HĐ.
  - Đề tài cơ sở / Bài báo trong nước: +1đ/đề tài, bài báo.
  - Đề tài cấp TP, Bộ / Bài báo quốc tế: +2đ/đề tài, bài báo.
  - Tăng học lực so với HK trước: +2đ/1 bậc tăng.
  - Sinh viên vượt khó: +2đ.
  - Đặc thù ngành (học tập, NCKH): +3đ/HĐ.

#### 🔹 Phần 2: Ý thức chấp hành nội quy, quy chế (Tối đa: 25 điểm)
- **2.1 Bảy điều khoản ý thức cơ bản (Tối đa 25đ):** Mặc định tích sẵn **ĐẠT** để sinh viên không phải bấm nhiều lần:
  1. Đăng ký thông tin ngoại trú: 5đ (vi phạm 0đ).
  2. **Đánh giá ĐRL đúng thời hạn: 3đ (CẢNH BÁO ĐỎ: Vi phạm mục này khiến Tổng điểm ĐRL cả học kỳ = 0 điểm!).**
  3. Đóng học phí đúng hạn: 5đ (vi phạm 0đ).
  4. Trang phục chỉnh tề, đeo bảng tên: 3đ (vi phạm 0đ).
  5. Không nói tục, hút thuốc, rượu bia, đánh bài: 3đ (vi phạm 0đ).
  6. Bảo quản tài sản chung, giữ vệ sinh, bỏ rác đúng nơi: 3đ (vi phạm 0đ).
  7. Tôn trọng, lễ phép với Thầy Cô, cán bộ viên chức: 3đ (vi phạm 0đ).
- **2.2 Thưởng, trừ & đặc thù:**
  - Đội tự quản KTX, văn minh học đường, vệ sinh trường: +3đ/HĐ.
  - Khảo sát lấy ý kiến môn học/chương trình: +3đ/HĐ.
  - Khảo sát ĐBCL khác: +2đ/HĐ.
  - Điểm đặc thù: +3đ/HĐ.
  - Điểm trừ: Không học / không đạt Tuần SHCD (-10đ), Vi phạm bản quyền (-5đ/lần), Vi phạm nội quy khác (-5đ/lần).

#### 🔹 Phần 3: Hoạt động Chính trị, VH, VN, Thể thao, PCTP & TNXH (Tối đa: 20 điểm)
- **3.1 Tham gia hoạt động (Tối đa 20đ):** Cấp Trường/Khoa/Lớp (2đ/HĐ), Cấp ĐHYD TPHCM trở lên (3đ/HĐ), BTC/BCN (3đ/HĐ, CLB), Tuyên truyền PCTP & TNXH (2đ/HĐ), BTC tuyên truyền (3đ), Ngoài trường (1đ/HĐ, tối đa 3đ).
- **3.2 Thưởng, trừ & đặc thù:** Kết nạp Đảng / Đoàn viên ưu tú (+3đ), Sinh viên khỏe cấp Khoa (+1đ), Sinh viên khỏe cấp Trường (+2đ), Giải KK (+1đ/HĐ), Giải 3 trở lên (+2đ/HĐ), Huy động lực lượng dự Lễ (+2đ/HĐ), Điểm đặc thù (+3đ/HĐ).

#### 🔹 Phần 4: Ý thức công dân trong quan hệ cộng đồng (Tối đa: 25 điểm)
- **4.1 Ý thức & Hoạt động tình nguyện (Tối đa 25đ):**
  - 3 tiêu chí ý thức cơ bản (mặc định Đạt): Pháp luật (5đ), An toàn giao thông & ANTT (5đ), Đoàn kết giúp đỡ bạn bè (5đ).
  - Hoạt động công ích, CTXH < 5 ngày cấp Lớp/Khoa/Trường: 2đ/HĐ.
  - Hoạt động CTXH < 5 ngày cấp ĐHYD trở lên: 3đ/HĐ.
  - Hoạt động CTXH từ 5 ngày trở lên (Mùa hè xanh, Tiếp sức mùa thi...): 4đ/HĐ.
  - BTC/BCN tình nguyện: 3đ/HĐ, CLB; Ngoài trường: 1đ/HĐ (tối đa 3đ).
- **4.2 Thưởng, trừ & đặc thù:**
  - **Hiến máu nhân đạo: +5đ/HĐ** (kèm GCN).
  - Khen thưởng công tác xã hội: +3đ/HĐ.
  - Điểm đặc thù: +3đ/HĐ.

#### 🔹 Phần 5: Công tác Cán bộ lớp, Đoàn thể & Thành tích đặc biệt (Tối đa: 10 điểm)
- **5.1 Vai trò cán bộ lớp:**
  - **Nhóm A** (Đoàn-Hội cấp Trường/Khoa/ĐHYD): Xuất sắc (8đ), Tốt (6đ), Hoàn thành (4đ).
  - **Nhóm B** (Đoàn-Hội Lớp, Ban Cán sự lớp, CLB cấp Khoa):
    - Xuất sắc: 6đ — **TỰ ĐỘNG NÂNG LÊN 8đ nếu Điểm TB học kỳ (thang 10) $\ge$ 6.5!**
    - Tốt: 4đ, Hoàn thành: 2đ.
  - **Nhóm C** (Tổ trưởng, nhóm trưởng):
    - Xuất sắc: 4đ — **TỰ ĐỘNG NÂNG LÊN 6đ nếu Điểm TB học kỳ (thang 10) $\ge$ 6.5!**
    - Tốt: 2đ, Hoàn thành: 1đ.
  - **Nhóm D** (Thành viên của lớp): Tham gia đầy đủ HĐ lớp (6đ) HOẶC tính theo số HĐ đã tham gia (1đ/HĐ, tối đa 6đ).
- **5.2 Thưởng, trừ & đặc thù:** Danh hiệu SV 5 tốt cấp Khoa (+3đ), Tuyên dương ĐHYD trở lên / Blouse trắng (+5đ), Khen thưởng đặc biệt (+3đ/HĐ), Điểm đặc thù (+3đ/HĐ).

#### 🔹 Điểm trừ vi phạm kỷ luật CTSV toàn phiếu & Áp trần xếp loại:
- **Bị khiển trách:** Trừ 5 điểm/lần $\rightarrow$ **Xếp loại rèn luyện toàn học kỳ tối đa chỉ được mức KHÁ** (kể cả khi tổng điểm trên 80đ).
- **Bị cảnh cáo:** Trừ 10 điểm/lần $\rightarrow$ **Xếp loại rèn luyện toàn học kỳ tối đa chỉ được mức TRUNG BÌNH** (kể cả khi tổng điểm trên 65đ).
- **Bị đình chỉ học trở lên:** Tổng điểm ĐRL = 0 điểm (Không đánh giá kết quả rèn luyện).
- **Vi phạm nộp ĐRL trễ hạn (Mục 2.1.2):** Tổng điểm ĐRL = 0 điểm.

---

## 🖨️ XUẤT VÀ IN PHIẾU CHUẨN MẪU (BM.2026/CTSV/PĐGKQRL/29.1)

Khi bấm nút **"Xuất / In Phiếu ĐRL"** trên thanh Header:
1. Trình duyệt sẽ chuyển sang chế độ in chuẩn A4 (`@media print`).
2. Tự động ẩn toàn bộ giao diện điều khiển, nút bấm, sidebar.
3. Trình bày đầy đủ:
   - Quốc hiệu, Tiêu ngữ, Tên cơ quan chủ quản (Bộ Y Tế - Đại học Y Dược TP.HCM).
   - Mã biểu mẫu: `BM.2026/CTSV/PĐGKQRL/29.1` góc trên bên phải.
   - Tiêu đề Quyết định 1714/QĐ-ĐHYD ngày 14/4/2026.
   - Khung thông tin sinh viên, học kỳ, năm học.
   - Bảng điểm chi tiết 6 cột đầy đủ từng mục từ Trang 1 đến Trang 8 của văn bản chính thức.
   - Bảng tổng kết điểm tự đánh giá, điểm trừ kỷ luật, xếp loại rèn luyện.
   - Khung chữ ký 3 bên: Giáo viên chủ nhiệm / Nhân viên phụ trách khối, Sinh viên tự xếp loại, Hội đồng xét cấp khoa.
4. **Phụ lục minh chứng chi tiết:** Tự động tách sang trang mới, liệt kê bảng tổng hợp tất cả các hoạt động đã tham gia kèm ngày tháng và số quyết định / link minh chứng để sinh viên nộp kèm phiếu đánh giá.

---

## 📁 CẤU TRÚC MÃ NGUỒN

```
c:\Study/
├── index.html            # Giao diện Single-Page Application hoàn chỉnh
├── css/
│   └── ump-drl.css       # CSS chuẩn y khoa, hiệu ứng thẻ, cấu hình in ấn @media print
├── js/
│   ├── ump-drl-data.js   # Dữ liệu cấu hình tiêu chí chính thức theo BM.2026/CTSV/PĐGKQRL/29.1
│   ├── ump-drl-engine.js # Bộ máy tính điểm toán học, áp trần, thưởng/phạt và quy chế nâng điểm GPA
│   ├── ump-drl-storage.js# Quản trị LocalStorage, đa học kỳ, sao lưu & khôi phục tệp JSON
│   └── ump-drl-app.js    # Controller tương tác giao diện, sổ tay con, tìm kiếm, lọc & in ấn
├── server.js             # Server Node.js phục vụ tệp tĩnh (không phụ thuộc external library)
└── README.md             # Hướng dẫn sử dụng và tài liệu kỹ thuật chi tiết
```

---

## 🩺 BẢN QUYỀN & LỜI CẢM ƠN

Phần mềm được phát triển với tinh thần hỗ trợ cộng đồng sinh viên **Đại học Y Dược Thành phố Hồ Chí Minh (UMP)** quản lý rèn luyện một cách khoa học, tiết kiệm thời gian và đảm bảo tối đa quyền lợi học bổng, thi đua.
Chúc các bạn sinh viên UMP luôn đạt kết quả học tập và rèn luyện **Xuất sắc**!
