import { QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import { client } from "queryClient.ts";
import { createRoot } from "react-dom/client";
import { store } from "store.ts";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  </Provider>
);
