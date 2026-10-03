# TÀI LIỆU BÀN GIAO — HỆ THỐNG BÁO CÁO BHX 5152-KẾ SÁCH

> File này lưu TOÀN BỘ quy trình, công thức, và trạng thái hệ thống. Bất kỳ ai (người hay AI) tiếp nhận công việc này chỉ cần đọc file này, không cần phụ thuộc lịch sử chat nào.

## 0. NGƯỜI DÙNG

- Tên: **Tiền**, quản lý cửa hàng Bách Hóa Xanh **5152-Kế Sách**
- Giao tiếp: tiếng Việt, giọng miền Tây, ngắn gọn
- KHÔNG tự test lệnh cron thật của bot (gửi tin thật lên nhóm LINE, tốn quota) — chỉ kiểm tra qua đọc code/cú pháp. Tính năng MỚI vừa code thì PHẢI tự test trước khi báo Tiền.
- Buổi sáng Tiền gửi file → xử lý ngay theo đúng mẫu đã thống nhất dưới đây, KHÔNG hỏi lại cách làm mỗi lần.

## 1. THÔNG TIN HỆ THỐNG

- LINE OA: @475gyvca, tên hiển thị "Kế sách"
- Render: srv-d9s54rnavr4c73ag1gkg → https://line-bot-bao-cao.onrender.com
- GitHub: tranchitien270697-ctrl/line-bot-bao-cao (branch: main)
- CRON_SECRET: kesach2026secret
- TARGET_GROUP_ID: Cf36a100a627b9eafdd7c5e87fe3a88a6
- Google Sheet ID: 1FW2LiSi5kBIPUSYVl3lDk1mdyOsCvAxWX3uvkK-0Xl8
- Apps Script exec URL: https://script.google.com/macros/s/AKfycbyqNeDQZrIc5c2yqw0K62PEz4Elkyy7n4A5jeKOya2B_alL1M9Ms_ZiqEpR-O-aVzjAyg/exec
- Apps Script edit URL: https://script.google.com/home/projects/1wGncV14JfrTO647rsvEZX9oq3RoLjHcWvZjagtgrlFRn-Ri9WhNd97S5/edit

## 2. QUY TRÌNH NẠP DỮ LIỆU (mỗi lần Tiền gửi file)

### A. File "Doanh Thu Chi Tiết" (.xlsx)
- Cột dùng để tính tiền: **`Thành tiền phải thu khách hàng (chưa VAT)`** — BẮT BUỘC, đã tự trừ nhập trả. KHÔNG dùng cột "chưa trừ nhập trả" (gây sai lệch với số khu vực báo).
- Tính: tổng theo `Ngành hàng`, top50 sản phẩm theo `Mã sản phẩm`, Fresh theo `Nhóm hàng` (chỉ 4 ngành: Thịt gia cầm gia súc, Thủy Hải Sản, Rau Củ, Trái Cây — Trứng đã nằm trong nhóm Rau Củ nên không cần thêm riêng).
- Action: `revenue_save_bulk` (POST), `revenue_products_save_bulk`, `nhomhang_save_bulk`.
- Nhiều lần gửi file cùng 1 ngày trong ngày → GHI ĐÈ, không cộng dồn (file sau luôn đầy đủ hơn).

### B. Bánh Trung Thu — làm đúng mỗi lần, mùa cao điểm tới 27/9 hàng năm
- LUÔN full-scan toàn bộ file gốc (KHÔNG dùng top50 — sản phẩm giá trị nhỏ dễ lọt top50 nhưng vẫn phải tính).
- Điều kiện nhận diện:
```
'TRUNG THU' in tên.upper()
HOẶC (Ngành hàng == 'Bánh kẹo - Trà - Cà phê - Bột Dinh Dưỡng các loại'
      AND ('HỘP' in tên.upper() OR 'GIỎ' in tên.upper())
      AND tên chứa 1 trong: KINH ĐÔ, RICHY, KIDO, MAISON, PHÚC AN, HỮU NGHỊ, THỌ PHÁT, UMIKI)
```
  (danh sách thương hiệu KHÔNG đầy đủ — chỉ là các hãng đã gặp. Mỗi lần full-scan nên rà thêm: liệt kê mọi SP ngành "Bánh kẹo..." có chữ "Hộp"/"Giỏ" để bắt hãng mới.)
