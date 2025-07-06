import { useEffect } from "@lynx-js/react";

import "./App.css";

export function App(props: { onMounted?: () => void }) {
  useEffect(() => {
    console.info("Hello, ReactLynx");
    props.onMounted?.();
  }, []);

  return (
    <view>
      <view className="Background" />
      <view className="App">
        <view className="Content">
          <text className="Description">Tap the logo and have fun!</text>
          <text className="Hint">
            Edit<text style={{ fontStyle: "italic" }}>{" src/App.tsx "}</text>
            to see updates!
          </text>
          <text className="text-blue-600">Gus!!</text>
        </view>
        <view style={{ flex: 1 }}></view>
      </view>
    </view>
  );
}
