import { useMutation } from "@tanstack/react-query";
import {
  useFlip,
  useMapFile,
  useScenarioFile,
  useSolutionFile,
} from "client/run";
import { useClear } from "client/state";
import { basename } from "utils";
import { sizes, useFile } from "./useMap";
import { usePreview } from "./usePreview";

export function useExample(path: string) {
  const { data: file, isLoading } = useFile(path);
  const preview = usePreview(file);
  const [, setSolutionFile] = useSolutionFile();
  const [, setMapFile] = useMapFile();
  const [, setScenarioFile] = useScenarioFile();
  const clear = useClear();
  const [, setFlip] = useFlip();
  const open = useMutation({
    mutationKey: ["open-example", path],
    mutationFn: async (size: (typeof sizes)[number]) => {
      if (!file) return null;
      await clear();
      const name = basename(path, true);
      const solution = `/examples/${name}/path/${size}/scen_1_paths.txt`;
      const scen = `/examples/${name}-random-1.scen`;
      setMapFile(file);
      setSolutionFile(
        new File(
          [await fetch(solution).then((r) => r.blob())],
          basename(solution),
          {}
        )
      );
      setScenarioFile(
        new File([await fetch(scen).then((r) => r.blob())], basename(scen), {})
      );
      setFlip(false);
    },
  });
  return {
    preview,
    isLoading,
    open,
  };
}
