import { useState } from "react";
import { MentionsInput, Mention } from "react-mentions";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Avatar, Flex, Image, Popover, Upload, UploadFile, UploadProps } from "antd";

import "./PostComment.scss";
import { handleBeforeUpload } from "@/utils/common.util";

import Icon from "@/components/icon/Icon";
import LoaderSpin from "@/components/loader/LoaderPuff";

const PostCommentInput = () => {
  const [file, setFile] = useState<UploadFile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isFocus, setIsFocus] = useState<boolean>(false);
  const [plainText, setPlainText] = useState<string>("");
  const [filePreview, setFilePreview] = useState<{ uid: string; url: string } | null>(null);

  const handleRemoveImage = () => {
    if (filePreview) URL.revokeObjectURL(filePreview.url);

    setFile(null);
    setFilePreview(null);
  };

  const handleChangeFile: UploadProps["onChange"] = ({ fileList }) => {
    const file = fileList[0];

    if (file.originFileObj) {
      if (filePreview) URL.revokeObjectURL(filePreview.url);

      const url = URL.createObjectURL(file.originFileObj);
      setFile(file);
      setIsFocus(true);
      setFilePreview({ uid: file.uid, url });
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setPlainText((prev) => prev + emojiData.emoji);
    setIsFocus(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await new Promise((resolve) => setTimeout(() => resolve([]), 2000));
    } catch (error) {
      console.log("handle comment error: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex className="post-comment-input">
      <Avatar
        className="comment-box__avatar"
        src="https://i.pinimg.com/1200x/ec/ba/f0/ecbaf03acbe4c5556bbe1756ff482b42.jpg"
      />

      <Flex className={`comment-box__input-wrapper ${isFocus && "focus"}`} flex={1}>
        <MentionsInput
          value={plainText}
          className="comment-box__input"
          placeholder="Thêm bình luận..."
          onFocus={() => setIsFocus(true)}
          onChange={(event, newValue, newPlainTextValue) => {
            console.log({ event, newValue });
            setPlainText(newPlainTextValue);
          }}
        >
          <Mention
            trigger="@"
            data={[
              { id: "1", display: "Phong" },
              { id: "2", display: "Mai Anh" },
            ]}
            markup="@__display__(__id__)"
            displayTransform={(_, display) => `@${display}`}
          />
          <Mention
            trigger="#"
            data={[
              { id: "101", display: "ReactJS" },
              { id: "102", display: "NextJS" },
            ]}
            markup="#__display__(__id__)"
            displayTransform={(_, display) => `@${display}`}
          />
        </MentionsInput>
        {filePreview && (
          <Flex className="comment-box__preview">
            <Image preview={{ mask: null }} src={filePreview?.url} />
            <Flex className="comment-box__preview-close" onClick={handleRemoveImage}>
              <Icon name="CloseIcon" />
            </Flex>
          </Flex>
        )}
        <Flex className={`comment-box__actions`}>
          <Flex align="center" gap={8}>
            <Popover
              content={<EmojiPicker height={260} width={320} onEmojiClick={handleEmojiClick} />}
              placement="bottom"
              trigger={["click"]}
              className="custom-popover"
            >
              <Icon name="EmojiSmileIcon" />
            </Popover>
            <Upload
              maxCount={1}
              accept="image/*"
              showUploadList={false}
              onChange={handleChangeFile}
              beforeUpload={handleBeforeUpload}
              fileList={file ? [file] : []}
            >
              {!filePreview && <Icon name="CameraIcon" />}
            </Upload>
          </Flex>
          {isFocus &&
            (loading ? <LoaderSpin /> : <Icon name="SendBlackIcon" onClick={handleSubmit} />)}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default PostCommentInput;
