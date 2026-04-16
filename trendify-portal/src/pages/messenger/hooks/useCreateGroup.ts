import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup } from "@/stores/chat/api";
import { ICreateGroupParams } from "@/stores/chat/constants";
import { conversationKeys } from "./useConversations";

export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ICreateGroupParams) => {
      const response = await createGroup(data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate conversations list so the new group appears immediately
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
};
