import { clamp } from "lodash";

const COEFFICIENT_EXPECTED_PROGRESS = 60;
export const getExpectedProgress = (time = 0, length = 1) =>
  clamp(time / length / COEFFICIENT_EXPECTED_PROGRESS, 0, 1);
