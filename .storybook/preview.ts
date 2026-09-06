import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    // どのストーリーも Player を中央に1つ置くだけなので、パディングのない土台にする
    layout: "centered",
    controls: { expanded: true },
  },
};

export default preview;
