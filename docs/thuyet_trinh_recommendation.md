# 🎤 Hướng Dẫn Thuyết Trình: Phần Recommendation System

> Dành cho người nghe **không biết gì** về AI/ML. Nói theo thứ tự từ trên xuống.

---

## 📌 Cấu trúc thuyết trình (5 phần, ~10-15 phút)

---

## PHẦN 1: Mở đầu — "Recommendation System là gì?" (~2 phút)

### Nói gì:

> "Khi các thầy/cô mở TikTok, trang ForYou hiện ra những video mà mình thích xem — đó chính là **Recommendation System**. Nó tự động **đoán** nội dung nào mình sẽ thích, dựa vào những gì mình đã xem, đã like trước đó."
>
> "Trong Trendify, em xây dựng hệ thống tương tự: khi user vào trang **Dành Cho Bạn**, hệ thống sẽ tự chọn ra những bài viết phù hợp nhất với người đó."

### Điểm mấu chốt cần nhấn mạnh:
- Mọi mạng xã hội lớn đều có RS (YouTube, TikTok, Facebook, Shopee)
- Trendify cũng xây 1 RS riêng cho trang "Dành Cho Bạn"

---

## PHẦN 2: Cách tiếp cận — "Em chọn phương pháp nào và tại sao?" (~2 phút)

### Nói gì:

> "Có 2 cách chính để làm Recommendation System:
>
> **Cách 1 — Collaborative Filtering:** Tìm những người có sở thích giống bạn, rồi gợi ý bài mà họ thích. Giống như: *'Bạn A giống bạn, bạn A thích bài này, vậy bạn cũng sẽ thích.'* Cách này cần **rất nhiều dữ liệu** từ nhiều user, và có vấn đề Cold Start — user mới chưa có lịch sử thì không gợi ý được gì.
>
> **Cách 2 — Content-Based Filtering:** Phân tích **nội dung** bài viết. Nếu bạn hay like bài về du lịch → gợi ý thêm bài du lịch. Không cần data từ user khác, chỉ cần biết **bạn thích gì** và **bài viết nói về gì**.
>
> Em chọn **Content-Based** vì: (1) không cần hàng triệu user như Collaborative, (2) hoạt động được ngay cả khi ít data, (3) giải thích được tại sao gợi ý bài này."

### Điểm mấu chốt:
- Content-Based = so sánh **nội dung bài viết** với **sở thích user**
- Phù hợp quy mô đồ án, không cần data khổng lồ

---

## PHẦN 3: Cách hoạt động cụ thể — "Hệ thống làm gì từng bước?" (~5 phút)

> [!IMPORTANT]
> Đây là phần **quan trọng nhất**. Nói chậm, giải thích từng bước.

### Bước 1: Thu thập sở thích user

> "Đầu tiên, hệ thống xem user đã **like, save, comment** những bài nào. Tổng hợp lại thành **hồ sơ sở thích** (user profile). Ví dụ: user A like 30 bài du lịch, 10 bài ẩm thực → hệ thống biết user A thích du lịch và ẩm thực."

### Bước 2: Biến text thành số — TF-IDF

> "Máy tính không hiểu chữ, nên cần **biến text thành con số**. Em dùng phương pháp **TF-IDF**."
>
> "**TF** = Term Frequency — từ này xuất hiện bao nhiêu lần trong bài. Nếu bài nhắc 'du lịch' 5 lần → TF cao."
>
> "**IDF** = Inverse Document Frequency — từ này **hiếm** cỡ nào trong tất cả bài viết. Từ 'và', 'là' xuất hiện ở mọi bài → IDF thấp, không quan trọng. Từ 'Đà Nẵng' chỉ xuất hiện ở vài bài → IDF cao, rất quan trọng."
>
> "**TF-IDF = TF × IDF** — từ nào vừa **xuất hiện nhiều trong bài** vừa **hiếm trong toàn bộ dữ liệu** thì quan trọng nhất. Kết quả: mỗi bài viết trở thành **1 dãy số** (vector)."

#### 📐 Công thức TF-IDF:

```
TF(t, d) = số lần từ t xuất hiện trong document d / tổng số từ trong d

IDF(t) = log(N / DF(t))
         N  = tổng số documents trong corpus
         DF = số documents chứa từ t

TF-IDF(t, d) = TF(t, d) × IDF(t)
```

#### 📝 Ví dụ tính tay (viết lên bảng):

