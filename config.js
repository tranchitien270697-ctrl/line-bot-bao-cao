// config.js
module.exports = {
    TRIGGER_KEYWORD: 'báo cáo',
    ACTUAL_KEYWORD: 'doanh thu hiện tại',

    FRESH_INDUSTRIES: ['Rau Củ Quả CL', 'Cá (Hải sản)', 'Thịt', 'Trứng', 'Trái cây'],

    DAYS_IN_TARGET_MONTH: 31,

    LABEL_PREV_MONTH: 'Tháng 7',
    LABEL_CURR_MONTH: 'Tháng 8 (dự kiến)',

    GOOGLE_SHEET_ID: '1wQlsrIsXTAwWByZwmfOs3f4Hsuh9TmLdWHg_1ECMttE',

    TAB_GIDS: {
          revenuePrevMonth: '0',
          revenueCurrMonth: '1560618412',
          volumePrevMonth: '1085666896',
          volumeCurrMonth: '594018980',
    },

    TARGET_GROUP_ID: 'Cf36a100a627b9eafdd7c5e87fe3a88a6',
    CRON_SECRET: 'kesach2026secret',
    SCHEDULED_MESSAGES: {
                  '1': 'Chào ngày mới Anh Chị, Chúc Anh Chị làm việc vui vẻ !\nNhớ Selfie đúng giờ nhé !',
          '2': 'Mình nhớ báo cáo Nhập Aba, Nhập Fresh, Kiểm Date, Kiểm Kê, In Tem Giá, Các công việc cơ bản trước 8h nhé !',
          '3': 'Mình có công việc báo cáo Fresh vào lúc 10h , Anh Chị nhớ hoàn tất nhé !',
          '4': 'Mình có công việc báo cáo Fresh vào nhóm siêu thị vào lúc 12h, Các nhóm Thu Ngân-Fresh Khu vực vào khung giờ này cũng cần báo cáo, Anh Chị nhớ hoàn tất nhé !',
          '5': 'Mình có công việc báo cáo Nộp Tiền trước 14h, Anh Chị nhớ hoàn tất nhé !',
          '6': 'Mình có công việc báo cáo Fresh vào lúc 14h, Anh Chị nhớ hoàn tất nhé !',
          '7': 'Mình có công việc báo cáo Fresh vào lúc 16h, Anh Chị nhớ hoàn tất nhé !',
          '8': 'Mình có các công việc cuối ngày: Báo cáo trưng bày hàng hóa các Kv phụ trách-Kiểm tra lại Tool công việc siêu thị ! GO GO chuẩn bị về với Gia Đình thoi nào !!!!!',
          '9': 'Chúc Anh Chị Ngủ Ngon! Nghĩ ngơi sớm nhé !',
    },

      DAY_LABELS: ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],

      CLEANING_SCHEDULE: {
              0: ['Xuyên'],
              1: ['Biển'],
              2: ['Mai', 'Thi (Vệ sinh kho)', 'Vui/Ngọc'],
              3: ['Thư'],
              4: ['Tiên', 'Thi (Vệ sinh kho)', 'Vui/Ngọc'],
              5: ['Oanh'],
              6: ['Trường', 'Thi (Vệ sinh kho)', 'Vui/Ngọc'],
      },
};
