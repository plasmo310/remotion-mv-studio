import type { StorybookConfig } from "@storybook/react-vite";

// ---------------------------------------------------------------------------
// 汎用パーツ（src/lib/）の見た目を単体で確かめるための Storybook。
// MV の Composition は Remotion Studio（npm run dev）で見るので、ここでは扱わない。
// ---------------------------------------------------------------------------

const config: StorybookConfig = {
  // ストーリーはテストと同じくリポジトリルートの stories/ に集め、
  // その下を src/ と同じ形にミラーする（lib のファイル一覧に .stories.tsx を混ぜない）
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  framework: { name: "@storybook/react-vite", options: {} },
  // public/ をそのまま配信して、staticFile("assets/...") が Studio と同じパスで解決するようにする
  staticDirs: ["../public"],
  viteFinal: async (config) => {
    // @storybook/react-vite は React プラグインを自分では持たないので、ここで足す。
    // Babel 版（@vitejs/plugin-react）は Remotion CLI の @babel/core 7 と依存が衝突するため SWC 版を使う
    const react = (await import("@vitejs/plugin-react-swc")).default;
    config.plugins = [...(config.plugins ?? []), react()];
    return config;
  },
};

export default config;
