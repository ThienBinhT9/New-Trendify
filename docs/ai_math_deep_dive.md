# 🧮 Bản Chất Toán Học: AI Recommendation Engine — Trendify

> Tài liệu này giải thích **BẢN CHẤT** toán học của mỗi thuật toán — không chỉ "gọi hàm gì" mà **TẠI SAO** công thức đó hiệu quả, nó đo cái gì về mặt toán học, và khi nào nó ĐÚNG / SAI.

---

# Phần 1: TF-IDF — Biến Text Thành Số

## 1.1 Bản chất: Mô hình Vector Space (Information Retrieval)

TF-IDF ra đời từ lĩnh vực **Information Retrieval** (truy xuất thông tin) — bài toán tìm kiếm tài liệu.

**Ý tưởng gốc (Salton, 1971):** Biểu diễn mỗi document thành 1 **vector trong không gian N chiều**, mỗi chiều tương ứng 1 từ. Giá trị tại mỗi chiều = "TẦM QUAN TRỌNG" của từ đó trong document.

## 1.2 Bước 1: Bag of Words — Mô hình túi từ

**Đầu tiên**, tokenize text thành danh sách từ, **bỏ qua thứ tự**:

```
"du lịch Đà Nẵng rất đẹp, du lịch Hội An cũng đẹp"
→ Bag: {du: 2, lịch: 2, Đà: 1, Nẵng: 1, rất: 1, đẹp: 2, Hội: 1, An: 1, cũng: 1}
```

> [!NOTE]
> **Hạn chế Bag of Words:** Bỏ qua thứ tự → "mèo đuổi chó" = "chó đuổi mèo". Đây là trade-off giữa **đơn giản** và **chính xác**. Giải pháp: dùng n-grams (bigrams, trigrams) để giữ lại 1 phần thứ tự.

## 1.3 Bước 2: TF — Term Frequency

**TF đo:** Từ này xuất hiện **bao nhiêu lần** trong document này?

```
              count(t, d)
TF(t, d) = ─────────────────
            total_terms(d)

Ví dụ: "du lịch" trong doc trên:
TF("du lịch", d) = 2 / 11 = 0.182
```

**Tại sao cần TF?** Từ xuất hiện nhiều lần trong 1 document → có khả năng document đó **NÓI VỀ** chủ đề liên quan đến từ đó.

**Nhưng TF có vấn đề:** Từ "là", "và", "có" xuất hiện rất nhiều trong MỌI document → TF cao nhưng KHÔNG hữu ích. → Cần IDF để loại bỏ.

## 1.4 Bước 3: IDF — Inverse Document Frequency

**IDF đo:** Từ này **hiếm** hay **phổ biến** trong toàn bộ corpus?

```
                    N
IDF(t) = log ─────────────
                  DF(t)

N = tổng số documents trong corpus
DF(t) = số documents chứa term t
```

**Ví dụ:**
```
Corpus có 1000 documents:

Từ "và":        DF = 990 (xuất hiện trong 990/1000 docs)
  IDF = log(1000/990) = log(1.01) = 0.004  ← GẦN 0, gần như vô nghĩa

Từ "du lịch":   DF = 50 (xuất hiện trong 50/1000 docs)
  IDF = log(1000/50) = log(20) = 1.301     ← TRUNG BÌNH

Từ "Cát Bà":    DF = 3 (chỉ 3/1000 docs nói về Cát Bà)
  IDF = log(1000/3) = log(333) = 2.523     ← CAO, rất đặc trưng
```

**Bản chất toán học của IDF:**
- IDF chính là **lượng thông tin** (information content) theo Shannon
- Từ xuất hiện trong ít document → **hiếm** → mang nhiều thông tin → quan trọng hơn
- IDF **tự động loại bỏ stop words** (những từ phổ biến vô nghĩa)

## 1.5 Bước 4: TF × IDF — Kết hợp

```
TF-IDF(t, d) = TF(t, d) × IDF(t)
```

**Ý nghĩa:** Một từ quan trọng khi nó vừa:
1. Xuất hiện **NHIỀU** trong document này (TF cao)
2. Xuất hiện **ÍT** trong các document khác (IDF cao)

→ Từ đó là **đặc trưng riêng** của document này.

