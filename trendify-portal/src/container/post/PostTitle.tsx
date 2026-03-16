import { ContentPart, IPostHashtag, IPostMention } from "@/interfaces/post.interface";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Post.scss";
import TruncateMarkup from "react-truncate-markup";
import { Flex } from "antd";

const parsePostContent = (
  content: string,
  mentions: IPostMention[],
  hashtags: IPostHashtag[],
): ContentPart[] => {
  const segments = [
    ...mentions.map((m) => ({ type: "mention" as const, ...m })),
    ...hashtags.map((h) => ({ type: "hashtag" as const, ...h })),
  ].sort((a, b) => a.startIndex - b.startIndex);

  const parts: ContentPart[] = [];
  let cursor = 0;

  segments.forEach((seg) => {
    if (cursor < seg.startIndex) {
      parts.push({ type: "text", value: content.slice(cursor, seg.startIndex) });
    }
    if (seg.type === "mention") {
      parts.push({ type: "mention", userId: seg.userId, username: seg.username });
    } else {
      parts.push({ type: "hashtag", tag: seg.tag });
    }
    cursor = seg.endIndex;
  });

  if (cursor < content.length) {
    parts.push({ type: "text", value: content.slice(cursor) });
  }

  return parts;
};

interface IProps {
  expandedTitle?: boolean;
  content: string;
  mentions: IPostMention[];
  hashtags: IPostHashtag[];
}

const PostTitle = ({ expandedTitle = false, content, mentions, hashtags }: IProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(expandedTitle);

  const parts = parsePostContent(content, mentions, hashtags);

  const renderParts = parts.map((part, i) => {
    if (part.type === "text") return <span key={i}>{part.value}</span>;
    if (part.type === "mention") {
      return (
        <span
          key={i}
          className="post-content__mention"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${part.userId}`);
          }}
        >
          {part.username}
        </span>
      );
    }
    if (part.type === "hashtag") {
      return (
        <span
          key={i}
          className="post-content__hashtag"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/hashtag/${part.tag}`);
          }}
        >
          #{part.tag}
        </span>
      );
    }
  });

  return (
    <Flex className="post-title">
      {expanded ? (
        <p className="post-content">{renderParts}</p>
      ) : (
        <TruncateMarkup
          lines={4}
          ellipsis={
            <span
              className="post-content__see-more"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
            >
              {` ...Xem thêm`}
            </span>
          }
        >
          <p className="post-content">{renderParts}</p>
        </TruncateMarkup>
      )}
    </Flex>
  );
};

export default PostTitle;
