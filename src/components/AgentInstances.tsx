import { createInstances } from "@react-three/drei";

export const [AgentInstances, AgentInstance] = createInstances<{
  bayerHash?: number;
}>();
