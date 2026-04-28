import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: ["app/**", "app-prototype/**", "images/**", "Untitled"],
  },
  ...nextVitals,
];

export default config;
