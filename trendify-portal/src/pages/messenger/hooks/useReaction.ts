import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api-clients";
import { CHAT_ENDPOINT } from "@/stores/chat/constants";

interface IToggleReactionParams {
  messageId: string;
  emoji: string;
}

export const useToggleReaction = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: IToggleReactionParams) => {
      const url = `${CHAT_ENDPOINT.MESSAGES(conversationId)}/${messageId}/reactions`;
      const res = await apiClient.post(url, { emoji });
      return res.data.data;
    },
    onSuccess: () => {
      // Invalidate messages to get updated reactions
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
    },
  });
};
