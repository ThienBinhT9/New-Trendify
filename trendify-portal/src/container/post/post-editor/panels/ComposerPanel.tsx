import { MoreOutlined } from "@ant-design/icons";
import { Avatar, Flex, Popover } from "antd";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useCallback, useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention, { MentionNodeAttrs } from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import tippy, { Instance } from "tippy.js";
import { JSONContent } from "@tiptap/core";

import { useMention } from "@/hooks";
import { EVisibility } from "@/interfaces/common.interface";
import { PostPanelKey } from "../PostCreate";
import { IPostLocation, IPostMention } from "@/interfaces/post.interface";
import { IUserSuggestion } from "@/interfaces/user.interface";
import { listFollowing } from "@/stores/profile/api";
import { useAppSelector } from "@/stores";

import Text from "@/components/text/Text";
import Icon from "@/components/icon/Icon";
import Button from "@/components/button/Button";

interface IProps {
  selectedLocation?: IPostLocation | null;
  selectedVisibility: EVisibility;
  editorValue: string;
  editorDoc: JSONContent | null;
  handleChange: ReturnType<typeof useMention>["handleChange"];
  appendEmoji: ReturnType<typeof useMention>["appendEmoji"];
  onSubmit: () => void;
  onCloseModal: () => void;
  onNavigatePanel: (panel: PostPanelKey) => void;
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

const ComposerPanel = ({
  selectedLocation,
  selectedVisibility,
  editorValue,
  editorDoc,
  handleChange,
  appendEmoji,
  onSubmit,
  onCloseModal,
  onNavigatePanel,
}: IProps) => {
  const privacyLabel = selectedVisibility === EVisibility.public ? "Công khai" : "Riêng tư";
  const authUser = useAppSelector((state) => state.auth.user);
  const mentionUserMapRef = useRef<Map<string, string>>(new Map());
  const mentionDebounceTimerRef = useRef<number | null>(null);
  const mentionRequestSeqRef = useRef<number>(0);
  const mentionLoadingRef = useRef<boolean>(false);
  const escapeHtml = useCallback((text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }, []);

  const fetchMentionUsers = useCallback(
    async (query: string) => {
      if (!authUser?.id) {
        return [] as IUserSuggestion[];
      }

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
        }, 400);
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
      mentionLoadingRef.current = true;
      const users = await debouncedFetchMentionUsers(normalizedQuery);
      mentionLoadingRef.current = false;

      return users.map((user) => ({
        id: user.id,
        label: user.display || user.username,
        username: user.username,
        display: user.display || user.username,
        avatar:
          user.profilePicture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display || user.username)}`,
      }));
    },
    render: () => {
      let popup: Instance | null = null;
      let selectedIndex = 0;
      const root = document.createElement("div");
      root.className = "tiptap-mention-menu";
      const list = document.createElement("ul");
      root.appendChild(list);
      let currentItems: IMentionSuggestionItem[] = [];

      const renderItems = () => {
        list.innerHTML = "";

        if (mentionLoadingRef.current) {
          const loading = document.createElement("li");
          loading.className = "mention-empty";
          loading.textContent = "Đang tải...";
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
            return true;
          }

          if (props.event.key === "ArrowUp") {
            selectedIndex = (selectedIndex + currentItems.length - 1) % currentItems.length;
            renderItems();
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
          popup?.destroy();
          popup = null;
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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (!editor) {
      appendEmoji(emojiData.emoji);
      return;
    }

    editor.chain().focus().insertContent(emojiData.emoji).run();
  };

  return (
    <Flex vertical className="post-modal-panel">
      <Flex className="post-modal-header">
        <Button type="text" className="post-head-btn" onClick={onCloseModal}>
          <Text textType="M16">Hủy</Text>
        </Button>
        <Text textType="SB22">Thread mới</Text>
        <Flex className="post-head-actions">
          <MoreOutlined />
        </Flex>
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
          <Button className="post-location-tag" icon={<Icon name="LocationIcon" size={13} />}>
            <Text textType="M14">{selectedLocation.name}</Text>
          </Button>
        )}

        <div className="post-editor-wrap">
          <EditorContent editor={editor} className="post-editor" />
        </div>
      </Flex>

      <Flex className="post-toolbar">
        <Button
          type="text"
          className="post-toolbar-btn"
          icon={<Icon name="ImagePenIcon" size={22} />}
        />

        <Popover
          content={<EmojiPicker height={260} width={320} onEmojiClick={handleEmojiClick} />}
          placement="bottom"
          trigger={["click"]}
        >
          <Button
            type="text"
            className="post-toolbar-btn"
            icon={<Icon name="EmojiIcon" size={20} />}
          />
        </Popover>
        <Button
          type="text"
          className="post-toolbar-btn"
          icon={<Icon name="LocationIcon" size={22} />}
          onClick={() => onNavigatePanel("location")}
        />
      </Flex>

      <Flex className="post-modal-footer">
        <Flex gap={8} align="center">
          <Text
            textType="M14"
            className="post-reply-option"
            onClick={() => onNavigatePanel("privacy")}
          >
            {`Các lựa chọn để kiểm soát câu trả lời`}
          </Text>
          <Text textType="M14" onClick={() => onNavigatePanel("privacy")} style={{ opacity: 0.4 }}>
            {`|`}
          </Text>
          <Text
            textType="M14"
            className="post-reply-option"
            onClick={() => onNavigatePanel("privacy")}
          >
            {`${privacyLabel}`}
          </Text>
        </Flex>
        <Button className="post-submit" onClick={onSubmit}>
          <Text textType="M14">Đăng</Text>
        </Button>
      </Flex>
    </Flex>
  );
};

export default ComposerPanel;
