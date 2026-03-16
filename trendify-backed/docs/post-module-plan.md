# Post Module — Implementation Plan

## Overview

Module Post cho social media platform giống Instagram. Bao gồm: Post CRUD + media upload, Like/Unlike, Nested Comment, Save/Unsave.

**Tech Stack:**
- Media upload: S3 (presigned URL)
- Real-time: WebSocket (future)
- Message Queue: RabbitMQ (async counter updates, notifications)
- Cache: Redis
- Database: MongoDB (Mongoose)
- Architecture: Clean Architecture (Domain → Application → Infrastructure → Interfaces)

---

## API Endpoints

| Method | Path | Mô tả | Auth |
|--------|------|--------|------|
| `POST` | `/api/posts` | Tạo post (text/image/video) | ✅ |
| `GET` | `/api/posts/:postId` | Xem chi tiết post | ✅ |
| `PATCH` | `/api/posts/:postId` | Cập nhật post (caption, settings, location) | ✅ |
| `DELETE` | `/api/posts/:postId` | Xóa post (soft delete) | ✅ |
| `GET` | `/api/posts/feed` | Home feed (phase sau — hybrid strategy) | ✅ |
| `POST` | `/api/posts/:postId/likes` | Like post | ✅ |
| `DELETE` | `/api/posts/:postId/likes` | Unlike post | ✅ |
| `GET` | `/api/posts/:postId/likes` | Danh sách likes (cursor pagination) | ✅ |
| `POST` | `/api/posts/:postId/comments` | Tạo comment (top-level hoặc reply) | ✅ |
| `GET` | `/api/posts/:postId/comments` | Danh sách comments (top-level, cursor) | ✅ |
| `GET` | `/api/posts/:postId/comments/:commentId/replies` | Replies của 1 comment | ✅ |
| `DELETE` | `/api/posts/:postId/comments/:commentId` | Xóa comment | ✅ |
| `POST` | `/api/posts/:postId/saves` | Save post | ✅ |
| `DELETE` | `/api/posts/:postId/saves` | Unsave post | ✅ |
| `GET` | `/api/posts/saved` | Danh sách saved posts (cursor pagination) | ✅ |

---

## Implementation Phases

### Phase 1: Comment Domain (new)

#### 1. `src/domain/comment/comment.type.ts`
- `ECommentStatus`: active, deleted
- `ICommentProps`: postId, authorId, parentId?, rootCommentId?, content, mentions[], replyCount, likeCount, status, timestamps
- `ICommentCreateInput`, `ICommentMention`

#### 2. `src/domain/comment/comment.entity.ts`
- Private props, getters, `create()` factory
- `delete()` (soft delete), `isOwnedBy()`, `isReply()`
- `canDelete(userId, postAuthorId)` — author comment HOẶC author post đều xóa được

#### 3. `src/domain/comment/comment.abstract.ts`
- `ICommentRepository`: create, delete, findById, findByPost (top-level cursor), findReplies(parentId, cursor), countByPost, incrementReplyCount, deleteByPost

#### 4. `src/infrastructure/database/models/comment.model.ts`
- Mongoose schema, indexes: `{postId, parentId: null, _id: -1}`, `{parentId, _id: -1}`, `{authorId, _id: -1}`

#### 5. `src/infrastructure/database/repositories/comment.repository.impl.ts`
- Extend `BaseRepository`, cursor pagination

### Phase 2: Domain Gaps

#### 6. Add `EMediaPurpose.POST_MEDIA` to `media.type.ts`
- Media limits + variant dimensions for post media

#### 7. Add `likes`, `saves`, `comments` to Unit of Work
- Update `IUnitOfWork` interface + `MongooseUnitOfWork` implementation

#### 8. Add post-related message types to `message.type.ts`
- `PostLikeMessage`, `PostCommentMessage`
- Routing keys: `COUNTER_POST_LIKE`, `COUNTER_POST_COMMENT`

#### 9. Add route constants for comment replies & delete

### Phase 3: Application Layer

#### 10. Post DTOs — `post.dto.ts`
- Add: `CreateCommentDTO`, `GetCommentsDTO`, `GetCommentRepliesDTO`, `DeleteCommentDTO`, `UnsavePostDTO`, `GetSavedPostsDTO`

#### 11. Post Use Cases — `src/application/usecases/post/`

| Use Case | Chức năng |
|----------|-----------|
| `create-post.usecase.ts` | Validate → `PostEntity.create()` → save → increment post count |
| `get-post.usecase.ts` | Find post → check visibility → return + viewer context |
| `update-post.usecase.ts` | Ownership guard → `post.update()` → save → invalidate cache |
| `delete-post.usecase.ts` | Ownership guard → soft delete → cleanup async |
| `get-user-posts.usecase.ts` | Check visibility → cursor paginate → batch check isLiked/isSaved |
| `like-post.usecase.ts` | Check canInteract + allowLike → create like → increment counter async |
| `unlike-post.usecase.ts` | Delete like → decrement counter async |
| `get-post-likes.usecase.ts` | Cursor pagination → return user basic info list |
| `create-comment.usecase.ts` | Check allowComment → create → increment counters |
| `get-comments.usecase.ts` | Top-level comments (cursor) |
| `get-comment-replies.usecase.ts` | Replies of 1 comment (cursor) |
| `delete-comment.usecase.ts` | Guard → soft delete → decrement counters |
| `save-post.usecase.ts` | Create save → increment counter (idempotent) |
| `unsave-post.usecase.ts` | Delete save → decrement counter |
| `get-saved-posts.usecase.ts` | User's saved posts (cursor) |

