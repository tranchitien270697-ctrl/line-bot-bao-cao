# TÀI LIỆU BÀN GIAO — HỆ THỐNG BÁO CÁO BHX 5152-KẾ SÁCH

> File này lưu TOÀN BỘ quy trình, công thức, và trạng thái hệ thống. Bất kỳ ai (người hay AI) tiếp nhận công việc này chỉ cần đọc file này, không cần phụ thuộc lịch sử chat nào. **Cập nhật lần cuối: 03/10/2026.**

## 0. NGƯỜI DÙNG

- Tên: **Tiền**, quản lý cửa hàng Bách Hóa Xanh **5152-Kế Sách**
- Giao tiếp: tiếng Việt, giọng miền Tây, ngắn gọn
- KHÔNG tự test lệnh cron thật của bot (gửi tin thật lên nhóm LINE, tốn quota) — chỉ kiểm tra qua đọc code/cú pháp. Tính năng MỚI vừa code thì PHẢI tự test trước khi báo Tiền.
- Tiền gửi file nhiều đợt trong ngày (sáng/trưa/chiều/tối) → xử lý ngay theo mẫu dưới đây, KHÔNG hỏi lại cách làm mỗi lần.

### Quy tắc hỗ trợ chung (Tiền yêu cầu rõ 03/10/2026)
1. KHÔNG tự đoán khi chưa có công thức rõ (hao hụt theo Fresh/FMCG, hãng bánh mới, SP đổi tên...) — báo rõ "chưa có công thức, cần Tiền xác nhận" thay vì tự bịa cách tính.
2. Nói rõ cái gì làm được / cái gì bị chặn NGAY khi gặp, không bỏ lửng để Tiền phải đoán tiến độ.
3. Trước khi báo "bất thường/lỗi" cho Tiền, tự tính lại bằng cách khác 1 lần cho chắc — tránh báo động nhầm (đã từng báo nhầm: tưởng số liệu sai nhưng thực ra đúng vì mới tới giờ đó trong ngày, hoặc đang mùa cao điểm nên số cao bất thường nhưng vẫn đúng).
4. Luôn xác nhận lại bằng số liệu thật trên web/API sau khi làm xong — không chỉ tin "code đúng là xong".
5. Nếu có AI/phiên khác cùng thao tác song song trên hệ thống — xác nhận ai nạp dữ liệu chính trước khi làm, tránh ghi đè lẫn nhau (đã xảy ra 1 lần 23/09/2026).

## 1. THÔNG TIN HỆ THỐNG

- LINE OA: @475gyvca, tên hiển thị "Kế sách" (lịch sử: TIỀN_130452_BOT → Tiền_AI → Kế sách)
- Render: srv-d9s54rnavr4c73ag1gkg → https://line-bot-bao-cao.onrender.com
- GitHub: tranchitien270697-ctrl/line-bot-bao-cao (branch: main)
- CRON_SECRET: kesach2026secret
- TARGET_GROUP_ID: Cf36a100a627b9eafdd7c5e87fe3a88a6
- Google Sheet ID: 1FW2LiSi5kBIPUSYVl3lDk1mdyOsCvAxWX3uvkK-0Xl8
- Apps Script exec URL: https://script.google.com/macros/s/AKfycbyqNeDQZrIc5c2yqw0K62PEz4Elkyy7n4A5jeKOya2B_alL1M9Ms_ZiqEpR-O-aVzjAyg/exec
- Apps Script edit URL: https://script.google.com/home/projects/1wGncV14JfrTO647rsvEZX9oq3RoLjHcWvZjagtgrlFRn-Ri9WhNd97S5/edit (bản 28)
- Lệnh LINE bot có sẵn (KHÔNG tự gọi thử): "báo cáo" → thẻ doanh thu dự kiến cả tháng (FMCG/FRESH); "doanh thu hiện tại" → thẻ doanh thu ngày gần nhất (Online/Offline, đã VAT, có giờ tạo)

## 2. QUY TRÌNH NẠP DỮ LIỆU (mỗi lần Tiền gửi file)

### Nguyên tắc chung — GHI ĐÈ, không cộng dồn, và LUÔN KIỂM TRA SỐ NGÀY TRONG FILE
Mỗi ngày Tiền gửi file nhiều đợt — mỗi đợt GHI ĐÈ toàn bộ số liệu ngày đó (không cộng dồn), vì siêu thị tiếp tục đồng bộ dữ liệu suốt ngày. Luôn dùng số liệu của ĐỢT GẦN NHẤT làm chuẩn.

