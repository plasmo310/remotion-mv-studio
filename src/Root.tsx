import { Folder } from "remotion";
import * as meerkat from "./videos/meerkat";

/**
 * 全 MV の Composition をここに並べる。
 * MV を足すときは src/videos/<名前>/index.ts を作り、<Folder name="<名前>"> を追加する
 */
export const RemotionRoot = () => {
  return (
    <>
      <Folder name="meerkat">
        <meerkat.MusicVideoFullComposition />
        <meerkat.MusicVideoFullEnComposition />
        <meerkat.MusicVideoShortComposition />
        <meerkat.MusicVideoShortEnComposition />
      </Folder>
    </>
  );
};
