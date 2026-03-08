/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          module: "commonjs",
          esModuleInterop: true,
          allowJs: true,
          strict: true,
          baseUrl: ".",
          paths: {
            "@/*": ["./src/*"],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^next/image$": "<rootDir>/src/__tests__/__mocks__/next/image.js",
    "^next/link$": "<rootDir>/src/__tests__/__mocks__/next/link.js",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|svg|webp)$":
      "<rootDir>/src/__tests__/__mocks__/fileMock.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**",
    "!src/types/**",
  ],
};

module.exports = config;
