import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";
import type { AppRouter } from "smart-service";

const wsClient = createWSClient({ url: `wss://smart-sim.pathfinding.ai` });

export const client = createTRPCClient<AppRouter>({
  links: [
    wsLink({
      client: wsClient,
    }),
  ],
});
