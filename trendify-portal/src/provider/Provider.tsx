import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import store, { persistor } from "@/stores";
import { SocketProvider } from "./SocketContext.tsx";

import App from "../App.tsx";
import ThemeProvider from "./ThemeProvider.tsx";
import NotificationBootstrap from "./NotificationBootstrap.tsx";

const Providers = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <SocketProvider>
            <NotificationBootstrap />
            <App />
          </SocketProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default Providers;
