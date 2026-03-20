import nextConfig from "eslint-config-next";

const config = [
  { ignores: ['dist/**'] },
  ...nextConfig,
  {
    rules: {
      // Règles React Hooks v5 (React 19) — patterns existants à corriger progressivement
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];

export default config;
