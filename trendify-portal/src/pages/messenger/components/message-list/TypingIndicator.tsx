import { memo } from "react";
import { Flex } from "antd";
import type { IChatUser } from "@/stores/chat/constants";

import "./TypingIndicator.scss";

interface TypingIndicatorProps {
  typingUsers: IChatUser[];
}

const TypingIndicator = memo(({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0].displayName} đang nhập...`
      : typingUsers.length === 2
        ? `${typingUsers[0].displayName} và ${typingUsers[1].displayName} đang nhập...`
        : `${typingUsers[0].displayName} và ${typingUsers.length - 1} người khác đang nhập...`;

  return (
    <Flex className="typing-indicator" align="center" gap={8}>
      <div className="typing-indicator__dots">
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
        <span className="typing-indicator__dot" />
      </div>
      <span className="typing-indicator__label">{label}</span>
    </Flex>
  );
});

TypingIndicator.displayName = "TypingIndicator";

export default TypingIndicator;
