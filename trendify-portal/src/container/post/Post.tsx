import { memo, useCallback } from "react";
import { Flex } from "antd";
import { useNavigate } from "react-router-dom";

import "./Post.scss";
import ROUTE_PATHS from "@/routes/path.route";

import PostTitle from "./PostTitle";
import PostHeader from "./PostHeader";
import PostAction from "./PostAction";
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

const Post = ({ expandedTitle, post = postDummy.post, viewerContext }: IProps) => {
  const navigate = useNavigate();
  const resolvedViewerContext = viewerContext ?? post.viewerContext ?? postDummy.viewerContext;

  const handleNavigateToDetail = useCallback(() => {
    if (!post.id) return;

    navigate(ROUTE_PATHS.POST_DETAIL(post.id));
  }, [navigate, post.id]);

  return (
    <Flex className="box-wrapper post-container" onClick={handleNavigateToDetail}>
      <Flex onClick={(e) => e.stopPropagation()}>
        <PostHeader post={post} viewerContext={resolvedViewerContext} />
      </Flex>
      <PostTitle
        expandedTitle={expandedTitle}
        content={post.content}
        mentions={post.mentions ?? []}
        hashtags={post.hashtags ?? []}
        onSeeMore={handleNavigateToDetail}
      />

      <PostAction
        post={post}
        viewerContext={resolvedViewerContext}
        onNavigateToDetail={handleNavigateToDetail}
      />
    </Flex>
  );
};

export default memo(Post);
