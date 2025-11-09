import { atom, useAtom, useAtomValue } from "jotai";
import { useControls } from "leva";

const darkModeAtom = atom(true);

export const useDarkMode = () => useAtomValue(darkModeAtom);

export const lightTheme = {
  colors: {
    elevation1: "#ffffff",
    elevation2: "#f2f2f2",
    elevation3: "#dddddd",
    accent1: "#0066DC",
    accent2: "#007BFF",
    accent3: "#3C93FF",
    highlight1: "#666666",
    highlight2: "#333333",
    highlight3: "#000000",
    vivid1: "#d18400",
  },
};

export function Theme() {
  const [darkMode, setDarkMode] = useAtom(darkModeAtom);
  useControls(
    "Appearance",
    () => ({
      darkMode: {
        label: "Dark theme",
        value: darkMode,
        onChange: setDarkMode,
      },
    }),
    [darkMode]
  );
  return null;
}