```
Ví dụ hoàn chỉnh:

Doc A: "du lịch Cát Bà, du lịch Cát Bà thật đẹp"
Doc B: "lập trình web và thiết kế giao diện"

"du lịch" trong Doc A:
  TF = 2/8 = 0.250
  IDF = log(2/1) = 0.301   (chỉ Doc A có)
  TF-IDF = 0.250 × 0.301 = 0.075

"và" trong Doc B:
  TF = 1/6 = 0.167
  IDF = log(2/2) = 0.000   (cả 2 docs đều có)
  TF-IDF = 0.167 × 0.000 = 0.000  ← BỊ LOẠI hoàn toàn!

"Cát Bà" trong Doc A:
  TF = 2/8 = 0.250
  IDF = log(2/1) = 0.301
  TF-IDF = 0.075  ← Cao, đặc trưng cho Doc A
```

## 1.6 Kết quả: Vector trong không gian N chiều

Sau TF-IDF, mỗi document = 1 vector:

```
Từ vựng:     [du_lịch, Cát_Bà, lập_trình, web, và, ...]
Doc A vector: [0.075,   0.075,  0.000,     0.0, 0.0, ...]
Doc B vector: [0.000,   0.000,  0.050,     0.050, 0.0, ...]

→ 2 vector này "chỉ về hướng khác nhau" trong không gian → ít tương đồng
```

## 1.7 Áp dụng trong Post Recommendation

Trong Trendify, ta xây dựng **user taste profile** bằng TF-IDF:

```
1. Gộp content + hashtags của TẤT CẢ bài user đã tương tác (like, save, comment)
   → Tạo 1 "mega-document" đại diện cho sở thích user

2. Mỗi candidate post = 1 document riêng

3. TF-IDF vectorize toàn bộ corpus = [user_doc] + [candidate_docs]

4. So sánh user vector vs mỗi candidate vector bằng Cosine Similarity
```

**Ý nghĩa:** Hashtags được lặp 2 lần (`parts.append(tag); parts.append(tag)`) để **tăng trọng số** — vì hashtag là **tín hiệu chủ đề rõ ràng** hơn text bình thường.

---

# Phần 2: Cosine Similarity — Đo Hướng, Không Đo Khoảng Cách

## 2.1 Bản chất hình học

**Cosine Similarity đo GÓC giữa 2 vector**, không đo khoảng cách.

```
Cos(θ) = 1.0 → θ = 0°   → cùng hướng → NỘI DUNG GIỐNG
Cos(θ) = 0.0 → θ = 90°  → vuông góc → KHÔNG LIÊN QUAN
Cos(θ) = -1  → θ = 180° → ngược hướng (hiếm với TF-IDF vì không âm)
```

## 2.2 Công thức

```
                  A⃗ · B⃗           Σᵢ(Aᵢ × Bᵢ)
cos(A⃗, B⃗) = ──────────── = ───────────────────────
               ‖A⃗‖ × ‖B⃗‖     √Σᵢ(Aᵢ²) × √Σᵢ(Bᵢ²)

Tử số:  Tích vô hướng (dot product) — đo sự "cùng hướng"
Mẫu số: Tích 2 norm (độ dài) — chuẩn hóa để bỏ ảnh hưởng kích thước
```

## 2.3 TẠI SAO dùng Cosine thay vì Euclidean Distance?

**Vấn đề với Euclidean:**

```
Doc A (bài ngắn): "du lịch Đà Nẵng"
  Vector: [0.3, 0.3, 0, 0]

Doc B (bài dài): "du lịch Đà Nẵng, hướng dẫn du lịch Đà Nẵng chi tiết, 
                  kinh nghiệm du lịch Đà Nẵng"
  Vector: [0.9, 0.9, 0, 0]

Doc C (khác chủ đề): "lập trình web"
  Vector: [0, 0, 0.3, 0.3]
```

**Euclidean Distance:**
```
d(A, B) = √((0.3-0.9)² + (0.3-0.9)²) = √(0.36 + 0.36) = 0.849
d(A, C) = √((0.3-0)² + (0.3-0)²+ (0-0.3)² + (0-0.3)²) = 0.600

Euclidean: A gần C hơn B??? → SAI!
B cùng chủ đề với A, chỉ là dài hơn!
```

**Cosine Similarity:**
```
cos(A, B) = (0.3×0.9 + 0.3×0.9) / (√0.18 × √1.62)
          = 0.54 / (0.424 × 1.273) = 0.54 / 0.54 = 1.000  ← HOÀN TOÀN GIỐNG

cos(A, C) = (0.3×0 + 0.3×0 + 0×0.3 + 0×0.3) / (...) = 0.000 ← KHÔNG LIÊN QUAN
```

