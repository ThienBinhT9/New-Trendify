import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDM } from "@/stores/chat/api";
import { conversationKeys } from "./useConversations";

export const useCreateDM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantId: string) => {
      const response = await createDM(participantId);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate conversations list so the new DM appears immediately
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
};