### Phase 4: Interface Layer

#### 12. `src/interfaces/validators/post.validator.ts`
- Zod schemas for all endpoints

#### 13. `src/interfaces/controllers/post.controller.ts`
- Inject use cases → handler methods

#### 14. `src/interfaces/routes/post.route.ts`
- Wire endpoints with middleware → controller

#### 15. `src/infrastructure/injection/post.injection.ts`
- Manual DI: repos → services → use cases → controller

#### 16. Register post route in `routes/index.ts`

---

## Best Practices & Scaling Considerations

### Counter Strategy (critical for virality)

- **Write path**: Like/Comment publish message → consumer batch-increment counter. Viral posts: use **Redis counter** (`INCR`) + periodic sync to MongoDB. Avoid write contention on post document.
- **Read path**: Counter from Redis first, fallback MongoDB. Approximate count OK cho UX ("1.2M likes").
- Methods: `incrementLikeCount`, `incrementCommentCount`, `incrementSaveCount` — atomic `$inc` operations.
- Sync: `setLikeCount`, `setViewCount` — periodic sync from Redis → MongoDB.

### Like/Save Idempotency

- Unique compound index `{userId, postId}` → duplicate key error (11000) = already liked/saved → return null instead of throw.
- Client gọi nhiều lần: idempotent, không duplicate.

### Nested Comment Strategy

- Store both `parentId` (direct parent) AND `rootCommentId` (top-level comment) → O(1) query for replies.
- Top-level: `parentId = null`, sort `_id desc` (newest first).
- Replies: query by `parentId`, sort `_id asc` (chronological).
- `replyCount` on parent comment → "View N replies" without count query.
- `canDelete`: author comment OR author post — giống Instagram.

### Cursor Pagination (no skip/offset)

- Use `_id` as cursor (ObjectId is time-ordered).
- Pattern: `query._id = { $lt: cursor }`, `limit + 1` → check `hasNext`.
- Consistent performance regardless of page depth.

### Cache Strategy

- Post detail: `v1:post:{postId}` — 30s TTL
- User posts: `v1:posts:user:{authorId}:access:{level}:cursor:{cursor}` — 60s TTL
- Like count: `post:{postId}:likes` — 1h TTL
- View count: `post:{postId}:views` — 5min TTL (sync interval)
- Invalidation: update/delete → `del` key + `delByPrefix` for user posts

### Media Flow

1. Client calls `/api/media/presigned` → get presigned URL + mediaId
2. Client uploads to S3 directly
3. Client calls `/api/media/confirm` → mark media uploaded → trigger processing
4. Client creates post with `mediaIds[]` → post references media records

### Soft Delete

- Post and Comment use `status` field (`DELETED`) — no physical delete.
- Maintains referential integrity for replies/likes.
- Cleanup (likes/saves/comments) dispatched async via message queue.

### Feed Strategy (Future — Hybrid)

- Normal users (< N followers): Fan-out on write — push post to followers' feed lists.
- Celebrities (> N followers): Fan-out on read — query on open.
- Feed stored in Redis sorted sets (score = post timestamp).

### Notification (Future)

- Message types pre-defined: `PostLikeMessage`, `PostCommentMessage`.
- Consumer processes messages → create notification records → push via WebSocket.

---

## File Structure (New/Modified)

```
src/
  domain/
    comment/                          ← NEW
      comment.type.ts
      comment.entity.ts
      comment.abstract.ts
      index.ts
    unit-of-work.ts                   ← MODIFIED (add likes, saves, comments)
    media/media.type.ts               ← MODIFIED (add POST_MEDIA)
    events/message.type.ts            ← MODIFIED (add post messages)
  application/
    dtos/post.dto.ts                  ← MODIFIED (add comment DTOs)
    usecases/
      post/                           ← NEW (15 use case files + index)
  infrastructure/
    database/
      models/comment.model.ts         ← NEW
      repositories/
        comment.repository.impl.ts    ← NEW
        index.ts                      ← MODIFIED (export comment repo)
      mongoose.unit-of-work.ts        ← MODIFIED (add comment/like/save repos)
    injection/post.injection.ts       ← NEW
  interfaces/
    validators/post.validator.ts      ← NEW
    controllers/post.controller.ts    ← NEW
    routes/
      post.route.ts                   ← NEW
      index.ts                        ← MODIFIED (register post route)
  shared/
    constants/router.constant.ts      ← MODIFIED (add comment routes)
```
