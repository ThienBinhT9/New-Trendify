import { useSocketContext } from "@/provider/socket-context.shared";

const useSocket = () => {
  return useSocketContext();
};

export { useSocket };
