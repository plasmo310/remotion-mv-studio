// この MV（ミーアキャット）の Composition 群。
// Root.tsx からは `import * as meerkat from "./videos/meerkat"` で名前空間ごと読み込むので、
// 別の MV が同じ名前で export していても衝突しない
export { MusicVideoFullComposition } from "./compositions/MusicVideoFull";
export { MusicVideoFullEnComposition } from "./compositions/MusicVideoFullEn";
export { MusicVideoShortComposition } from "./compositions/MusicVideoShort";
export { MusicVideoShortEnComposition } from "./compositions/MusicVideoShortEn";
