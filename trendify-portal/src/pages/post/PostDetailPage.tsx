import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Empty, Flex, Spin } from "antd";
import { useParams } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";

import "./PostDetailPage.scss";

import Post from "@/container/post/Post";
import { useAppDispatch, useAppSelector } from "@/stores";
import { IPost } from "@/interfaces/post.interface";
import { IComment } from "@/interfaces/comment.interface";
import { getPostAction, getPostCommentsAction } from "@/stores/post/actions";
import { EPostActions } from "@/stores/post/constants";
import PostCommentItem from "@/container/post/post-comment/PostCommentItem";
import PostCommentInput, {
  IPostCommentInputRef,
} from "@/container/post/post-comment/PostCommentInput";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";

const PostDetailPage = () => {
  const { id: postId } = useParams<{ id: string }>();
  const commentInputRef = useRef<HTMLDivElement | null>(null);
  const commentInputControlRef = useRef<IPostCommentInputRef | null>(null);
  const pinStartScrollTopRef = useRef<number>(0);

  const [isCommentInputPinned, setIsCommentInputPinned] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const userPosts = useAppSelector((state) => state.posts.userPosts);
  const draftPosts = useAppSelector((state) => state.posts.draftPosts.posts);
  const savedPosts = useAppSelector((state) => state.posts.savedPosts.posts);
  const followingPosts = useAppSelector((state) => state.posts.followingPosts.posts);
  const loadingPostDetail = useAppSelector((state) => state.loading[EPostActions.GET_POST_DETAIL]);
  const loadingPostComments = useAppSelector(
    (state) => state.loading[EPostActions.GET_POST_COMMENTS],
  );

  const cachedPost = useMemo(() => {
    if (!postId) return undefined;

    const fromDraft = draftPosts.find((post) => post.id === postId);
    if (fromDraft) return fromDraft;

    const fromSaved = savedPosts.find((post) => post.id === postId);
    if (fromSaved) return fromSaved;

    const fromFollowing = followingPosts.find((post) => post.id === postId);
    if (fromFollowing) return fromFollowing;

    for (const userId of Object.keys(userPosts)) {
      const fromUserPosts = userPosts[userId].posts.find((post) => post.id === postId);
      if (fromUserPosts) return fromUserPosts;
    }

    return undefined;
  }, [draftPosts, followingPosts, postId, savedPosts, userPosts]);

  const [postDetail, setPostDetail] = useState<IPost | null>(cachedPost ?? null);
  const [comments, setComments] = useState<IComment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState<boolean>(false);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const scrollContainer = document.getElementById("mainLayoutChildren");
    if (!scrollContainer) return;
    scrollContainer.scrollTo({ top: 0, behavior: "auto" });
  }, [postId]);

  useEffect(() => {
    if (cachedPost) {
      setPostDetail(cachedPost);
    }
  }, [cachedPost]);

  useEffect(() => {
    if (!postId) return;

    let isMounted = true;

    const fetchPostDetail = async () => {
      try {
        const response = await dispatch(getPostAction(postId)).unwrap();
        if (!isMounted) return;
        setPostDetail(response);
      } catch (error) {
        console.log("fetch post detail error:", error);
      }
    };

    fetchPostDetail();

    return () => {
      isMounted = false;
    };
  }, [dispatch, postId]);

  useEffect(() => {
    if (!postDetail?.id) return;

    const rafId = requestAnimationFrame(() => {
      commentInputControlRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [postDetail?.id]);

  useEffect(() => {
    setScrollParent(document.getElementById("mainLayoutChildren"));
  }, []);

  const fetchPostComments = useCallback(
    async (
      targetPostId: string,
      options?: {
        cursor?: string | null;
        append?: boolean;
      },
    ) => {
      try {
        const { cursor, append = false } = options || {};

        const response = await dispatch(
          getPostCommentsAction({
            postId: targetPostId,
            params: { limit: 20, cursor },
          }),
        ).unwrap();
        const fetchedComments = response.comments || [];

        setComments((prevComments) => {
          if (!append) {
            return fetchedComments;
          }

          const existingIds = new Set(prevComments.map((comment) => comment.id));
          const dedupedIncoming = fetchedComments.filter((comment) => !existingIds.has(comment.id));

          return [...prevComments, ...dedupedIncoming];
        });
        setNextCursor(response.nextCursor || null);
      } catch (error) {
        console.log("fetch post comments error:", error);
      } finally {
        setIsLoadingMoreComments(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!postId) {
      setComments([]);
      return;
    }

    setComments([]);
    setNextCursor(null);
    fetchPostComments(postId);
  }, [fetchPostComments, postId]);

  const loadMoreComments = useCallback(() => {
    if (!postId || !nextCursor || isLoadingMoreComments || loadingPostComments) {
      return;
    }

    setIsLoadingMoreComments(true);
    fetchPostComments(postId, {
      cursor: nextCursor,
      append: true,
    });
  }, [fetchPostComments, isLoadingMoreComments, loadingPostComments, nextCursor, postId]);

  const measurePinStart = useCallback(() => {
    const scrollContainer = document.getElementById("mainLayoutChildren");
    const commentInput = commentInputRef.current;
    if (!scrollContainer || !commentInput) return;

    const stickyTop = parseFloat(window.getComputedStyle(commentInput).top || "0");
    const containerRect = scrollContainer.getBoundingClientRect();
    const inputRect = commentInput.getBoundingClientRect();

    pinStartScrollTopRef.current =
      scrollContainer.scrollTop + (inputRect.top - containerRect.top) - stickyTop;
  }, []);

  const updatePinnedState = useCallback(() => {
    const scrollContainer = document.getElementById("mainLayoutChildren");
    if (!scrollContainer) return;

    const nextPinned = scrollContainer.scrollTop >= pinStartScrollTopRef.current - 1;
    setIsCommentInputPinned((prev) => (prev === nextPinned ? prev : nextPinned));
  }, []);

  useEffect(() => {
    const scrollContainer = document.getElementById("mainLayoutChildren");
    if (!scrollContainer) return;

    const syncPinnedState = () => {
      measurePinStart();
      updatePinnedState();
    };

    syncPinnedState();
    scrollContainer.addEventListener("scroll", updatePinnedState, { passive: true });
    window.addEventListener("resize", syncPinnedState);
    requestAnimationFrame(syncPinnedState);

    return () => {
      scrollContainer.removeEventListener("scroll", updatePinnedState);
      window.removeEventListener("resize", syncPinnedState);
    };
  }, [measurePinStart, updatePinnedState, postDetail]);

  const handleCommentSubmitted = useCallback((comment: IComment) => {
    setComments((prevComments) => {
      const exists = prevComments.some((item) => item.id === comment.id);
      if (exists) return prevComments;

      return [comment, ...prevComments];
    });

    setPostDetail((prevPostDetail) => {
      if (!prevPostDetail) return prevPostDetail;

      return {
        ...prevPostDetail,
        counters: {
          ...prevPostDetail.counters,
          commentCount: prevPostDetail.counters.commentCount + 1,
        },
      };
    });
  }, []);

  const handleCommentDeleted = useCallback((deletedComment: IComment, deletedCount: number = 1) => {
    setComments((prevComments) => prevComments.filter((item) => item.id !== deletedComment.id));

    setPostDetail((prevPostDetail) => {
      if (!prevPostDetail) return prevPostDetail;

      return {
        ...prevPostDetail,
        counters: {
          ...prevPostDetail.counters,
          commentCount: Math.max(0, prevPostDetail.counters.commentCount - deletedCount),
        },
      };
    });
  }, []);

  const handleNestedCommentCreated = useCallback(() => {
    setPostDetail((prevPostDetail) => {
      if (!prevPostDetail) return prevPostDetail;

      return {
        ...prevPostDetail,
        counters: {
          ...prevPostDetail.counters,
          commentCount: prevPostDetail.counters.commentCount + 1,
        },
      };
    });
  }, []);

  const renderCommentItem = useCallback(
    (_: number, comment: IComment) => (
      <div className="post-detail-page__comments-item">
        <PostCommentItem
          comment={comment}
          onDeleted={handleCommentDeleted}
          onCreated={handleNestedCommentCreated}
        />
      </div>
    ),
    [handleCommentDeleted, handleNestedCommentCreated],
  );

  const commentListComponents = useMemo(
    () => ({
      Footer: () => {
        if (isLoadingMoreComments) {
          return (
            <Flex className="post-detail-page__comments-footer" justify="center">
              <Spin size="small" />
            </Flex>
          );
        }

        return null;
      },
    }),
    [isLoadingMoreComments],
  );

  return (
    <Flex className="post-detail-page">
      <Flex className="post-detail-page__content" vertical>
        {loadingPostDetail && !postDetail ? (
          <Flex vertical gap={12}>
            {[1, 1].map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </Flex>
        ) : postDetail ? (
          <>
            <Post expandedTitle post={postDetail} viewerContext={postDetail.viewerContext} />

            <div
              ref={commentInputRef}
              className={`box-wrapper post-detail-page__comment-input ${
                isCommentInputPinned ? "post-detail-page__comment-input--pinned" : ""
              }`}
            >
              <PostCommentInput
                ref={commentInputControlRef}
                postId={postId}
                onSubmitted={handleCommentSubmitted}
              />
            </div>

            <Flex className="box-wrapper post-detail-page__comments" vertical gap={12}>
              {loadingPostComments && !comments.length ? (
                <PostSkeleton />
              ) : comments.length ? (
                <Virtuoso
                  className="post-detail-page__comments-list"
                  data={comments}
                  customScrollParent={scrollParent || undefined}
                  endReached={loadMoreComments}
                  increaseViewportBy={240}
                  itemContent={renderCommentItem}
                  components={commentListComponents}
                />
              ) : (
                <Empty description="Chua co binh luan nao" />
              )}
            </Flex>
          </>
        ) : (
          <Flex className="box-wrapper post-detail-page__empty" justify="center">
            <Empty description="Không tìm thấy bài viết" />
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default PostDetailPage;
