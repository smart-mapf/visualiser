import { useQuery } from "@tanstack/react-query";
import { optimiseGridMap } from "utils/optimiseGridMap";
import { parseMap } from "utils/parseMap";
import { id } from "utils";

export function useMap(file: File | null) {
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
  });
}
