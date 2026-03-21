import { useState } from "react";
import { Flex } from "antd";

import "./Post.scss";
import { formatNumberCount } from "@/utils/common.util";

import Icon from "@/components/icon/Icon";
import Text from "@/components/text/Text";
import PostTitle from "./PostTitle";
import PostHeader from "./PostHeader";
import ModalLikePost from "@/container/modal/LikePost";
import ModalDetailPost from "@/container/modal/DetailPost";
import { EPostStatus, IPost, IPostViewerContext } from "@/interfaces/post.interface";
import { EVisibility } from "@/interfaces/common.interface";

const postDummy: { post: IPost; viewerContext: IPostViewerContext } = {
  post: {
    id: "69b13945dac98e511974f1a2",
    type: "text",
    content:
      "Vừa trở về từ Cát Bà sau 3 ngày mà lòng vẫn còn bồi hồi lắm 🌊\nBuổi sáng đầu tiên thức dậy, mở cửa sổ nhìn ra vịnh\nSương mù còn giăng mờ trên mặt biển — đẹp đến nỗi không muốn rời mắt\nChiều hôm đó rủ @thaonguyen đi kayak khám phá hang động\nHai đứa vừa chèo vừa cười vì không ai biết chèo cả 😂\nTối về ngồi ăn hải sản tươi sống ngay bến cảng cùng @minhduc\nCon ghẹ rang me to bằng cái mâm mà giá chỉ mấy chục nghìn\nCát Bà ơi, hẹn gặp lại! 🦀🏝️\n#CátBà #DuLịchHèNày #ViệtNamĐẹpLắm\nVừa trở về từ Cát Bà sau 3 ngày mà lòng vẫn còn bồi hồi lắm 🌊\nBuổi sáng đầu tiên thức dậy, mở cửa sổ nhìn ra vịnh\nSương mù còn giăng mờ trên mặt biển — đẹp đến nỗi không muốn rời mắt\nChiều hôm đó rủ @thaonguyen đi kayak khám phá hang động\nHai đứa vừa chèo vừa cười vì không ai biết chèo cả 😂\nTối về ngồi ăn hải sản tươi sống ngay bến cảng cùng @minhduc\nCon ghẹ rang me to bằng cái mâm mà giá chỉ mấy chục nghìn\nCát Bà ơi, hẹn gặp lại! 🦀🏝️\n#CátBà #DuLịchHèNày #ViệtNamĐẹpLắm\nVừa trở về từ Cát Bà sau 3 ngày mà lòng vẫn còn bồi hồi lắm 🌊\nBuổi sáng đầu tiên thức dậy, mở cửa sổ nhìn ra vịnh\nSương mù còn giăng mờ trên mặt biển — đẹp đến nỗi không muốn rời mắt\nChiều hôm đó rủ @thaonguyen đi kayak khám phá hang động\nHai đứa vừa chèo vừa cười vì không ai biết chèo cả 😂\nTối về ngồi ăn hải sản tươi sống ngay bến cảng cùng @minhduc\nCon ghẹ rang me to bằng cái mâm mà giá chỉ mấy chục nghìn\nCát Bà ơi, hẹn gặp lại! 🦀🏝️\n#CátBà #DuLịchHèNày #ViệtNamĐẹpLắm\nVừa trở về từ Cát Bà sau 3 ngày mà lòng vẫn còn bồi hồi lắm 🌊\nBuổi sáng đầu tiên thức dậy, mở cửa sổ nhìn ra vịnh\nSương mù còn giăng mờ trên mặt biển — đẹp đến nỗi không muốn rời mắt\nChiều hôm đó rủ @thaonguyen đi kayak khám phá hang động\nHai đứa vừa chèo vừa cười vì không ai biết chèo cả 😂\nTối về ngồi ăn hải sản tươi sống ngay bến cảng cùng @minhduc\nCon ghẹ rang me to bằng cái mâm mà giá chỉ mấy chục nghìn\nCát Bà ơi, hẹn gặp lại! 🦀🏝️\n#CátBà #DuLịchHèNày #ViệtNamĐẹpLắm",
    mentions: [
      {
        userId: "697ecce7e4ba55404989e3b3",
        username: "thaonguyen",
        startIndex: 200,
        endIndex: 211,
      },
      {
        userId: "697ecce7e4ba55404989e3b9",
        username: "minhduc",
        startIndex: 346,
        endIndex: 354,
      },
    ],
    hashtags: [
      { tag: "cátbà", startIndex: 443, endIndex: 449 },
      { tag: "dulịchhènày", startIndex: 450, endIndex: 462 },
      { tag: "việtnamđẹplắm", startIndex: 463, endIndex: 477 },
    ],
    status: EPostStatus.ACTIVE,
    settings: {
      visibility: EVisibility.public,
      allowLike: true,
      allowSave: true,
      allowShare: true,
      allowComment: true,
      allowDownload: true,
    },
    isPinned: false,
    counters: {
      likeCount: 2400000,
      viewCount: 312,
      shareCount: 5534,
      commentCount: 80032,
      repostCount: 2,
      saveCount: 11,
    },
    author: {
      id: "697ecce7e4ba55404989e3b2",
      username: "nguyenvana",
      profilePicture: {
        small: "https://i.pravatar.cc/150?img=3",
      },
      displayName: "Nguyễn Văn A",
    },
    createdAt: "2026-03-11T09:43:33.096Z",
    updatedAt: "2026-03-11T09:43:33.096Z",
  },
  viewerContext: {
    isAuthor: true,
    isFollowingAuthor: false,
    isLiked: false,
    isSaved: false,
    canLike: true,
    canSave: true,
    canShare: true,
    canComment: true,
    canEdit: true,
    canDelete: true,
  },
};

interface IProps {
  expandedTitle?: boolean;
  post?: IPost;
  viewerContext?: IPostViewerContext;
}

const Post = ({
  expandedTitle,
  post = postDummy.post,
  viewerContext = postDummy.viewerContext,
}: IProps) => {
  const [visibleModalLike, setVisibleModalLike] = useState<boolean>(false);
  const [visibleModalDetail, setVisibleModalDetail] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(post.counters.likeCount);

  const handleClickLike = () => {
    if (isLiked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setIsLiked((prev) => !prev);
  };

  return (
    <Flex className="box-wrapper post-container">
      <PostHeader post={post} viewerContext={viewerContext} />
      <PostTitle
        expandedTitle={expandedTitle}
        content={post.content}
        mentions={post.mentions ?? []}
        hashtags={post.hashtags ?? []}
      />

      <Flex className="post-actions">
        <Flex
          className={`post-action ${isLiked ? "post-action__liked" : ""}`}
          onClick={handleClickLike}
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
        <Flex className="post-action" onClick={() => setVisibleModalDetail(true)}>
          <Icon name="CommentIcon" />
          <Text className="post-action__text">{`${formatNumberCount(post.counters.commentCount)}`}</Text>
        </Flex>
        <Flex className="post-action">
          <Icon name="ShareIcon" />
          <Text className="post-action__text">{`${formatNumberCount(post.counters.shareCount)}`}</Text>
        </Flex>
      </Flex>

      <ModalDetailPost open={visibleModalDetail} onCancel={() => setVisibleModalDetail(false)} />

      {visibleModalLike && (
        <ModalLikePost open={visibleModalLike} onCancel={() => setVisibleModalLike(false)} />
      )}
    </Flex>
  );
};

export default Post;