- TÁCH RIÊNG đơn vị "Cái" và "Hộp"/"Giỏ"/"Bộ" — TUYỆT ĐỐI không cộng chung (1 hộp ≠ 1 cái).
- Lưu qua `mooncake_save_bulk`: `{date: "YYYY-MM-DD", items: [{n, qty, amount, unit}]}`.
- Tồn kho tự động (đã code sẵn trên web): gốc 783 SP chốt 12:30 ngày 15/09/2026, lưu với `date: "STOCK:2026-09-15"` kèm field `asOf`. Web tự trừ bán ra + hao hụt từ ngày đó.
- Nếu file mất mát có bánh trung thu → lưu thêm bản ghi `date: "LOSS:YYYY-MM-DD"` vào MoonCake sheet để web tự trừ vào tồn kho.

### C. File "Báo cáo lượt bill" (.xlsx)
- Cột: `row[2]`=số bill, `row[3]`=tổng tiền (KHÔNG DÙNG — xem dưới), `row[4]`=ngày (dd/mm/yyyy).
- **Từ 21/09/2026**: `total` và `avg` trong `bill_save_bulk` KHÔNG lấy số VAT trong file bill nữa (bị sai/không nhất quán) — mà lấy `total` = doanh thu thật (tổng `industries.t` từ mục A), `avg = round(total/bills)`. Chỉ field `bills` (số lượt) lấy từ file gốc.
- Tháng 1-8/2026 giữ nguyên công thức cũ (total=VAT file bill) vì không có dữ liệu doanh thu cũ để tính lại.

### D. File "Giờ công làm việc" (.xlsx)
- GET `hours_list` lấy tổng hiện có (`month=='2026-09'` hoặc tháng tương ứng), CỘNG THÊM giờ+ngày mới vào từng người, gửi lại toàn bộ qua `hours_save_bulk`.
- Nhân viên KHÔNG có mặt trong file ngày đó → giữ số cũ, không cộng.
- Cột: `row[0]`=ngày, `row[3]`=mã NV, `row[4]`=tên NV, `row[9]`=giờ công ngày đó.

### E. File "Mất mát/hao hụt/hủy/kiểm kê" (.xlsx)
- Cột: `row[0]`=ngày, `row[7]`=tên SP, `row[8]`=ngành hàng, `row[27]`=SL mất.
- Kiểm kê dư (SL dư) GỘP CHUNG vào `loss_save_bulk`, không tách bảng riêng — lấy SL dư ghi số ÂM trong cùng mảng `products`, lấy SL != 0 (không chỉ > 0).
- Gửi qua `loss_save_bulk`: `{date, total, products:[{n,qty,ind}], freshAmt:0, fmcgAmt:0}` (2 field freshAmt/fmcgAmt luôn để 0 — chưa có công thức tính tiền hao hụt, web cũng không hiển thị, chỉ làm nếu có yêu cầu cụ thể).
- Nhớ kiểm tra riêng có bánh trung thu không (mục B) → lưu thêm `LOSS:` record nếu có.

## 3. CÁC ACTION APPS SCRIPT SẴN CÓ
- `revenue_save` (1 ngày) / `revenue_save_bulk` (nhiều ngày)
- `revenue_products_save_bulk`, `nhomhang_save_bulk`, `bill_save_bulk`
- `hours_save_bulk` (POST) / `hours_list` (GET)
- `loss_save_bulk`, `mooncake_save_bulk` / `mooncake_list` (GET)
- `revenue_industries_list` (GET) — 65 ngày gần nhất, lọc đúng theo ngày thật (KHÔNG dựa vị trí dòng — đã từng bị bug do demo data chen giữa)
- `revenue_products` (GET, cần `date`) — top sản phẩm 1 ngày, tối ưu 2 bước (đọc cột ngày trước, rồi mới đọc dòng cần)

