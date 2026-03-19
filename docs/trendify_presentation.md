---
marp: true
theme: default
class: lead
paginate: true
backgroundColor: #ffffff
---

# TRENDIFY

**Mạng Xã Hội Chia Sẻ Xu Hướng (Mini-clone)**
_Báo cáo môn học / Đồ án cấp sinh viên_

---

## 1. Lý do & Mục tiêu

**Lý do chọn đề tài:**

- Sự bùng nổ của mạng xã hội đã thay đổi hoàn toàn cách giới trẻ giao tiếp, từ việc chỉ chia sẻ tin nhắn sang nhu cầu khẳng định cá tính, thể hiện bản thân qua hình ảnh và cập nhật các xu hướng (trend) mới nhất mỗi ngày.
- Tuy nhiên, các ông lớn công nghệ (như Facebook, Instagram) đang ngày càng trở nên phức tạp, nhồi nhét quá nhiều tính năng thương mại (quảng cáo, e-commerce) khiến người dùng đôi khi cảm thấy "ngợp" và mất đi không gian chia sẻ thuần túy.
- Dưới góc độ sinh viên CNTT, việc tự tay phục dựng (mini-clone) một mạng xã hội thu nhỏ là bài toán kiểm tra năng lực toàn diện nhất. Nó đỏi hỏi sự kết hợp chặt chẽ giữa thiết kế CSDL (Database), xây dựng API (Backend), và xử lý giao diện tương tác tức thời (Frontend).

**Mục tiêu dự án:**

- Hoàn thiện một phiên bản mạng xã hội "vừa đủ xài", tập trung vào những giá trị cốt lõi: đăng bài viết, hình ảnh, và tương tác trực tiếp (Thích, Bình luận, Lưu, Theo dõi).
- Nghiên cứu và áp dụng thành thạo luồng dữ liệu một chiều (Unidirectional Data Flow) thông qua React/Redux kết hợp với RESTful API Server bằng Node.js.
- Cải thiện tư duy thiết kế trải nghiệm người dùng (UX): giải quyết các bài toán khó nhằn ở mức sinh viên như khôi phục vị trí cuộn trang (scroll restoration), chặn re-fetch API thừa thãi, và tích hợp bộ giao diện đa nền tảng (Light/Dark theme).

---

## 2. Đối tượng & Phạm vi

**Đối tượng mục tiêu (Mô phỏng):**

- Người dùng thích một giao diện mạng xã hội tối giản, không bị nhồi nhét quảng cáo hay các tính năng thừa thãi.
- Tập trung vào việc đọc bảng tin (Feed) và xem trang cá nhân (Profile).

**Phạm vi đồ án:**

- **Về mặt nghiệp vụ:** Giới hạn ở việc đăng bài (văn bản/ảnh), tương tác (Thích, Lưu, Bình luận), và cơ chế Theo dõi (Follow) để phân loại hiển thị. Không đi sâu vào các module phức tạp như Livestream, Video ngắn (Reels) hay thuật toán AI gợi ý.
- **Về mặt kỹ thuật:** Phát triển theo kiến trúc Client-Server trên nền tảng Web App. Hệ thống phục vụ lượng dữ liệu và người dùng thử nghiệm ở quy mô vừa và nhỏ (mức độ đồ án).

---

## 3. Khảo sát & Phân tích Yêu cầu

**Yêu cầu tính năng - Danh sách chức năng cụ thể:**

- **Quản lý Tài khoản (Thành viên):**
  - Đăng ký, Đăng nhập và xác thực phiên bản nâng cao bằng JWT.
  - Phân quyền người dùng cơ bản (chủ tài khoản & người xem).
- **Quản lý Trang cá nhân (Profile):**
  - Xem thông tin giới thiệu cá nhân, số lượng Followers/Following.
  - Cập nhật Ảnh đại diện (Avatar), Ảnh bìa (Cover) có chức năng Cắt ảnh (Crop Shape) ngay trên giao diện. (Sử dụng S3 để lưu trữ ảnh)
- **Trang chủ & Bảng tin (Feed):**
  - Hiển thị theo luồng "Dành cho bạn" (For You - ngẫu nhiên / phổ biến).
  - Hiển thị theo luồng "Đang theo dõi" (Following - chỉ hiện bài người đã follow).