**Kết luận:**
> Cosine **bất biến với magnitude** (độ dài vector). Bài dài hay ngắn không ảnh hưởng, chỉ quan tâm **hướng** (chủ đề). Đây là tính chất **scale invariance** — cực kỳ quan trọng khi so sánh text có độ dài khác nhau.

## 2.4 Ý nghĩa hình học trong 2D

```
                  ↑ "du lịch"
                  |    
          B(0.9)  •
                 /|
                / |
       A(0.3) •  |     θ = 0° → cos = 1.0 (cùng hướng!)
              /   |
             /    |
────────────•─────────→ "lập trình"
         C(0.3)

A và B: cùng hướng (cùng chủ đề), chỉ khác "chiều dài" (độ dài bài)
A và C: vuông góc (khác chủ đề hoàn toàn)
```

---

# Phần 3: Exponential Decay — Bản Chất Vật Lý

## 3.1 Nguồn gốc: Phân rã phóng xạ

Exponential decay đến từ vật lý hạt nhân — mô tả sự **phân rã phóng xạ**:

```
N(t) = N₀ × e^(-λt)

N₀ = lượng ban đầu
λ  = hằng số phân rã (decay constant)
t  = thời gian
```

**Tính chất quan trọng:** Sau mỗi chu kỳ half-life T½, giá trị giảm còn **đúng 50%**, bất kể giá trị hiện tại.

## 3.2 Áp dụng cho bài viết

```
freshness(t) = e^(-0.693 × t / T½)

t   = tuổi bài viết (giờ)
T½  = 72 giờ (3 ngày) — half-life
0.693 = ln(2) ← để đảm bảo f(T½) = 0.5
```

**Chứng minh f(T½) = 0.5:**
```
f(T½) = e^(-0.693 × T½ / T½)
      = e^(-0.693)
      = e^(-ln2)
      = 1/e^(ln2)
      = 1/2
      = 0.5  ✓
```

## 3.3 Tại sao Exponential chứ không phải Linear Decay?

**Linear Decay:** `f(t) = 1 - t/T_max`

```
Linear:      f(0) = 1.0,  f(24h) = 0.93,  f(72h) = 0.79,  f(336h) = 0.0
Exponential: f(0) = 1.0,  f(24h) = 0.79,  f(72h) = 0.50,  f(336h) = 0.04
```

**Vấn đề Linear:**
1. Bài cũ 2 tuần: score = **0 hoặc âm** → mất hoàn toàn
2. Bài mới 1 ngày giảm **cùng tốc độ** với bài 1 tuần → không hợp lý

**Ưu điểm Exponential:**
1. **Never reaches zero** — bài cũ vẫn có cơ hội (rất nhỏ) nếu engagement đủ cao
2. **Bài mới giảm nhanh hơn** (fresh content decays fast → cần engagement sớm)
3. **Mô hình thực tế hơn** — nghiên cứu cho thấy sự chú ý trên social media tuân theo exponential distribution

## 3.4 Đạo hàm (tốc độ giảm)

```
f'(t) = -0.693/T½ × e^(-0.693t/T½)

Tại t=0:   f'(0) = -0.693/72 = -0.00963/giờ  (giảm nhanh nhất)
Tại t=72:  f'(72) = -0.00481/giờ               (giảm chậm đi)
Tại t=336: f'(336) = -0.00038/giờ               (gần như không giảm nữa)
```

→ **Diminishing rate of decay** — phù hợp với trực giác: bài mới 1 giờ vs 2 giờ khác biệt lớn, bài 1 tuần vs 1 tuần 1 giờ gần như không khác biệt.

---

# Phần 4: Min-Max Normalization — Feature Scaling

## 4.1 Bản chất: Linear Transformation

Min-Max Normalization là **phép biến đổi tuyến tính** (affine transformation) ánh xạ giá trị từ [min, max] → [0, 1].

```
              x - x_min
x_norm = ─────────────────
           x_max - x_min
```

## 4.2 Tại sao BẮT BUỘC phải normalize?

```
Trước khi normalize:
  Content scores:  [0.0, 0.12, 0.43, 0.67]  (cosine similarity, đã [0,1])
  Popularity:      [0, 50, 200, 4500]         (engagement × freshness)

Nếu cộng trực tiếp (dù có weight):
  0.75 × 0.67 + 0.25 × 4500
  = 0.50 + 1125 = 1125.5

→ Popularity (range 0-4500) THỐNG TRỊ kết quả dù weight chỉ 25%
→ Content (range 0-1) gần như VÔ NGHĨA dù weight 75%
```