```
Corpus gồm 5 documents:
  Doc 0 (sở thích user):  "du lịch Đà Nẵng ẩm thực du lịch Hội An"
  Doc 1 (bài A):          "du lịch Sài Gòn ẩm thực đường phố"
  Doc 2 (bài B):          "lập trình JavaScript React"
  Doc 3 (bài C):          "du lịch Hội An cà phê muối"
  Doc 4 (bài D):          "bóng đá World Cup 2026"

Tính TF-IDF cho từ "du lịch" trong Doc 0:
  TF  = 2/7 = 0.286    (xuất hiện 2 lần trong 7 từ)
  DF  = 3              (có mặt trong Doc 0, 1, 3)
  IDF = log(5/3) = 0.511
  TF-IDF = 0.286 × 0.511 = 0.146

Tính TF-IDF cho từ "Hội An" trong Doc 0:
  TF  = 1/7 = 0.143
  DF  = 2              (chỉ Doc 0 và Doc 3 → HIẾM hơn)
  IDF = log(5/2) = 0.916   ← IDF cao hơn vì hiếm hơn!
  TF-IDF = 0.143 × 0.916 = 0.131

→ Kết quả: mỗi document = 1 vector N chiều (N = số từ unique)
```

### Bước 3: So sánh bằng Cosine Similarity

> "Bây giờ user profile là 1 vector, mỗi bài viết cũng là 1 vector. Em dùng **Cosine Similarity** để đo 2 vector **giống nhau** bao nhiêu."
>
> "Hình dung 2 mũi tên trên mặt phẳng: nếu chúng chỉ **cùng hướng** → cosine = 1 (giống nhau hoàn toàn). Nếu **vuông góc** → cosine = 0 (không liên quan). Nếu **ngược hướng** → cosine = -1."
>
> "Ví dụ: user thích du lịch, bài A về du lịch → cosine = 0.95 (rất giống). Bài B về lập trình → cosine = 0.2 (khác xa). Vậy bài A được gợi ý trước."

#### 📐 Công thức Cosine Similarity:

```
                    A⃗ · B⃗              Σ(Aᵢ × Bᵢ)
cos(θ) = ─────────────────── = ─────────────────────────
            ‖A⃗‖ × ‖B⃗‖         √Σ(Aᵢ²) × √Σ(Bᵢ²)

Kết quả: -1 ≤ cos(θ) ≤ 1
  1  = hoàn toàn giống nhau
  0  = không liên quan
 -1  = hoàn toàn ngược nhau
```

#### 📝 Ví dụ tính tay (2 chiều):

```
user_vec   = [0.8, 0.3]    ("du lịch" = 0.8, "lập trình" = 0.3)
post_A_vec = [0.7, 0.2]    (bài du lịch)
post_B_vec = [0.1, 0.9]    (bài lập trình)

cos(user, A) = (0.8×0.7 + 0.3×0.2) / (√(0.8²+0.3²) × √(0.7²+0.2²))
             = (0.56 + 0.06) / (√0.73 × √0.53)
             = 0.62 / (0.854 × 0.728)
             = 0.62 / 0.622
             = 0.997  ← RẤT GIỐNG ✅

cos(user, B) = (0.8×0.1 + 0.3×0.9) / (0.854 × √(0.1²+0.9²))
             = (0.08 + 0.27) / (0.854 × 0.906)
             = 0.35 / 0.774
             = 0.452  ← KHÁC NHIỀU ❌

→ Post A (du lịch) = 0.997 → gợi ý trước
→ Post B (lập trình) = 0.452 → gợi ý sau
```

### Bước 4: Kết hợp thêm Popularity (bài hot)

> "Chỉ dựa vào nội dung thì chưa đủ. Bài mới đăng mà có nhiều like, comment, share → chứng tỏ bài **hay thật sự**. Em tính thêm điểm **Popularity**:"
>
> "Save nhân 3 vì save = người ta muốn xem lại, đó là tín hiệu mạnh nhất. View chỉ nhân 0.1 vì scroll qua cũng tính view."
>
> "**Độ tươi mới**: bài mới 100%, sau 3 ngày giảm còn 50%, sau 1 tuần còn 20%. Để bài cũ không chiếm hết feed."

#### 📐 Công thức Engagement:

```
Engagement = likeCount  × 1.0
           + commentCount × 2.0     ← comment tích cực hơn like
           + saveCount    × 3.0     ← save = giá trị nhất
           + shareCount   × 2.5     ← share = lan truyền
           + viewCount    × 0.1     ← view = thụ động
```

