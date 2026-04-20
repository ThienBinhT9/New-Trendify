import { Avatar, Flex, Popover } from "antd";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useCallback, useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Mention, { MentionNodeAttrs } from "@tiptap/extension-mention";
import { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import tippy, { Instance } from "tippy.js";
import { Extension, JSONContent } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { useMention } from "@/hooks";
import { IPostImage, PostPanelKey } from "../PostCreate";
import { listFollowing } from "@/stores/profile/api";
import { useAppSelector } from "@/stores";
import { IUserSuggestion } from "@/interfaces/user.interface";
import { IPostLocation, IPostMention } from "@/interfaces/post.interface";
import useEmblaCarousel from "embla-carousel-react";

import Text from "@/components/text/Text";
import Icon from "@/components/icon/Icon";
import Button from "@/components/button/Button";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { EPostActions } from "@/stores/post/constants";

interface IProps {
  selectedLocation?: IPostLocation | null;
  editorValue: string;
  editorDoc: JSONContent | null;
  handleChange: ReturnType<typeof useMention>["handleChange"];
  appendEmoji: ReturnType<typeof useMention>["appendEmoji"];
  onSubmit: () => void;
  onCloseModal: () => void;
  onNavigatePanel: (panel: PostPanelKey) => void;
  // Image props
  postImages: IPostImage[];
  isUploading: boolean;
  uploadStatusText?: string;
  onOpenImagePicker: () => void;
  onRemoveImage: (imageId: string) => void;
  onRecropImage: (index: number) => void;
}

interface IMentionSuggestionItem extends MentionNodeAttrs {
  id: string;
  label: string;
  username: string;
  display: string;
  avatar: string;
}

interface IComposerMentionAttrs extends MentionNodeAttrs {
  username?: string | null;
}

const ComposerMention = Mention.extend({
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

const ComposerPanel = ({
  selectedLocation,
  editorValue,
  editorDoc,
  handleChange,
  appendEmoji,
  onSubmit,
  onCloseModal,
  onNavigatePanel,
  postImages,
  isUploading,
  uploadStatusText,
  onOpenImagePicker,
  onRemoveImage,
  onRecropImage,
}: IProps) => {
  const loading = useAppSelector((state) => state.loading);
  const authUser = useAppSelector((state) => state.auth.user);

  const mentionLoadingRef = useRef<boolean>(false);
  const mentionUserMapRef = useRef<Map<string, string>>(new Map());
  const mentionRequestSeqRef = useRef<number>(0);
  const mentionRenderItemsRef = useRef<(() => void) | null>(null);
  const mentionDebounceTimerRef = useRef<number | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (!editor) {
      appendEmoji(emojiData.emoji);
      return;
    }

    editor.chain().focus().insertContent(emojiData.emoji).run();
  };

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

  const mentionSuggestion: Omit<
    SuggestionOptions<IMentionSuggestionItem, IComposerMentionAttrs>,
    "editor"
  > = {
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
      let currentItems: IMentionSuggestionItem[] = [];

      const scrollToActive = () => {
        const active = list.querySelector("li.active");
        active?.scrollIntoView({
          block: "nearest",
        });
      };

      const renderItems = () => {
        list.innerHTML = "";

        if (mentionLoadingRef.current) {
          const loading = document.createElement("li");
          loading.className = "mention-empty";
          loading.textContent = "Đang tìm kiếm...";
          list.appendChild(loading);
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

      let mentionProps: SuggestionProps<IMentionSuggestionItem, IComposerMentionAttrs> | null =
        null;

      const createPopup = (
        props: SuggestionProps<IMentionSuggestionItem, IComposerMentionAttrs>,
      ) => {
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
        onStart: (props: SuggestionProps<IMentionSuggestionItem, IComposerMentionAttrs>) => {
          mentionRenderItemsRef.current = renderItems;
          mentionProps = props;
          currentItems = props.items;
          selectedIndex = 0;
          renderItems();
          createPopup(props);
        },
        onUpdate: (props: SuggestionProps<IMentionSuggestionItem, IComposerMentionAttrs>) => {
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
      }),
      HashtagHighlight,
      Placeholder.configure({
        placeholder: "Bạn đang nghĩ gì?",
      }),
      ComposerMention.configure({
        HTMLAttributes: {
          class: "post-editor-mention",
        },
        renderText: ({ node, options }) => {
          const attrs = node.attrs as IComposerMentionAttrs;
          return `${options.suggestion.char}${attrs.label || attrs.username || attrs.id || ""}`;
        },
        suggestion: mentionSuggestion,
      }),
    ],
    editorProps: {
      attributes: {
        class: "post-editor-content",
      },
    },
    content: "",
    onUpdate: ({ editor: tiptapEditor }) => {
      const docJson = tiptapEditor.getJSON();
      const extractedMentions: IPostMention[] = [];
      let plainText = "";

      const blocks = (docJson.content || []) as Array<{
        type?: string;
        text?: string;
        attrs?: Record<string, string>;
        content?: Array<{
          type?: string;
          text?: string;
          attrs?: Record<string, string>;
        }>;
      }>;

      blocks.forEach((block, blockIndex) => {
        if (blockIndex > 0) {
          plainText += "\n";
        }

        const children = block.content || [];
        children.forEach((node) => {
          if (node.type === "text") {
            plainText += node.text || "";
            return;
          }

          if (node.type === "mention") {
            const attrs = (node.attrs || {}) as unknown as IComposerMentionAttrs;
            const displayLabel = (attrs.label || attrs.username || "").trim();
            const mentionText = `@${displayLabel}`;
            const mentionStart = plainText.length;
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

            plainText += mentionText;
            return;
          }

          if (node.type === "hardBreak") {
            plainText += "\n";
          }
        });
      });

      handleChange(undefined, plainText.replace(/@@+/g, "@"), extractedMentions, docJson);
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(!isUploading);
    }
  }, [editor, isUploading]);

  useEffect(() => {
    if (!editor) return;

    if (editorDoc) {
      editor.commands.setContent(editorDoc, { emitUpdate: false });
      return;
    }

    const currentValue = editor.getText();
    if (currentValue === editorValue) return;

    const html = editorValue
      ? `<p>${escapeHtml(editorValue).replace(/\n/g, "<br/>")}</p>`
      : "<p></p>";

    editor.commands.setContent(html, { emitUpdate: false });
  }, [editor, editorDoc, editorValue, escapeHtml]);

  // Auto-scroll to end when new images added
  useEffect(() => {
    if (postImages.length > 0 && emblaApi) {
      requestAnimationFrame(() => {
        emblaApi.scrollTo(emblaApi.scrollSnapList().length - 1);
      });
    }
  }, [postImages.length, emblaApi]);

  const canSubmit = editorValue.trim().length > 0 || postImages.length > 0;

  return (
    <Flex vertical className="post-modal-panel">
      <Flex className="post-modal-header">
        <Button type="text" className="post-head-btn" onClick={onCloseModal} disabled={isUploading}>
          <Text textType="M16" style={{ color: isUploading ? 'var(--gray-400)' : 'inherit' }}>Hủy</Text>
        </Button>
        <Text textType="SB22">Thread mới</Text>
        <div style={{ width: 42 }} />
      </Flex>

      <Flex vertical className="post-modal-body">
        <Flex align="center" gap={8}>
          <Avatar
            size={48}
            src={"https://i.pinimg.com/1200x/0b/54/b6/0b54b68fe601f1d58888023c1d4711e8.jpg"}
          />
          <Flex vertical>
            <Text textType="SB16" className="post-username">
              Đỗ Hoài Phong
            </Text>
            <Text textType="M14" style={{ opacity: 0.6 }}>
              Thêm chủ đề
            </Text>
          </Flex>
        </Flex>

        {selectedLocation && (
          <Button 
            className="post-location-tag" 
            icon={<Icon name="LocationIcon" size={13} />}
            disabled={isUploading}
          >
            <Text textType="M14">{selectedLocation.name}</Text>
          </Button>
        )}

        <div className={`post-editor-wrap ${postImages.length > 0 ? "has-images" : ""}`}>
          <EditorContent editor={editor} className="post-editor" />
        </div>

        {/* ========= Media Preview Carousel ========= */}
        {postImages.length > 0 && (
          <div className="post-images-carousel-wrap" ref={emblaRef}>
            <div className="post-images-carousel">
              {postImages.map((img, index) => (
                <div
                  key={img.id}
                  className={`post-image-item ${img.mediaType === "video" ? "post-image-item--video" : ""} ${isUploading ? "disabled" : ""}`}
                  onClick={() => {
                    if (isUploading) return;
                    if (img.mediaType === "image") onRecropImage(index);
                  }}
                  style={{ opacity: isUploading ? 0.7 : 1, cursor: isUploading ? 'not-allowed' : 'pointer' }}
                >
                  {img.mediaType === "video" && !img.previewUrl.startsWith("data:") ? (
                    <video
                      src={img.previewUrl}
                      className="post-image-preview"
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={img.croppedPreviewUrl || img.previewUrl}
                      alt={`post-media-${index}`}
                      className="post-image-preview"
                      draggable={false}
                    />
                  )}
                  {img.mediaType === "video" && (
                    <>
                      <div className="post-image-video-overlay">
                        <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      {img.videoDuration && (
                        <div className="post-image-video-duration">
                          {`${Math.floor(img.videoDuration / 60)}:${(img.videoDuration % 60).toString().padStart(2, "0")}`}
                        </div>
                      )}
                    </>
                  )}
                  {!isUploading && (
                    <button
                      className="post-image-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveImage(img.id);
                      }}
                    >
                      <Icon name="CloseIcon" size={12} />
                    </button>
                  )}
                  {/* Three dots menu overlay — only for images */}
                  {img.mediaType === "image" && !isUploading && (
                    <div className="post-image-overlay-menu">
                      <div className="post-image-dots">•••</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Flex>

      <Flex className="post-toolbar">
        <Button
          type="text"
          className="post-toolbar-btn"
          icon={<Icon name="ImagePenIcon" size={22} />}
          onClick={onOpenImagePicker}
          disabled={isUploading}
        />

        <Popover
          content={<EmojiPicker height={260} width={320} onEmojiClick={handleEmojiClick} />}
          placement="bottom"
          trigger={isUploading ? [] : ["click"]}
        >
          <Button
            type="text"
            className="post-toolbar-btn"
            icon={<Icon name="EmojiIcon" size={20} />}
            disabled={isUploading}
          />
        </Popover>
        <Button
          type="text"
          className="post-toolbar-btn"
          icon={<Icon name="LocationIcon" size={22} />}
          onClick={() => {
            if (!isUploading) onNavigatePanel("location");
          }}
          disabled={isUploading}
        />
      </Flex>

      <Flex className="post-modal-footer">
        <Flex gap={8} align="center">
          <Text
            textType="M14"
            className="post-reply-option"
            onClick={() => {
               if(!isUploading) onNavigatePanel("privacy");
            }}
            style={{ color: isUploading ? 'var(--gray-400)' : 'inherit' }}
          >
            {`Ai có thể trả lời`}
          </Text>
        </Flex>
        <Flex align="center" gap={12}>
          {isUploading && uploadStatusText && (
            <Text textType="M14" style={{ color: "var(--gray-500)", fontStyle: 'italic', animation: "pulse 1.5s infinite" }}>
              {uploadStatusText}
            </Text>
          )}
          <Button
            className="post-submit"
            onClick={onSubmit}
            disabled={!canSubmit}
            loading={loading[EPostActions.CREATE_POST] || isUploading}
          >
            <Text textType="M14">Đăng</Text>
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ComposerPanel;