**QUAN TRỌNG**: file có thể là "chỉ 1 ngày mới nhất" HOẶC "xuất lại nhiều ngày/cả tháng" — LUÔN kiểm tra distinct dates trong file trước khi xử lý (không giả định cố định 1 kiểu). Nếu file có nhiều ngày, áp dụng ghi đè cho TỪNG ngày có trong file.

### A. File "Doanh Thu Chi Tiết" (.xlsx)
- Cột dùng để tính tiền: **`Thành tiền phải thu khách hàng (chưa VAT)`** — BẮT BUỘC, đã tự trừ nhập trả. KHÔNG dùng cột "chưa trừ nhập trả".
- **Luôn tìm cột theo TÊN HEADER, không hardcode số thứ tự cột** — thứ tự cột có thể lệch giữa các lần xuất file (đã có lần cột đúng là index 22 chứ không phải 21 như từng ghi nhầm). Build dict tên→index rồi tra theo tên.
- Tính: tổng theo `Ngành hàng`, top50 sản phẩm theo `Mã sản phẩm`, Fresh theo `Nhóm hàng` (chỉ 4 ngành: Thịt gia cầm gia súc, Thủy Hải Sản, Rau Củ, Trái Cây — Trứng đã nằm trong nhóm Rau Củ nên không cần thêm riêng; Đông lạnh tính ngành riêng, không gộp Fresh).
- Action: `revenue_save_bulk` (POST, nhiều ngày 1 lần), `revenue_products_save_bulk`, `nhomhang_save_bulk`.

### B. Bánh Trung Thu — ĐÃ HẾT MÙA (chốt 25/09/2026)
**Từ 26/09/2026 trở đi: KHÔNG full-scan/lọc/push mooncake_save_bulk nữa** khi xử lý file doanh thu hằng ngày, trừ khi Tiền yêu cầu lại (mùa sau, khoảng tháng 8-9 âm lịch năm sau).

Quy trình cũ (tham khảo nếu mùa sau cần làm lại):
- Full-scan toàn bộ file gốc (không dùng top50). Điều kiện nhận diện: `'TRUNG THU' in tên.upper()` HOẶC (ngành "Bánh kẹo..." + tên có "HỘP"/"GIỎ" + thương hiệu KINH ĐÔ/RICHY/KIDO/MAISON/PHÚC AN/HỮU NGHỊ/THỌ PHÁT/UMIKI — danh sách này KHÔNG đầy đủ, luôn rà thêm).
- Tách riêng đơn vị "Cái" và "Hộp"/"Giỏ"/"Bộ" — không cộng chung.
- Tồn kho tự trừ theo bán ra: mốc gốc lưu `date: "STOCK:YYYY-MM-DD"` kèm `asOf`; mất mát lưu riêng `date: "LOSS:YYYY-MM-DD"`.
- Dead code không dùng: sheet "MooncakeStock" + action mooncake_stock_save_bulk/mooncake_stock_list + route /api/mooncake-stock (đã bỏ, đừng dùng lại).

### B2. Thẻ "Nước giặt 888" và thẻ "Nấm" (card trên trang chủ web, dùng quanh năm)
- **Nước giặt 888**: bộ lọc cứng "NƯỚC GIẶT"+"888" trong tên — **LOẠI TRỪ combo/bộ** (tên bắt đầu "BỘ" hoặc chứa "BỘ 3"/"BỘ3", ví dụ "BỘ 3:NƯỚC GIẶT + LAU SÀN + RỬA CHÉN 888" KHÔNG tính). **Đơn vị tính là "túi"** (không phải "cái" — Tiền đã sửa lại khi phát hiện báo cáo tháng 9 ghi nhầm). Có SP mới/đổi bao bì thì phải hỏi Tiền để cập nhật bộ lọc, không tự đoán.
- **Thẻ Nấm** (thay thẻ Hạt Nêm Natafood từ 05/10/2026, theo yêu cầu Tiền): hiện doanh thu nhóm hàng "Nấm Các Loại" (nằm trong ngành Rau Củ) — hôm nay + lũy kế tháng. KHÔNG cần nạp riêng: dữ liệu lấy từ số Fresh `nhomhang_save_bulk` đã nạp hằng ngày (route /api/nhomhang-fresh, tìm item có tên bắt đầu "Nấm"). **Từ 05/10/2026 KHÔNG còn nạp Natafood** (product_natafood_save_bulk không dùng nữa, bỏ qua hạt nêm khi xử lý file). Hàm renderMushroomHome(), id mushroomQuickCol (đúng slot cũ của thẻ Natafood/Bánh Trung Thu).

