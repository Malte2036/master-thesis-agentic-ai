export default {
  displayName: '@master-thesis-agentic-rag/routing-agent',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        useESM: false,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/routing-agent',
  transformIgnorePatterns: [
    'node_modules/(?!(zod|@master-thesis-agentic-rag)/)',
  ],
  moduleNameMapper: {
    '^zod/v4$': 'zod/dist/cjs/v4/index.js',
    '^chalk$': '<rootDir>/__mocks__/chalk.js',
  },
};
