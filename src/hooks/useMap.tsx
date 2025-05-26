import { useQuery } from "@tanstack/react-query";
import { basename, id } from "utils";
import { optimiseGridMap } from "utils/optimiseGridMap";
import { parseMap } from "utils/parseMap";

export function useMap(file?: File | null) {
  return useQuery({
    queryKey: ["map", id(file)],
    queryFn: async () => {
      const cells = parseMap(await file!.text());
      const b = {
        height: cells.length,
        width: cells[0].length,
      };
      return {
        file,
        items: optimiseGridMap(cells, b),
        size: b,
      };
    },
    enabled: !!file,
    staleTime: Infinity,
  });
}

export const sizes = [20, 50, 100, 500] as const;

export function useFile(path: string) {
  return useQuery({
    queryKey: ["file", path],
    queryFn: async () => {
      const a = await fetch(path);
      return new File([await a.blob()], basename(path), {});
    },
    enabled: !!path,
    staleTime: Infinity,
  });
}
