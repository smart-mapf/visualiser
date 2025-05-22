import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider } from "jotai";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const client = new QueryClient();
export const store = createStore();

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  </Provider>
);