- **Quản lý Bài viết (Post):**
  - Đăng bài mới (văn bản & hình ảnh), hiển thị trình diễn ảnh dạng khối lưới/Carousel.
  - Hỗ trợ nhập và nhắc tên người dùng khác (Mention `@[Username]`).
  - Xóa bài viết (đối với chủ sở hữu).
- **Tương tác cốt lõi:**
  - Thích (Like) / Bỏ thích (Unlike) bài viết.
  - Lưu (Save) / Bỏ lưu (Unsave) bài viết vào danh sách cá nhân.
  - Bình luận (Comment) trực tiếp dưới bài viết.
- **Quan hệ người dùng:**
  - Theo dõi (Follow) và Hủy theo dõi (Unfollow) tài khoản khác.
  - Chặn người dùng (Block) - từ chối hiển thị nội dung hai chiều.

**Yêu cầu phi tính năng (Non-Functional):**

- Ứng dụng thao tác linh hoạt, không bị gián đoạn hay tải lại toàn trang (Single Page Application).
- Khả năng tải thêm bài viết trơn tru (Infinite Scroll).

---

## 4. Công nghệ & Kiến trúc áp dụng

**Frontend:**

- **Core:** ReactJS, Typescript.
- **Quản lý dữ liệu (State Management):** Redux Toolkit.
- **UI Framework:** Ant Design (được tùy biến mạnh mẽ qua SCSS và Design Token) hỗ trợ hai chế độ giao diện Sáng/Tối (Light/Dark mode).

**Backend & Hệ thống:**

- **Core:** Node.js (NestJS / Express).
- **Cơ sở dữ liệu:** MongoDB / PostgreSQL (phù hợp với cấu trúc dữ liệu mạng lưới quan hệ lỏng).
- **Lưu trữ tĩnh:** Cơ chế Presigned URL để upload ảnh trực tiếp lên hệ thống lưu trữ ngoài (Cloudinary/S3) giúp giảm tải cho server chính.

---

## 5. Kết quả đạt được (Mục tiêu chất lượng)

Sau quá trình triển khai, đồ án đã giải quyết được các bài toán cụ thể:

- **Tối ưu hóa UI/UX:**
  - Xử lý thành công việc giữ nguyên vị trí cuộn trang (Scroll Restoration) khi người dùng chuyển đổi giữa các Tab (Bài viết/Giới thiệu).
  - Tối ưu hiển thị loading bằng các bộ khung chờ (Skeleton) thân thiện.
- **Đồng nhất giao diện:** Biến tấu lại thư viện Ant Design để thoát khỏi "vỏ bọc mặc định", đem lại một diện mạo trẻ trung, bo góc hiện đại. Hệ thống tương thích hoàn toàn khi bật Dark Mode.
- **Quản lý Codebase:** Tách bạch được logic gọi API (Action/Thunk) ra khỏi logic render giao diện, giúp code dễ đọc và dễ tìm lỗi hơn.

---

## 6. Kết luận & Hướng phát triển

**Kết luận:**

- Đồ án đã đi từ bước lên ý tưởng đến việc vận hành thực tế một ứng dụng web Fullstack. Qua dự án, nhóm/sinh viên thực hiện đã hiểu sâu hơn về vòng đời 컴ponent (React lifecycle), cách tương tác với API và tối ưu hóa thao tác người dùng.

**Hướng phát triển ở tương lai:**

- **Giao tiếp thời gian thực:** Tích hợp Socket.io để xây dựng tính năng Nhắn tin (Chat) cơ bản và Thông báo (Notification).
- **Tối ưu truy vấn:** Hiện tại việc phân trang (Cursor Pagination) đã áp dụng nhưng cần tối ưu thêm index ở database để query nhanh hơn khi dữ liệu lớn.
- **Bình luận đa cấp:** Nâng cấp hệ thống bình luận phẳng (Flat list) hiện tại thành bình luận phản hồi (Reply/Threaded).

---

# CẢM ƠN THẦY CÔ VÀ CÁC BẠN ĐÃ LẮNG NGHE!

_Phần Demo Hệ Thống & Trả lời câu hỏi (Q&A)_
