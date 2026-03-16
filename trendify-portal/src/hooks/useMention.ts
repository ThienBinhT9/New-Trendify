import { useState } from "react";
import { IPostMention } from "@/interfaces/post.interface";
import { JSONContent } from "@tiptap/core";

export interface IPostPayload {
  type: "text";
  content: string;
  mentions: IPostMention[];
}

const parseMentionsFromText = (content: string): IPostMention[] => {
  const mentions: IPostMention[] = [];
  const plainMentionRegex = /(^|\s)@([a-zA-Z0-9._]+)/g;
  let plainMatch: RegExpExecArray | null;

  while ((plainMatch = plainMentionRegex.exec(content)) !== null) {
    const tokenStart = plainMatch.index + plainMatch[1].length;
    const username = plainMatch[2];

    mentions.push({
      userId: username,
      username,
      startIndex: tokenStart,
      endIndex: tokenStart + username.length + 1,
    });
  }

  return mentions;
};

export const useMention = () => {
  const [editorValue, setEditorValue] = useState<string>("");
  const [mentions, setMentions] = useState<IPostMention[]>([]);
  const [editorDoc, setEditorDoc] = useState<JSONContent | null>(null);

  const appendEmoji = (emoji: string) => {
    setEditorValue((prev) => {
      const nextValue = prev + emoji;
      setMentions(parseMentionsFromText(nextValue));
      return nextValue;
    });
  };

  const handleChange = (
    _event: unknown,
    newValue: string,
    nextMentions?: IPostMention[],
    nextEditorDoc?: JSONContent,
  ) => {
    setEditorValue(newValue);
    setMentions(nextMentions ?? parseMentionsFromText(newValue));
    if (nextEditorDoc) {
      setEditorDoc(nextEditorDoc);
    }
  };

  const getPayload = (): IPostPayload => ({
    type: "text",
    content: editorValue,
    mentions,
  });

  const reset = () => {
    setEditorValue("");
    setMentions([]);
    setEditorDoc(null);
  };

  return { editorValue, editorDoc, handleChange, getPayload, reset, appendEmoji };
};
