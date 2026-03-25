import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Empty, Flex } from "antd";
import { useParams } from "react-router-dom";

import "./PostDetailPage.scss";

import Post from "@/container/post/Post";
import { useAppDispatch, useAppSelector } from "@/stores";
import { IPost } from "@/interfaces/post.interface";
import { IComment } from "@/interfaces/comment.interface";
import { getPostAction } from "@/stores/post/actions";
import { EPostActions } from "@/stores/post/constants";
import PostCommentItem from "@/container/post/post-comment/PostCommentItem";
import PostCommentInput, {
  IPostCommentInputRef,
} from "@/container/post/post-comment/PostCommentInput";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";

const mockComment: IComment = {
  id: "comment_001",
  postId: "",
  content:
    "Bài viết hay quá, mình cũng từng đi chỗ này rồi. Cảm ơn bạn đã chia sẻ trải nghiệm nhé!",
  mentions: [],
  hashtags: [],
  author: {
    id: "697ecce7e4ba55404989e3b5",
    username: "linhpham",
    displayName: "Linh Phạm",
    profilePicture: { original: "https://i.pravatar.cc/150?img=9" },
  },
  counters: {
    likeCount: 12,
    replyCount: 2,
  },
  viewerContext: {
    isAuthorPost: false,
    isAuthor: false,
    isLiked: false,
    canDelete: false,
  },
  parentId: null,
  createdAt: "2026-03-11T10:15:00.000Z",
  updatedAt: "2026-03-11T10:15:00.000Z",
};

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

  const comment = useMemo(() => {
    if (!postId) return mockComment;
    return { ...mockComment, postId };
  }, [postId]);

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
              <PostCommentInput ref={commentInputControlRef} postId={postId} />
            </div>

            <Flex className="box-wrapper post-detail-page__comments" vertical gap={12}>
              <PostCommentItem comment={comment} />
              <PostCommentItem comment={comment} />
              <PostCommentItem comment={comment} />
              <PostCommentItem comment={comment} />
              <PostCommentItem comment={comment} />
              <PostCommentItem comment={comment} />
              <PostCommentItem comment={comment} />
              <PostCommentItem comment={comment} />
              <PostCommentItem comment={comment} />
              <PostCommentItem comment={comment} />
              <PostCommentItem comment={comment} />
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
