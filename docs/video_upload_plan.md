# 🎬 Video Upload Support — Analysis & Implementation Plan

## 📊 Current Status Analysis

### ✅ Backend — Already Partially Supports Video

| Component | Status | Details |
|-----------|--------|---------|
| `media.type.ts` — MIME types | ✅ Ready | `video/mp4`, `video/quicktime` already in `MEDIA_LIMITS[POST_MEDIA]` |
| `media.type.ts` — Size limit | ✅ Ready | 50MB limit for `POST_MEDIA` |
| `media.type.ts` — Metadata | ✅ Ready | `IMediaMetadata` has `duration`, `codec` fields |
| `media.entity.ts` — `isVideo()` | ✅ Ready | Method exists |
| `post.type.ts` — `EPostType.VIDEO` | ✅ Ready | Enum value exists |
| `media.validator.ts` — Validation | ✅ Ready | Accepts video MIME types |
| Presigned URL flow | ✅ Ready | Works for any content type |
| Confirm Upload flow | ✅ Ready | Works for any media |
| **`media.consumer.ts` — Processing** | ❌ **Missing** | Only handles images with `sharp`, no `ffmpeg` video processing |
| **`request-presigned-url.usecase.ts`** | ⚠️ Partial | `mimeToExt()` only maps image types, missing `.mp4`, `.mov` |
| `ffmpeg-static` + `fluent-ffmpeg` | ✅ Installed | Already in `package.json` but **not used anywhere** |

### ❌ Frontend — No Video Support

| Component | Status | Details |
|-----------|--------|---------|
| `IPostMedia` interface | ✅ Ready | Already has `type: "image" \| "video" \| "gif"`, `duration` field |
| `PostMedia.tsx` | ❌ **Missing** | Only renders `<img>`, no `<video>` tag support |
| `Post.scss` | ❌ **Missing** | No video-specific styles |
| Preview Modal | ❌ **Missing** | Only shows images in lightbox |

---

## 🎯 Recommended Video Limits

> [!IMPORTANT]
> These limits balance user experience, server costs, and processing time.

| Parameter | Recommended | Reasoning |
|-----------|------------|-----------|
| **Max file size** | **50MB** (keep current) | Good for mobile-first social media |
| **Max duration** | **60 seconds** | Instagram Reels-like, keeps processing fast |
| **Max resolution** | **1080p** (1920×1080) | Beyond this → wasteful for mobile feeds |
| **Allowed formats** | `video/mp4`, `video/quicktime` | Most universal browser/phone support |
| **Max videos per post** | **1** | Simplifies UX and processing |
| **Thumbnail generation** | Auto at **1st second** | Cover frame for feed display |

---

## 🛠️ Implementation Plan

### Phase 1: Backend — Video Processing in `MediaConsumer`

**File:** `trendify-backed/src/infrastructure/messaging/consumers/media.consumer.ts`

Changes:
1. Route `handleProcessMedia` by MIME type → `processImage()` or `processVideo()`
2. Add `processVideo()` method using `fluent-ffmpeg`:
   - Extract metadata (duration, resolution, codec)
   - **Validate** duration ≤ 60s on server side
   - Generate **thumbnail** at 1s mark (JPEG → upload to S3)
   - Transcode to **720p MP4** (H.264 + AAC) as `MEDIUM` variant
   - Keep original as `ORIGINAL` variant
3. Update `mimeToExt()` in `request-presigned-url.usecase.ts` to include video types

### Phase 2: Backend — Add Video Validation Constants

**File:** `trendify-backed/src/domain/media/media.type.ts`

Add:
```typescript
export const VIDEO_LIMITS = {
  maxDuration: 60, // seconds
  maxResolutionWidth: 1920,
  maxResolutionHeight: 1080,
  thumbnailTimestamp: 1, // seconds
  transcodedWidth: 720,
  transcodedHeight: 1280,
};
```

### Phase 3: Frontend — `PostMedia.tsx` Video Rendering

Changes:
1. Check `item.type` → render `<video>` or `<img>` accordingly
2. Video in feed: show **thumbnail** with play icon overlay, autoplay muted on hover (optional)
3. Video in preview modal: full `<video>` player with controls
4. Add video-specific SCSS styles

### Phase 4: Frontend — `Post.scss` Video Styles

Add styles for:
- `.post-media-video` — video element in feed
- `.post-media-video-overlay` — play button overlay
- `.post-media-preview-video` — video in lightbox modal
- Duration badge overlay

---

## 📁 Files to Modify

### Backend
1. `media.consumer.ts` — Add video processing with ffmpeg
2. `media.type.ts` — Add `VIDEO_LIMITS` constants
3. `request-presigned-url.usecase.ts` — Add video MIME → extension mapping

### Frontend
4. `PostMedia.tsx` — Add video rendering support
5. `Post.scss` — Add video styles

Ready to implement? Let me know if you want to adjust the limits or approach!
