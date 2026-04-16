import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Avatar, Flex, Image, Popover, Upload, UploadFile, UploadProps } from "antd";
import { EditorContent, useEditor } from "@tiptap/react";
import Mention, { MentionNodeAttrs } from "@tiptap/extension-mention";
import { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import tippy, { Instance } from "tippy.js";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import "./PostComment.scss";
import { handleBeforeUpload, getAvatarUrl } from "@/utils/common.util";
import { listFollowing } from "@/stores/profile/api";
import { useAppDispatch, useAppSelector } from "@/stores";
import { IUserSuggestion } from "@/interfaces/user.interface";
import { IComment, ICommentMention } from "@/interfaces/comment.interface";
import { commentPostAction } from "@/stores/post/actions";
import { confirmUploadAction, presignedAction } from "@/stores/upload/action";
import { EMediaPurpose } from "@/interfaces/common.interface";

import Icon from "@/components/icon/Icon";
import LoaderSpin from "@/components/loader/LoaderPuff";

export interface IPostCommentInputRef {
  focus: () => void;
}

interface PostCommentInputProps {
  postId?: string;
  parentId?: string | null;
  replyDisplayName?: string;
  onSubmitted?: (comment: IComment) => void;
}

interface ICommentMentionItem extends MentionNodeAttrs {
  id: string;
  label: string;
  username: string;
  display: string;
  avatar: string;
}

interface ICommentMentionAttrs extends MentionNodeAttrs {
  username?: string | null;
}

const CommentMention = Mention.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      username: {
        default: null,
      },
    };
  },
});