**Sau normalize — tất cả về [0, 1]:**
```
  Content:    [0.0, 0.18, 0.64, 1.0]
  Popularity: [0.0, 0.01, 0.04, 1.0]

Bây giờ weight ĐÚNG NGHĨA — 75% thực sự là 75% ảnh hưởng.
```

## 4.3 Tính chất

- **Output range:** Luôn [0, 1]
- **Preserves order:** Nếu a > b → a_norm > b_norm (bảo toàn thứ tự)
- **Sensitive to outliers:** Nếu 1 giá trị cực đoan (outlier), tất cả giá trị khác bị nén gần 0
- **x_max = x_min:** Trả về 0 cho tất cả (tránh divide by zero)

---

# Phần 5: Weighted Linear Combination — Kết Hợp Đa Tiêu Chí

## 5.1 Bản chất: Multi-Criteria Decision Making (MCDM)

Weighted Linear Combination thuộc lĩnh vực **ra quyết định đa tiêu chí** (MCDM):

> "Khi có nhiều tiêu chí đánh giá (criteria), kết hợp chúng thành 1 điểm duy nhất bằng cách gán trọng số."

```
final_score = Σ wᵢ × sᵢ

Điều kiện: Σ wᵢ = 1  (trọng số cộng lại = 100%)
           wᵢ ≥ 0     (không có trọng số âm)
           sᵢ ∈ [0,1]  (scores đã normalize)
```

## 5.2 Áp dụng trong Trendify

```
final_score = w_content × content_score + w_popularity × popularity_score

Ví dụ (user có 50+ interactions → content-heavy):
  w_content = 0.75, w_popularity = 0.25

  Candidate A: content=0.9, popularity=0.3
    → 0.75 × 0.9 + 0.25 × 0.3 = 0.675 + 0.075 = 0.750

  Candidate B: content=0.2, popularity=0.95
    → 0.75 × 0.2 + 0.25 × 0.95 = 0.150 + 0.238 = 0.388

→ Candidate A thắng vì nội dung phù hợp hơn (dù ít hot hơn)
```

## 5.3 Tính chất

1. **Output range:** final_score ∈ [0, 1] (vì là convex combination)
2. **Interpretable:** weight = % ảnh hưởng của mỗi tín hiệu
3. **Monotone:** Nếu tăng bất kỳ signal → final_score tăng (không có paradox)
4. **Linear:** KHÔNG capture **interactions** giữa signals

## 5.4 Hạn chế và giải pháp

**Hạn chế:** Linearity — giả định các signals **độc lập**. Nhưng thực tế content score cao → popularity cũng có thể cao (correlated).

**Giải pháp nâng cao (không bắt buộc):**
- Dùng **learned weights** (logistic regression trên click data)
- Dùng **non-linear combination** (gradient boosted trees)
- Dùng **neural network** (deep RS)

→ Nhưng linear combination đủ tốt cho quy mô Trendify, và có ưu điểm **explainable**.

---

# Tóm Tắt: Mỗi Thuật Toán Đo Cái Gì?

| Thuật toán | Đo cái gì? | Bản chất toán | Miền giá trị |
|-----------|-----------|-------------|-------------|
| **TF-IDF** | Tầm quan trọng của từ | Statistical importance | [0, +∞) |
| **Cosine Similarity** | Sự tương đồng hướng | Angular distance | [-1, 1] |
| **Exponential Decay** | Sự tươi mới | Half-life model | (0, 1] |
| **Min-Max Norm** | Chuẩn hóa scale | Affine transformation | [0, 1] |
| **Weighted Sum** | Tổng hợp đa tiêu chí | Convex combination | [0, 1] |

---

> [!CAUTION]
> **Khi hội đồng hỏi sâu, luôn trả lời theo format:**
> 1. **Bản chất toán học** — "Thuật toán X đo/tính Y dựa trên nguyên lý Z"
> 2. **Tại sao chọn nó** — "Vì tính chất A phù hợp với bài toán"
> 3. **Hạn chế** — "Nhược điểm là P, có thể cải thiện bằng Q"
> 4. **Ví dụ cụ thể** — Tính tay 1 ví dụ số
