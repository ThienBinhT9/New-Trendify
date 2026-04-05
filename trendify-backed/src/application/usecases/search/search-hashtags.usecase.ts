import * as Response from "@/shared/responses";
import { SearchHashtagsDTO } from "@/application/dtos/search.dto";
import { PostModel } from "@/infrastructure/database/models/post.model";

// ============================================================================
// SEARCH HASHTAGS USE CASE
// ============================================================================

export interface HashtagResult {
  tag: string;
  postCount: number;
}

export class SearchHashtagsUseCase {
  async execute(dto: SearchHashtagsDTO) {
    const { query, limit = 10, cursor } = dto;

    if (!query || query.trim().length === 0) {
      throw new Response.BadRequestError("Search query is required");
    }

    // Normalize: remove # prefix, lowercase
    const normalizedQuery = query.trim().toLowerCase().replace(/^#/, "");

    // Escape regex special chars
    const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Aggregate: tìm hashtags matching prefix, group by tag, count posts
    const pipeline: any[] = [
      // Chỉ active, public posts
      {
        $match: {
          status: "active",
          "settings.visibility": "public",
          "hashtags.tag": { $regex: `^${escapedQuery}`, $options: "i" },
        },
      },
      // Unwind hashtags array
      { $unwind: "$hashtags" },
      // Filter hashtags matching the query
      {
        $match: {
          "hashtags.tag": { $regex: `^${escapedQuery}`, $options: "i" },
        },
      },
      // Group by tag, count posts
      {
        $group: {
          _id: "$hashtags.tag",
          postCount: { $sum: 1 },
        },
      },
      // Sort by post count desc
      { $sort: { postCount: -1, _id: 1 } },
    ];

    // Cursor-based pagination using tag name
    if (cursor) {
      pipeline.push({
        $match: { _id: { $gt: cursor } },
      });
    }

    pipeline.push({ $limit: limit + 1 });

    const results = await PostModel.aggregate<{ _id: string; postCount: number }>(pipeline);

    const hasNext = results.length > limit;
    const sliced = hasNext ? results.slice(0, limit) : results;

    const hashtags: HashtagResult[] = sliced.map((r) => ({
      tag: r._id,
      postCount: r.postCount,
    }));

    const nextCursor = hasNext ? sliced[sliced.length - 1]._id : undefined;

    return {
      hashtags,
      nextCursor,
      resultCount: hashtags.length,
    };
  }
}
