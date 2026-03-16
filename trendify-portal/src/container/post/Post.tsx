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
      profilePicture: "https://i.pravatar.cc/150?img=3",
      firstName: "Nguyễn",
      lastName: "Văn A",
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

// const postDummy = {
//   post: {
//     id: "69b13945dac98e511974f1a2",
//     type: "text",
//     content:
//       "Trong thời đại công nghệ số phát triển mạnh mẽ như hiện nay, mạng xã hội đã trở thành một phần không thể thiếu trong cuộc sống của con người. Thông qua các nền tảng trực tuyến, mọi người có thể dễ dàng kết nối, chia sẻ thông tin, hình ảnh và video với nhau chỉ trong vài giây. Điều này giúp rút ngắn khoảng cách địa lý và tạo ra nhiều cơ hội giao tiếp, học tập cũng như làm việc từ xa. Tuy nhiên, bên cạnh những lợi ích to lớn, mạng xã hội cũng mang lại không ít thách thức như việc lan truyền thông tin sai lệch, ảnh hưởng đến quyền riêng tư hay gây nghiện sử dụng. Vì vậy, mỗi người dùng cần có ý thức sử dụng mạng xã hội một cách thông minh và có trách nhiệm. Việc kiểm soát thời gian sử dụng, chọn lọc thông tin và tôn trọng người khác trên môi trường mạng là điều rất cần thiết. Khi được sử dụng đúng cách, mạng xã hội sẽ trở thành một công cụ hữu ích giúp con người kết nối và phát triển trong xã hội hiện đại.",
//     mentions: [],
//     hashtags: [],
//     status: "active",
//     settings: {
//       visibility: "public",
//       allowLike: true,
//       allowSave: true,
//       allowShare: true,
//       allowComment: true,
//       allowDownload: true,
//     },
//     isPinned: false,
//     counters: {
//       likeCount: 24,
//       viewCount: 312,
//       shareCount: 5,
//       commentCount: 8,
//       repostCount: 2,
//       saveCount: 11,
//     },
//     authorId: "697ecce7e4ba55404989e3b2",
//     author: {
//       id: "697ecce7e4ba55404989e3b2",
//       username: "nguyenvana",
//       displayName: "Nguyễn Văn A",
//       avatar: "https://i.pravatar.cc/150?img=3",
//     },
//     mediaIds: [],
//     createdAt: "2026-03-11T09:43:33.096Z",
//     updatedAt: "2026-03-11T09:43:33.096Z",
//     media: [],
//   },
//   viewerContext: {
//     isAuthor: false,
//     isFollowingAuthor: false,
//     isLiked: false,
//     isSaved: false,
//     canLike: true,
//     canSave: true,
//     canShare: true,
//     canComment: true,
//     canEdit: false,
//     canDelete: false,
//   },
// };

interface IProps {
  expandedTitle?: boolean;
}

const Post = ({ expandedTitle }: IProps) => {
  const { post, viewerContext } = postDummy;

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
