import { Service } from "client/state";
import { Inputs } from "leva-controls/Inputs";
import { Leva } from "leva";
import { Playback } from "leva-controls/Playback";
import { Suspense } from "react";
import "./App.css";
import { Stage } from "./components/Stage";
import { Logs } from "Logs";
import { Selection } from "leva-controls/Selection";
import { Examples } from "leva-controls/Examples";
import { Statistics } from "leva-controls/Statistics";
import { lightTheme, Theme, useDarkMode } from "leva-controls/Theme";
import { merge } from "lodash";
import { useWindowSize } from "react-use";
import { Docs } from "leva-controls/Docs";

function App() {
  const darkMode = useDarkMode();
  const { width } = useWindowSize();
  return (
    <Suspense fallback={null}>
      <Service />
      <Suspense fallback={null}>
        <Docs />
        <Examples />
        <Theme />
        <Inputs />
        <Playback />
        <Selection />
        <Statistics />
        <Logs />
      </Suspense>
      <div style={{ height: "100vh", width: "100vw" }}>
        <Leva
          theme={merge(
            {
              fontSizes: { root: "12px" },
              space: { rowGap: "8px" },
              sizes: {
                folderTitleHeight: "32px",
                numberInputMinWidth: "90px",
                rowHeight: "32px",
                rootWidth: `${Math.min(420, width - 20)}px`,
                controlWidth: "240px",
              },
              fonts: {
                mono: "Geist Mono",
              },
            },
            darkMode ? {} : lightTheme
          )}
        />
        <Stage />
      </div>
    </Suspense>
  );
}

export default App;
