import { useState, useCallback, useMemo } from "react";
import { Flex } from "antd";

import ChatSidebar from "./components/chat-sidebar/ChatSidebar";
import ChatWindow from "./components/chat-window/ChatWindow";
import ChatEmpty from "./components/chat-empty/ChatEmpty";
import ChatInfo from "./components/chat-info/ChatInfo";

import "./Messenger.scss";
import { useAppSelector } from "@/stores";
import { useConversations } from "./hooks/useConversations";
import { mapConversationToLocal } from "./hooks/useConversationMapper";
import { useChatSocket } from "./hooks/useChatSocket";
import { markConversationRead } from "./hooks/useUnreadTracker";

const Messenger = () => {
  const { user } = useAppSelector((state) => state.auth);

  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [activeConversationId, setActiveConversationId] = useState<string>("");

  // Fetch conversations (shared cache with ChatSidebar — same queryKey)
  const { data: conversationsData } = useConversations();

  // Real-time chat: listen for new messages via socket
  // - Adds incoming messages to cache
  // - Invalidates conversations → sidebar auto-updates (new convos appear, order updates)
  // - Plays notification sound & marks unread (skipped for active conversation)
  useChatSocket(user?.id ?? "", activeConversationId || undefined);

  // Find the active conversation from cached data
  const activeConversation = useMemo(() => {
    if (!activeConversationId || !conversationsData?.pages || !user) return null;

    const allConversations = conversationsData.pages.flatMap((page) => page.items);
    const found = allConversations.find((c) => c.id === activeConversationId);
    if (!found) return null;

    return mapConversationToLocal(found, user.id);
  }, [activeConversationId, conversationsData, user]);

  const toggleInfo = useCallback(() => setShowInfo((prev) => !prev), []);

  // When selecting a conversation, mark it as read
  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    if (id) {
      markConversationRead(id);
    }
  }, []);

  const handleDeselectConversation = useCallback(() => {
    setActiveConversationId("");
    setShowInfo(false);
  }, []);

  if (!user) return null;

  return (
    <Flex className="messenger-container" id="messengerContainer">
      <ChatSidebar
        currentUser={user}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
      />

      {activeConversation ? (
        <>
          <ChatWindow
            key={activeConversationId}
            conversation={activeConversation}
            showInfo={showInfo}
            onToggleInfo={toggleInfo}
          />

          <div
            className={`messenger-container__info-wrapper ${showInfo ? "messenger-container__info-wrapper--open" : ""}`}
          >
            <ChatInfo
              conversation={activeConversation}
              onDeselectConversation={handleDeselectConversation}
            />
          </div>
        </>
      ) : (
        <ChatEmpty />
      )}
    </Flex>
  );
};

export default Messenger;

