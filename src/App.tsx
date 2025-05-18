import { Inputs } from "Inputs";
import { Leva } from "leva";
import { Playback } from "Playback";
import { Suspense } from "react";
import "./App.css";
import { Stage } from "./components/Stage";

function App() {
  return (
    <Suspense fallback={null}>
      <Suspense fallback={null}>
        <Inputs />
        <Playback />
      </Suspense>
      <div style={{ height: "100vh", width: "100vw" }}>
        <Leva
          theme={{
            fontSizes: { root: "12px" },
            space: { rowGap: "8px" },
            sizes: {
              folderTitleHeight: "32px",
              numberInputMinWidth: "90px",
              rowHeight: "32px",
              rootWidth: "400px",
              controlWidth: "240px",
            },
            fonts: {
              mono: "Geist Mono",
            },
          }}
        />
        <Stage />
      </div>
    </Suspense>
  );
}

export default App;
