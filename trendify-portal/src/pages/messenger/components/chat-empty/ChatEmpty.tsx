import { Flex } from "antd";

import { MessengerIcon } from "@/assets/icons/Icon";

import "./ChatEmpty.scss";

const ChatEmpty = () => {
  return (
    <Flex vertical className="chat-empty" align="center" justify="center" flex={1} id="chatEmpty">
      <Flex className="chat-empty__icon" align="center" justify="center">
        <MessengerIcon style={{ width: 48, height: 48 }} />
      </Flex>
      <h3 className="chat-empty__title">Select a conversation</h3>
      <p className="chat-empty__subtitle">
        Choose from your existing conversations or start a new one.
      </p>
    </Flex>
  );
};

export default ChatEmpty;
