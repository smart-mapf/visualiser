import { useMap } from "./useMap";

export function usePreview(file?: File | null) {
  const { data: map } = useMap(file);
  if (!map) return null;
  const { items, size } = map;
  return {
    size,
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size.width}
        height={size.height}
      >
        <rect
          x="0"
          y="0"
          width={size.width}
          height={size.height}
          fill="var(--background, white)"
        />
        {items.map((bounds, i) => (
          <rect
            key={i}
            {...bounds}
            fill="var(--obstacle, black)"
            shapeRendering="optimizeSpeed"
          />
        ))}
      </svg>
    ),
  };
}