### C. File "Báo cáo lượt bill" (.xlsx)
- Cột: `row[2]`=số bill, `row[4]`=ngày (dd/mm/yyyy). Cột tổng tiền (VAT) KHÔNG DÙNG — xem mục D.
- **CẢNH BÁO: luôn kiểm tra file có bị LẶP DÒNG không trước khi tin số liệu** (đã phát hiện 02/10/2026: file bị lặp đúng x2 toàn bộ dòng, nếu cộng thẳng ra bill ảo gấp đôi). Cách check: dedupe theo (mã siêu thị, tên siêu thị, lượt bill, tổng tiền VAT, ngày xuất), so sánh sum trước/sau dedupe. Áp dụng MỌI lần xử lý file này — 2 file (doanh thu + bill) có thể lỗi độc lập nhau, không suy luận file này ổn vì file kia ổn.
- `bill_save_bulk` CHỈ update khi có file BC Lượt Bill mới đi kèm — nếu chỉ có file doanh thu một mình thì KHÔNG tự suy avg mới (ra avg ảo), giữ nguyên bill cũ chờ file bill.

### D. Công thức `total`/`avg` trong bill_save_bulk (từ 21/09/2026)
- `total` = doanh thu thật (chưa VAT, cộng tổng `industries.t` từ mục A) — KHÔNG dùng số VAT trong file bill (bị sai/không nhất quán).
- `avg = round(total/bills)`. Field `bills` (số lượt, đã dedupe) vẫn lấy từ file gốc.
- Tháng 1-8/2026 giữ nguyên công thức cũ (total=VAT file bill) vì không có dữ liệu doanh thu cũ để tính lại.

### E. File "Giờ công làm việc" (.xlsx)
- File này có thể là bản "CHỈ 1 NGÀY MỚI" (mỗi NV 1 dòng) hoặc "XUẤT LẠI TOÀN THÁNG" (nhiều dòng/nhiều ngày mỗi NV) — LUÔN kiểm tra số dòng/ngày distinct trước khi quyết định cách cộng.
- Cách xử lý chuẩn: GET `hours_list` (lọc theo `month`) lấy tổng hiện có, chỉ lấy dòng của NGÀY MỚI NHẤT trong file (ngày chưa có trong kết quả GET) cộng vào totalHours+days theo mã NV, gửi lại toàn bộ qua `hours_save_bulk`.
- Nhân viên KHÔNG có mặt trong file ngày đó → giữ số cũ, không cộng.
- **Sang tháng mới, giờ công KHÔNG kế thừa từ tháng trước** — API trống khi đổi tháng, phải nạp lại từ đầu (ngày 1 = totalHours trong ngày, days=1).
- Cột: `row[0]`=ngày, `row[3]`=mã NV, `row[4]`=tên NV, `row[9]`=giờ công ngày đó.

### F. File "Mất mát/hao hụt/hủy/kiểm kê" (.xlsx)
- Công thức: với mỗi sản phẩm, `qty` = SL hủy tồn + SL hủy hao hụt NCC + SL mất mát kiểm kê (cộng cả 3 cột — cột mất mát kiểm kê có thể ÂM nếu kiểm kê dư). Gộp theo (Ngành hàng, Tên sản phẩm) trong ngày, bỏ qua SP có tổng = 0 (không chỉ lọc >0, lấy != 0).
- Giữ nguyên precision 4 chữ số thập phân cho qty/total (KHÔNG làm tròn số nguyên) — sản phẩm cân ký (rau củ...) có số lẻ thật.
- Payload: `{date, total, products:[{ind,n,qty}], freshAmt:0, fmcgAmt:0}` — 2 field freshAmt/fmcgAmt luôn để 0 (chưa có công thức tính tiền hao hụt, web không hiển thị, chỉ làm nếu có yêu cầu cụ thể sau này).
- Đây cũng theo mẫu ghi đè theo ngày — lần sau có thể đầy đủ hơn cho cả ngày hôm trước (đã gặp nhiều lần: SL tăng lên khi có bản đầy đủ hơn).

## 3. CÁC ACTION APPS SCRIPT SẴN CÓ
- `revenue_save` (1 ngày) / `revenue_save_bulk` (nhiều ngày)
- `revenue_products_save_bulk`, `nhomhang_save_bulk`, `bill_save_bulk`
- `hours_save_bulk` (POST) / `hours_list` (GET, filter theo `month`)
- `loss_save_bulk`, `mooncake_save_bulk` (hết mùa, xem mục B) / `mooncake_list` (GET)
- `product_888_save_bulk` / `product_888_list` (GET) — Nước giặt 888
- `product_natafood_save_bulk` / `product_natafood_list` (GET) — Hạt Nêm Natafood (KHÔNG còn dùng từ 05/10/2026)
- `revenue_industries_list` (GET) — nhiều ngày gần nhất, lọc đúng theo ngày thật (không dựa vị trí dòng)
- `revenue_products` (GET, cần `date`) — top sản phẩm 1 ngày

