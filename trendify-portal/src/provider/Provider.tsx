import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import store, { persistor } from "@/stores";
import { SocketProvider } from "./SocketContext.tsx";
import { PresenceProvider } from "./PresenceProvider.tsx";

import App from "../App.tsx";
import ThemeProvider from "./ThemeProvider.tsx";
import NotificationBootstrap from "./NotificationBootstrap.tsx";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const Providers = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SocketProvider>
              <PresenceProvider>
                <NotificationBootstrap />
                <App />
              </PresenceProvider>
            </SocketProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
};

export default Providers;