const HashtagHighlight = Extension.create({
  name: "hashtagHighlight",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, pos) => {
              if (!node.isText) return;

              const text = node.text || "";
              const hashtagRegex = /(^|\s)(#[\p{L}\p{N}_]+)/gu;
              let match: RegExpExecArray | null = null;

              while ((match = hashtagRegex.exec(text)) !== null) {
                const prefix = match[1] || "";
                const hashtag = match[2] || "";

                if (!hashtag) continue;

                const from = pos + match.index + prefix.length;
                const to = from + hashtag.length;

                decorations.push(Decoration.inline(from, to, { class: "hashtag-highlight" }));
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

const PostCommentInput = forwardRef<IPostCommentInputRef, PostCommentInputProps>((props, ref) => {
  const { postId, parentId, replyDisplayName, onSubmitted } = props;

  const normalizedReplyDisplayName = replyDisplayName?.trim();
  const placeholderText = normalizedReplyDisplayName
    ? `Trả lời ${normalizedReplyDisplayName}...`
    : "Thêm bình luận...";

  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);

  const [file, setFile] = useState<UploadFile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isFocus, setIsFocus] = useState<boolean>(false);
  const [filePreview, setFilePreview] = useState<{ uid: string; url: string } | null>(null);
  const [plainText, setPlainText] = useState<string>("");
  const [mentions, setMentions] = useState<ICommentMention[]>([]);
  const inputRef = useRef<{ focus: () => void } | null>(null);
  const mentionLoadingRef = useRef<boolean>(false);
  const mentionUserMapRef = useRef<Map<string, string>>(new Map());
  const mentionRequestSeqRef = useRef<number>(0);
  const mentionRenderItemsRef = useRef<(() => void) | null>(null);
  const mentionDebounceTimerRef = useRef<number | null>(null);

  const escapeHtml = useCallback((text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }, []);

  const setMentionLoading = useCallback((value: boolean) => {
    mentionLoadingRef.current = value;
    mentionRenderItemsRef.current?.();
  }, []);

  const fetchMentionUsers = useCallback(
    async (query: string) => {
      if (!authUser?.id) return [] as IUserSuggestion[];

      try {
        const response = await listFollowing(authUser.id, { query });
        const users = response.data.data.users;

        return users
          .filter((user) => !!user.username)
          .map((user) => ({
            id: user.id,
            username: user.username || "",
            display: `${user.firstName} ${user.lastName || ""}`.trim(),
            profilePicture:
              user.profilePicture?.small ||
              user.profilePicture?.medium ||
              user.profilePicture?.original,
          })) as IUserSuggestion[];
      } catch {
        return [] as IUserSuggestion[];
      }
    },
    [authUser?.id],
  );

  const debouncedFetchMentionUsers = useCallback(
    (query: string) => {
      return new Promise<IUserSuggestion[]>((resolve) => {
        if (mentionDebounceTimerRef.current) {
          window.clearTimeout(mentionDebounceTimerRef.current);
        }

        const requestSeq = ++mentionRequestSeqRef.current;

        mentionDebounceTimerRef.current = window.setTimeout(async () => {
          const users = await fetchMentionUsers(query);

          if (requestSeq !== mentionRequestSeqRef.current) {
            resolve([]);
            return;
          }

          resolve(users);
        }, 300);
      });
    },
    [fetchMentionUsers],
  );

  useEffect(() => {
    return () => {
      if (mentionDebounceTimerRef.current) {
        window.clearTimeout(mentionDebounceTimerRef.current);
      }

      mentionRequestSeqRef.current += 1;
    };
  }, []);

  const mentionSuggestion: Omit<SuggestionOptions<ICommentMentionItem>, "editor"> = {
    char: "@",
    shouldShow: () => true,
    command: ({ editor: tiptapEditor, range, props }) => {
      if (!props.id || !props.label || !props.username) return;

      mentionUserMapRef.current.set(props.id, props.username);

      tiptapEditor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: "mention",
            attrs: {
              id: props.id,
              label: props.label,
              username: props.username,
            },
          },
          { type: "text", text: " " },
        ])
        .run();
    },
    items: async ({ query }) => {
      const normalizedQuery = query.trim();
      setMentionLoading(true);
      const users = await debouncedFetchMentionUsers(normalizedQuery);
      const mapped = users.map((user) => ({
        id: user.id,
        label: user.username,
        username: user.username,
        display: user.display || user.username,
        avatar:
          user.profilePicture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display || user.username)}`,
      }));

      setMentionLoading(false);

      return mapped;
    },
    render: () => {
      let popup: Instance | null = null;
      let selectedIndex = 0;
      const root = document.createElement("div");
      root.className = "tiptap-mention-menu";
      const list = document.createElement("ul");
      root.appendChild(list);
      let currentItems: ICommentMentionItem[] = [];
      let mentionProps: SuggestionProps<ICommentMentionItem> | null = null;

      const scrollToActive = () => {
        const active = list.querySelector("li.active");
        active?.scrollIntoView({ block: "nearest" });
      };

      const renderItems = () => {
        list.innerHTML = "";

        if (mentionLoadingRef.current) {
          const loadingItem = document.createElement("li");
          loadingItem.className = "mention-empty";
          loadingItem.textContent = "Đang tìm kiếm...";
          list.appendChild(loadingItem);
          return;
        }

        if (!currentItems.length) {
          const empty = document.createElement("li");
          empty.className = "mention-empty";
          empty.textContent = "Không có dữ liệu";
          list.appendChild(empty);
          return;
        }

        currentItems.forEach((item, index) => {
          const li = document.createElement("li");
          li.className = index === selectedIndex ? "active" : "";
          li.innerHTML = `<div class="mention-suggestion-item"><img class="mention-suggestion-avatar" src="${item.avatar}" alt="${item.label}" /><div class="mention-suggestion-text"><div class="mention-suggestion-display">${escapeHtml(item.display || item.label)}</div><div class="mention-suggestion-username">${escapeHtml(item.label)}</div></div></div>`;
          li.addEventListener("mousedown", (event) => {
            event.preventDefault();
          });
          li.addEventListener("click", () => {
            const selected = currentItems[index];
            if (!selected || !mentionProps) return;
            mentionProps.command(selected);
          });
          list.appendChild(li);
        });
      };

      const createPopup = (props: SuggestionProps<ICommentMentionItem>) => {
        if (!props.clientRect) return;
        popup = tippy(document.body, {
          getReferenceClientRect: () => props.clientRect?.() || new DOMRect(),
          appendTo: () => document.body,
          content: root,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      };

      return {
        onStart: (props: SuggestionProps<ICommentMentionItem>) => {
          mentionRenderItemsRef.current = renderItems;
          mentionProps = props;
          currentItems = props.items;
          selectedIndex = 0;
          renderItems();
          createPopup(props);
        },
        onUpdate: (props: SuggestionProps<ICommentMentionItem>) => {
          mentionProps = props;
          currentItems = props.items;
          selectedIndex = 0;

          if (!popup) {
            createPopup(props);
          }

          renderItems();

          if (popup && props.clientRect) {
            popup.setProps({
              getReferenceClientRect: () => props.clientRect?.() || new DOMRect(),
            });
          }
        },
        onKeyDown: (props: SuggestionKeyDownProps) => {
          if (props.event.key === "Escape") {
            popup?.hide();
            return true;
          }

          if (!currentItems.length) {
            return false;
          }

          if (props.event.key === "ArrowDown") {
            selectedIndex = (selectedIndex + 1) % currentItems.length;
            renderItems();
            scrollToActive();
            return true;
          }

          if (props.event.key === "ArrowUp") {
            selectedIndex = (selectedIndex + currentItems.length - 1) % currentItems.length;
            renderItems();
            scrollToActive();
            return true;
          }

          if (props.event.key === "Enter") {
            const selected = currentItems[selectedIndex];
            if (!selected || !mentionProps) return false;
            mentionProps.command(selected);
            return true;
          }

          return false;
        },
        onExit: () => {
          mentionRenderItemsRef.current = null;
          mentionProps = null;
          currentItems = [];
          selectedIndex = 0;

          if (popup) {
            popup.destroy();
            popup = null;
          }
        },
      };
    },
  };

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          blockquote: false,
          codeBlock: false,
          heading: false,
          horizontalRule: false,
        }),
        HashtagHighlight,
        Placeholder.configure({
          placeholder: placeholderText,
        }),
        CommentMention.configure({
          HTMLAttributes: {
            class: "post-editor-mention",
          },
          renderText: ({ node, options }) => {
            const attrs = node.attrs as ICommentMentionAttrs;
            return `${options.suggestion.char}${attrs.label || attrs.username || attrs.id || ""}`;
          },
          suggestion: mentionSuggestion,
        }),
      ],
      editorProps: {
        attributes: {
          class: "post-comment-editor-content",
        },
      },
      content: "",
      onUpdate: ({ editor: tiptapEditor }) => {
        const docJson = tiptapEditor.getJSON();
        const extractedMentions: ICommentMention[] = [];
        let nextPlainText = "";

        const blocks = (docJson.content || []) as Array<{
          content?: Array<{
            type?: string;
            text?: string;
            attrs?: Record<string, string>;
          }>;
        }>;

        blocks.forEach((block, blockIndex) => {
          if (blockIndex > 0) {
            nextPlainText += "\n";
          }

          const children = block.content || [];
          children.forEach((node) => {
            if (node.type === "text") {
              nextPlainText += node.text || "";
              return;
            }

            if (node.type === "mention") {
              const attrs = (node.attrs || {}) as unknown as ICommentMentionAttrs;
              const displayLabel = (attrs.label || attrs.username || "").trim();
              const mentionText = `@${displayLabel}`;
              const mentionStart = nextPlainText.length;
              const username =
                (attrs.username || "").trim() ||
                mentionUserMapRef.current.get((attrs.id || "").trim()) ||
                displayLabel;

              extractedMentions.push({
                userId: (attrs.id || username || displayLabel).trim(),
                username,
                startIndex: mentionStart,
                endIndex: mentionStart + mentionText.length,
              });

              nextPlainText += mentionText;
              return;
            }

            if (node.type === "hardBreak") {
              nextPlainText += "\n";
            }
          });
        });

        setPlainText(nextPlainText.replace(/@@+/g, "@"));
        setMentions(extractedMentions);
      },
    },
    [placeholderText],
  );

  const focus = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().run();
    setIsFocus(true);
  }, [editor]);

  useImperativeHandle(
    ref,
    () => ({
      focus,
    }),
    [focus],
  );

  useEffect(() => {
    if (!editor) return;

    inputRef.current = {
      focus: () => editor.chain().focus().run(),
    };

    const handleFocus = () => setIsFocus(true);
    editor.on("focus", handleFocus);

    return () => {
      editor.off("focus", handleFocus);
      inputRef.current = null;
    };
  }, [editor]);

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
    if (!editor) return;

    editor.chain().focus().insertContent(emojiData.emoji).run();
    setIsFocus(true);
  };

  const handleSubmit = async () => {
    if (!postId || loading) return;

    const normalizedContent = plainText.trim();
    const hasFile = !!file?.originFileObj;
    if (!normalizedContent && !hasFile) return;

    try {
      setLoading(true);

      // Upload media if file is selected
      let mediaIds: string[] | undefined;
      if (hasFile && file.originFileObj) {
        const blob = file.originFileObj;
        const contentType = blob.type || "image/jpeg";
        const filename = blob.name || "comment-media.jpg";

        const presigned = await dispatch(
          presignedAction({
            purpose: EMediaPurpose.POST_MEDIA,
            filename,
            contentType,
            size: blob.size,
          }),
        ).unwrap();

        if (!presigned) throw new Error("Get presigned url failed");

        const uploadRes = await fetch(presigned.uploadUrl, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": contentType },
        });

        if (!uploadRes.ok) throw new Error("S3 Upload failed");

        await dispatch(confirmUploadAction({ mediaId: presigned.mediaId })).unwrap();
        mediaIds = [presigned.mediaId];
      }

      const response = await dispatch(
        commentPostAction({
          content: normalizedContent || undefined,
          parentId: parentId || undefined,
          mentions,
          postId,
          mediaIds,
        }),
      ).unwrap();

      editor?.commands.clearContent();
      mentionUserMapRef.current.clear();
      setPlainText("");
      setMentions([]);

      if (filePreview) {
        URL.revokeObjectURL(filePreview.url);
      }
      setFilePreview(null);
      setFile(null);
      onSubmitted?.(response.comment);
    } catch (error) {
      console.log("handle comment error: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex className="post-comment-input">
      <Avatar
        className={`comment-box__avatar ${parentId ? "comment-box__avatar--reply" : ""}`}
        src={getAvatarUrl(authUser?.profilePicture)}
      />

      <Flex className={`comment-box__input-wrapper ${isFocus && "focus"}`} flex={1}>
        <div className={`comment-box__input ${loading ? "comment-box__input--disabled" : ""}`} onClick={focus}>
          <EditorContent editor={editor} className="post-comment-editor" />
        </div>
        {filePreview && (
          <Flex className="comment-box__preview">
            {file?.originFileObj?.type?.startsWith("video/") ? (
              <video src={filePreview.url} controls style={{ width: "100%", borderRadius: 8 }} />
            ) : (
              <Image preview={{ mask: null }} src={filePreview.url} />
            )}
            {!loading && (
              <Flex className="comment-box__preview-close" onClick={handleRemoveImage}>
                <Icon name="CloseIcon" />
              </Flex>
            )}
          </Flex>
        )}
        <Flex className={`comment-box__actions`}>
          <Flex align="center" gap={8}>
            {!loading && (
              <>
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
                  accept="image/*,video/*"
                  showUploadList={false}
                  onChange={handleChangeFile}
                  beforeUpload={handleBeforeUpload}
                  fileList={file ? [file] : []}
                >
                  {!filePreview && <Icon name="CameraIcon" />}
                </Upload>
              </>
            )}
          </Flex>
          {isFocus &&
            (loading ? <LoaderSpin /> : <Icon name="SendBlackIcon" onClick={handleSubmit} />)}
        </Flex>
      </Flex>
    </Flex>
  );
});

export default PostCommentInput;