#### 📐 Công thức Time Decay (Exponential Decay):

```
freshness(t) = e^(-0.693 × t / T½)

t   = tuổi bài viết (giờ)
T½  = half-life = 72 giờ (3 ngày)
0.693 = ln(2)   ← đảm bảo sau đúng T½ giờ, giá trị giảm còn 50%
```

#### 📐 Công thức Popularity:

```
Popularity = Engagement × freshness(t)
```

#### 📝 Bảng giá trị Time Decay:

```
Vừa đăng (0h):      freshness = e^0          = 1.000  (100%)
Sau 1 ngày (24h):   freshness = e^(-0.231)   = 0.794  (79%)
Sau 3 ngày (72h):   freshness = e^(-0.693)   = 0.500  (50%)  ← half-life
Sau 1 tuần (168h):  freshness = e^(-1.617)   = 0.198  (20%)
Sau 2 tuần (336h):  freshness = e^(-3.233)   = 0.039  (4%)
```

#### 📝 Ví dụ tính tay:

```
Bài X: 100 likes, 20 comments, 5 saves, 3 shares, 500 views — đăng 1 ngày trước
  Engagement = 100×1 + 20×2 + 5×3 + 3×2.5 + 500×0.1 = 100+40+15+7.5+50 = 212.5
  freshness  = e^(-0.693 × 24/72) = e^(-0.231) = 0.794
  Popularity = 212.5 × 0.794 = 168.7

Bài Y: 500 likes, 80 comments, 20 saves — đăng 1 tuần trước
  Engagement = 500+160+60 = 720
  freshness  = e^(-0.693 × 168/72) = e^(-1.617) = 0.198
  Popularity = 720 × 0.198 = 142.6

→ Bài X (mới, ít engagement) = 168.7 > Bài Y (cũ, nhiều engagement) = 142.6
→ Bài mới vẫn có cơ hội thắng bài cũ nhờ freshness!
```

### Bước 5: Kết hợp 2 điểm (Weighted Fusion)

> "Trước khi cộng, em phải **normalize** — đưa cả 2 loại điểm về cùng thang [0, 1]. Vì content score nằm trong [0, 1] nhưng popularity có thể lên hàng trăm, hàng nghìn. Nếu không normalize, popularity sẽ áp đảo."
>
> "Điểm cuối cùng = **trọng số × Content + trọng số × Popularity**."
>
> "User mới (chưa like gì): 10% Content + 90% Popularity → xem bài hot trước. User cũ (like nhiều rồi): 75% Content + 25% Popularity → feed cá nhân hóa sâu."
>
> "Đây là cách em giải quyết **Cold Start** — user mới vẫn có feed hay xem, không bị trang trắng."

#### 📐 Công thức Min-Max Normalize:

```
normalize(x) = (x - min) / (max - min)

→ Giá trị nhỏ nhất trong mảng = 0
→ Giá trị lớn nhất trong mảng = 1
→ Tất cả giá trị nằm trong [0, 1]
```

#### 📐 Công thức Weighted Fusion:

```
final_score = w_content × normalize(content_score)
            + w_popularity × normalize(popularity_score)
```

#### 📐 Bảng Adaptive Weights (Cold Start Handling):

```
interactions < 5:   w_content = 0.10, w_popularity = 0.90  ← User rất mới
interactions < 20:  w_content = 0.40, w_popularity = 0.60  ← Bắt đầu cá nhân hóa
interactions < 50:  w_content = 0.60, w_popularity = 0.40  ← Content chiếm ưu thế
interactions ≥ 50:  w_content = 0.75, w_popularity = 0.25  ← Cá nhân hóa sâu
```

#### 📝 Ví dụ tính tay:

```
User có 35 interactions → w_content=0.60, w_popularity=0.40

Bài A: content_norm = 0.95, pop_norm = 0.30
  final = 0.60×0.95 + 0.40×0.30 = 0.57 + 0.12 = 0.69

Bài B: content_norm = 0.20, pop_norm = 1.00
  final = 0.60×0.20 + 0.40×1.00 = 0.12 + 0.40 = 0.52

→ Bài A (phù hợp sở thích) = 0.69 > Bài B (rất hot nhưng không phù hợp) = 0.52
```

### Bước 6: Hai kỹ thuật bổ sung

> "Bài từ người mình **follow** được cộng thêm 25% điểm — ưu tiên nhẹ. Và nếu 1 tác giả có quá 3 bài trong feed → bài thứ 4 trở đi bị **giảm 70%** để feed đa dạng, không bị 1 người chiếm hết."

