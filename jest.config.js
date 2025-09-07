module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest/setup.ts'],
  transformIgnorePatterns: ['node_modules/(?!(react-native|@react-native|expo(nent)?|expo-.*|@expo/.*))'],
};