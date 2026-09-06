import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 対象は React にも Remotion にも依存しない純粋関数だが、
    // それらを持つファイルは import した時点で loadFont（document を触る）が走るため DOM が要る
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