## 4. KỸ THUẬT — TRÁNH GÕ LẠI TEXT TIẾNG VIỆT DÀI QUA TOOL CALL

Rủi ro đã gặp nhiều lần: gõ lại chuỗi text tiếng Việt dài qua javascript_exec dễ sai lệch 1-2 ký tự (dấu, unicode vỡ) dù file nguồn Python đã đúng — lỗi xảy ra ở BƯỚC GÕ LẠI, không phải dữ liệu gốc.

**Kỹ thuật khuyến nghị**: tạo file JSON payload bằng Python, lưu vào thư mục scratchpad của phiên, dùng file_upload gắn vào 1 `input[type=file]` chèn tạm vào trang web (vd script.google.com), đọc bằng `FileReader.readAsText`, fetch POST thẳng lên Apps Script. Hoàn toàn không cần gõ lại nội dung → không còn rủi ro sai ký tự. Dùng cách này cho mọi payload có nhiều tiếng Việt/dài.

Nếu không dùng được cách trên: sau mỗi lần push text tiếng Việt dài, PHẢI GET lại dữ liệu live và so sánh bằng hash (polynomial hash tính song song Python/JS) với danh sách đúng từ file gốc để định vị chính xác chỗ sai.

## 5. QUY TRÌNH DEPLOY
1. Sửa `public/tracking.html` hoặc `server.js` trên GitHub web — dùng `document.querySelector('.cm-content').cmTile.view` để sửa CodeMirror qua JS (str_replace theo anchor text, KHÔNG gõ lại tay toàn bộ).
2. Kiểm tra cú pháp bằng `new Function(code)` TRƯỚC KHI commit.
3. Commit trên GitHub → Render Dashboard (srv-d9s54rnavr4c73ag1gkg) → Manual Deploy → Deploy latest commit → đợi "Your service is live".
4. Sửa Apps Script: Monaco editor → Ctrl+S → "Triển khai" → "Quản lý tùy chọn triển khai" → bút chì → dropdown "Phiên bản" → "Phiên bản mới" → "Triển khai".
5. LUÔN xác nhận lại bằng số liệu thật trên web sau khi deploy.

## 6. RỦI RO ĐÃ GẶP — TRÁNH LẶP LẠI
- **Element HTML bị mất khi sửa code bằng str_replace**: sửa 1 chỗ có thể vô tình xóa mất div/dòng gần đó mà không báo lỗi. Sau mỗi lần sửa, kiểm tra các phần liên quan gần đó còn nguyên vẹn.
- **Nhiều AI/phiên cùng thao tác song song**: xác nhận ai nạp dữ liệu chính trước khi làm.
- **File lặp dòng** (mục C): luôn dedupe trước khi tin số liệu bill.
- **Báo lỗi nhầm**: trước khi báo "bất thường", tự tính lại bằng cách khác 1 lần.

## 7. TRẠNG THÁI DỮ LIỆU — XEM TRỰC TIẾP TRÊN WEB
Không ghi số cố định ở đây (lỗi thời ngay) — xem https://line-bot-bao-cao.onrender.com/tracking để biết số liệu mới nhất. Gọi GET `/api/revenue`, `/api/hours?month=YYYY-MM`, `/api/product-888`, `/api/product-natafood` để lấy số liệu thô.

Mốc quan trọng: tháng 9/2026 đã chốt đủ 30 ngày (tổng 3.239.885.084đ, 21.492 bill). Tháng 10/2026 bắt đầu nạp lại từ đầu (doanh thu tiếp nối bình thường, riêng giờ công KHÔNG kế thừa tháng 9, phải nạp lại từ ngày 1).

## 8. VIỆC KHÁC LIÊN QUAN
- Bảng "Điểm Danh Các Shop - Hằng Ngày": Google Sheet riêng cho nhiều shop khu vực Sóc Trăng tự điền dữ liệu hằng ngày. Vướng: tài khoản Google tranchitien270697@gmail.com bị hạn chế tính năng "Chia sẻ", cần Tiền tự xác minh tài khoản trước.
- Web app theo dõi xe giao hàng: tài xế chia sẻ GPS, quản lý cần mã 130452 xem danh sách xe, tra cứu KH theo SĐT (giới hạn 20 KH gần nhất, che 3 số đầu). Tọa độ siêu thị khóa cứng: 9.768855, 105.987309.

## 9. VIỆC CÒN DANG DỞ
- Camera Imou — chưa làm.
- Lịch vệ sinh (mục "Báo cáo khác" trên web) — mới có placeholder, chưa có nội dung phân công thật.
