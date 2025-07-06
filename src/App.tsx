import { useEffect } from "@lynx-js/react";

import "./App.css";

export function App(props: { onMounted?: () => void }) {
  useEffect(() => {
    props.onMounted?.();
  }, []);

  return (
    <view>
      <view className="Background -z-10" />
      <view className="flex flex-col justify-center w-full justify-items-center items-center">
        <text className="pt-10 text-3xl text-white">Dice Roller!!</text>
      </view>
    </view>
  );
}