## 4. QUY TRÌNH DEPLOY
1. Sửa `public/tracking.html` hoặc `server.js` trên GitHub web — dùng `document.querySelector('.cm-content').cmTile.view` để lấy/sửa nội dung CodeMirror qua JS (str_replace theo anchor text, KHÔNG gõ lại tay toàn bộ để tránh lỗi ký tự).
2. Kiểm tra cú pháp bằng `new Function(code)` TRƯỚC KHI commit.
3. Commit trên GitHub.
4. Render Dashboard (srv-d9s54rnavr4c73ag1gkg) → Manual Deploy → Deploy latest commit → đợi "Your service is live".
5. Nếu sửa Apps Script: mở project → sửa trong Monaco editor → Ctrl+S → nút "Triển khai" → "Quản lý tùy chọn triển khai" → bút chì (Chỉnh sửa) → dropdown "Phiên bản" → "Phiên bản mới" → nút "Triển khai".
6. LUÔN xác nhận lại bằng số liệu thật trên web sau khi deploy — không chỉ tin code đúng là xong.

## 5. RỦI RO ĐÃ GẶP — TRÁNH LẶP LẠI

- **Gõ lại chuỗi tiếng Việt dài**: dễ lệch 1-2 ký tự (dấu, unicode) dù file gốc đúng — lỗi xảy ra lúc gõ vào tool call, không phải do dữ liệu. Sau mỗi lần đẩy dữ liệu tiếng Việt dài, GET lại dữ liệu vừa lưu và so sánh với file gốc.
- **Element HTML bị mất khi sửa code bằng str_replace**: đã xảy ra NHIỀU LẦN — sửa 1 chỗ bằng cách thay thế đoạn text có thể vô tình xóa mất div/dòng gần đó mà không báo lỗi (chạy ngầm, không hiện gì trên web). Sau mỗi lần sửa, luôn kiểm tra các phần liên quan gần đó còn nguyên vẹn, không chỉ kiểm tra đúng chỗ vừa sửa.
- **Nhiều AI/phiên cùng thao tác song song**: đã xảy ra 1 lần bị ghi đè dữ liệu doanh thu ngay sau khi vừa lưu (23/09/2026). TRƯỚC KHI NẠP DỮ LIỆU, xác nhận không có ai khác đang thao tác cùng lúc trên cùng ngày.
- **Số liệu vẫn "sai" dù công thức đúng**: trước khi báo "lỗi"/"bất thường", luôn tự tính lại bằng tay/script để xác nhận — nhiều lần "bất thường" hóa ra là số đúng (VD: 82 cái bánh trung thu 1 ngày cao điểm — nghe nhiều nhưng cộng lại đúng).

## 6. VIỆC CHƯA CÓ CÔNG THỨC — ĐỪNG TỰ SUY ĐOÁN
- `freshAmt`/`fmcgAmt` trong mất mát: chưa có công thức, để 0.
- Danh sách thương hiệu bánh trung thu: không đầy đủ, luôn rà thêm.
- Bộ lọc "Nước giặt 888": chỉ bắt cứng "NƯỚC GIẶT"+"888" — có SP mới/đổi bao bì thì báo Tiền để cập nhật, không tự đoán.
- "Đọc nhanh" (2 ngành tăng + 2 ngành giảm mạnh nhất): cố định, không đổi trừ khi Tiền yêu cầu.

## 7. TRẠNG THÁI DỮ LIỆU (cập nhật lần cuối: xem ngày sửa file này trên GitHub)
Xem trực tiếp trên web https://line-bot-bao-cao.onrender.com/tracking để biết số liệu mới nhất — không ghi số cố định ở đây vì sẽ lỗi thời ngay.

## 8. VIỆC KHÁC LIÊN QUAN (có thể chưa cần đụng tới)
- Bảng "Điểm Danh Các Shop - Hằng Ngày": Google Sheet riêng cho nhiều shop khu vực Sóc Trăng tự điền dữ liệu hằng ngày. Vướng: tài khoản Google tranchitien270697@gmail.com bị hạn chế tính năng "Chia sẻ" vì bảo mật, cần Tiền tự xác minh tài khoản trước.
- Web app theo dõi xe giao hàng (tài xế chia sẻ vị trí, tra cứu khách theo SĐT) — gắn chung server này.

## 9. VIỆC CÒN DANG DỞ
- Camera Imou — chưa làm.
- Lịch vệ sinh (mục "Báo cáo khác" trên web) — mới có placeholder, chưa có nội dung phân công thật.