#### 📐 Công thức Following Boost:

```
Nếu author ∈ following_set:
    final_score = final_score × 1.25    (tăng 25%)
```

#### 📐 Công thức Author Diversity:

```
Đếm số bài mỗi author (từ điểm cao → thấp):
    Bài 1, 2, 3 → giữ nguyên
    Bài 4, 5, 6... → final_score = final_score × 0.3    (giảm 70%)
```

#### 📝 Ví dụ:

```
Bài A (author X): final = 0.69 → author X theo dõi → 0.69 × 1.25 = 0.8625
Bài B (author Y): final = 0.52 → không follow → giữ nguyên 0.52

Nếu author Z có 5 bài: bài 1,2,3 giữ nguyên, bài 4,5 × 0.3 → bị đẩy xuống cuối
```

---

## PHẦN 4: Kiến trúc hệ thống — "Luồng dữ liệu chạy như thế nào?" (~2 phút)

### Nói gì:

> "Kiến trúc gồm 3 phần:
> 1. **Frontend** (React) — giao diện user nhìn thấy
> 2. **Backend** (Node.js) — xác thực user, xử lý API
> 3. **AI Service** (Python) — tính toán recommendation
>
> Khi user mở trang 'Dành Cho Bạn':
> - Frontend gửi request lên Backend
> - Backend xác thực token, rồi gọi sang AI Service
> - AI Service tính toán (TF-IDF, Cosine, Popularity...) → trả về danh sách ID bài viết đã xếp hạng
> - Backend lấy ID đó, query đầy đủ thông tin bài viết (ảnh, tên tác giả...) rồi trả cho Frontend hiển thị
>
> Em cũng dùng **Redis cache** — kết quả được lưu 30 phút, nếu user reload trang thì trả kết quả cũ ngay lập tức, không cần tính lại."

### Điểm mấu chốt:
- Tách Python riêng vì Python có thư viện ML tốt nhất (scikit-learn)
- Cache giúp nhanh, không tính lại liên tục

---

## PHẦN 5: Tại sao không dùng Deep Learning / Loss Function? (~1 phút)

> "Hệ thống em **không training model**, nên **không cần hàm mất mát (Loss Function)**."
>
> "TF-IDF và Cosine Similarity là **công thức toán học trực tiếp** — cho data vào, ra kết quả ngay. Khác với Deep Learning phải train hàng giờ trên GPU."
>
> "Nếu Trendify có hàng triệu user thì nên nâng cấp lên Deep Learning. Nhưng với quy mô đồ án, phương pháp này **nhanh, chính xác, dễ giải thích**, và hoạt động tốt."

---

## 🛡️ Câu hỏi hội đồng hay hỏi + cách trả lời ngắn

| Câu hỏi | Trả lời |
|----------|---------|
| "TF-IDF có hạn chế gì?" | Không hiểu ngữ nghĩa — "ẩm thực" và "món ăn" bị coi là 2 từ khác nhau. Cải thiện bằng Word Embedding nhưng tốn tài nguyên hơn. |
| "Trọng số lấy từ đâu?" | Dựa trên nguyên tắc (user mới → cần bài hot, user cũ → cá nhân hóa) và thực nghiệm. Production có thể tune bằng A/B testing. |
| "Cosine tại sao tốt hơn Euclidean?" | Cosine đo **hướng** vector, không quan tâm **độ dài**. Bài dài gấp đôi mà cùng chủ đề → Euclidean xa nhưng Cosine vẫn cao. |
| "Scale thế nào?" | Redis cache, pagination, giới hạn 500 bài ứng viên. Nếu cần hơn → dùng FAISS (Facebook AI Similarity Search). |

---

## 💡 Mẹo thuyết trình

1. **Luôn cho ví dụ cụ thể**: "User thích du lịch → bài du lịch cosine = 0.95, bài lập trình = 0.2"
2. **Dùng từ đơn giản**: "biến chữ thành số" thay vì "vectorization", "đo độ giống nhau" thay vì "cosine similarity" (rồi mới nói tên kỹ thuật)
3. **Vẽ sơ đồ pipeline lên bảng** nếu được: User Profile → TF-IDF → Cosine → Popularity → Fusion → Ranked Feed
4. **Tính 1 ví dụ tay** trên bảng (TF-IDF cho từ "du lịch") → hội đồng ấn tượng hơn nhiều so với chỉ demo code
