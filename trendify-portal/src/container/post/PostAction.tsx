import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Flex } from "antd";

import { formatNumberCount } from "@/utils/common.util";
import { useAppDispatch } from "@/stores";
import { likePostAction, unlikePostAction } from "@/stores/post/actions";

import Icon from "@/components/icon/Icon";
import Text from "@/components/text/Text";
import ModalLikePost from "@/container/modal/LikePost";
import { IPost, IPostViewerContext } from "@/interfaces/post.interface";

const LIKE_TRAILING_DEBOUNCE_MS = 300;

interface PostActionProps {
  post: IPost;
  viewerContext: IPostViewerContext;
  onNavigateToDetail: () => void;
}

const PostAction = ({ post, viewerContext, onNavigateToDetail }: PostActionProps) => {
  const dispatch = useAppDispatch();

  const [visibleModalLike, setVisibleModalLike] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(viewerContext.isLiked);
  const [likeCount, setLikeCount] = useState<number>(post.counters.likeCount);

  const desiredLikeStateRef = useRef<boolean>(viewerContext.isLiked);
  const committedLikeStateRef = useRef<boolean>(viewerContext.isLiked);
  const committedLikeCountRef = useRef<number>(post.counters.likeCount);
  const isMutatingLikeRef = useRef<boolean>(false);
  const activePostIdRef = useRef<string>(post.id);
  const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTrailingSyncRef = useRef<boolean>(false);

  const clearTrailingTimer = useCallback(() => {
    if (!trailingTimerRef.current) return;
    clearTimeout(trailingTimerRef.current);
    trailingTimerRef.current = null;
  }, []);

  useEffect(() => {
    const nextLiked = viewerContext.isLiked;
    const nextLikeCount = post.counters.likeCount;

    if (activePostIdRef.current !== post.id) {
      activePostIdRef.current = post.id;
      isMutatingLikeRef.current = false;
      pendingTrailingSyncRef.current = false;
      clearTrailingTimer();
    } else if (isMutatingLikeRef.current) {
      return;
    }

    desiredLikeStateRef.current = nextLiked;
    committedLikeStateRef.current = nextLiked;
    committedLikeCountRef.current = nextLikeCount;

    setIsLiked(nextLiked);
    setLikeCount(nextLikeCount);
  }, [clearTrailingTimer, post.id, post.counters.likeCount, viewerContext.isLiked]);

  useEffect(() => () => clearTrailingTimer(), [clearTrailingTimer]);

  const syncLikeStatus = useCallback(async () => {
    if (isMutatingLikeRef.current) {
      pendingTrailingSyncRef.current = true;
      return;
    }
    if (desiredLikeStateRef.current === committedLikeStateRef.current) {
      pendingTrailingSyncRef.current = false;
      return;
    }

    const requestPostId = activePostIdRef.current;
    const targetLiked = desiredLikeStateRef.current;
    const previousCommittedLiked = committedLikeStateRef.current;
    const previousCommittedLikeCount = committedLikeCountRef.current;
    const commitLocalLikeState = () => {
      committedLikeStateRef.current = targetLiked;
      committedLikeCountRef.current = Math.max(
        0,
        previousCommittedLikeCount +
          (targetLiked === previousCommittedLiked ? 0 : targetLiked ? 1 : -1),
      );
    };

    isMutatingLikeRef.current = true;
    try {
      if (targetLiked) {
        await dispatch(likePostAction(post.id)).unwrap();
      } else {
        await dispatch(unlikePostAction(post.id)).unwrap();
      }
      if (activePostIdRef.current !== requestPostId) return;

      commitLocalLikeState();
    } catch {
      if (activePostIdRef.current !== requestPostId) return;
      // Keep optimistic UI and mark local committed state to avoid retry bursts.
      commitLocalLikeState();
    } finally {
      isMutatingLikeRef.current = false;
      const isStaleResponse = activePostIdRef.current !== requestPostId;
      if (isStaleResponse) {
        pendingTrailingSyncRef.current = false;
      } else if (pendingTrailingSyncRef.current) {
        pendingTrailingSyncRef.current = false;
        void syncLikeStatus();
      }
    }
  }, [dispatch, post.id]);

  const scheduleTrailingSync = useCallback(() => {
    clearTrailingTimer();
    trailingTimerRef.current = setTimeout(() => {
      trailingTimerRef.current = null;
      pendingTrailingSyncRef.current = true;
      void syncLikeStatus();
    }, LIKE_TRAILING_DEBOUNCE_MS);
  }, [clearTrailingTimer, syncLikeStatus]);

  const handleClickLike = () => {
    const canToggleLike =
      viewerContext.canLike || desiredLikeStateRef.current || committedLikeStateRef.current;
    if (!canToggleLike) return;

    const previousDesired = desiredLikeStateRef.current;
    const previousCommitted = committedLikeStateRef.current;
    const hasTrailingTimer = !!trailingTimerRef.current;

    const nextLiked = !previousDesired;
    desiredLikeStateRef.current = nextLiked;

    setIsLiked(nextLiked);
    setLikeCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

    const shouldSendLeadingNow =
      !isMutatingLikeRef.current && !hasTrailingTimer && previousDesired === previousCommitted;

    if (shouldSendLeadingNow) {
      void syncLikeStatus();
    }

    scheduleTrailingSync();
  };

  return (
    <>
      <Flex className="post-actions">
        <Flex
          className={`post-action ${isLiked ? "post-action__liked" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            handleClickLike();
          }}
        >
          <Icon name={isLiked ? "HeartFillIcon" : "HeartAltIcon"} />
          <Text
            className="post-action__text"
            onClick={(e) => {
              e.stopPropagation();
              setVisibleModalLike(true);
            }}
          >{`${formatNumberCount(likeCount)}`}</Text>
        </Flex>
        <Flex
          className="post-action"
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToDetail();
          }}
        >
          <Icon name="CommentIcon" />
          <Text className="post-action__text">{`${formatNumberCount(post.counters.commentCount)}`}</Text>
        </Flex>
        <Flex className="post-action" onClick={(e) => e.stopPropagation()}>
          <Icon name="ShareIcon" />
          <Text className="post-action__text">{`${formatNumberCount(post.counters.shareCount)}`}</Text>
        </Flex>
      </Flex>

      {visibleModalLike && (
        <ModalLikePost open={visibleModalLike} onCancel={() => setVisibleModalLike(false)} />
      )}
    </>
  );
};

export default memo(PostAction);
