// Mock implementation of chalk for Jest tests
const mockChalk = {
  red: (text) => text,
  green: (text) => text,
  blue: (text) => text,
  yellow: (text) => text,
  magenta: (text) => text,
  cyan: (text) => text,
  white: (text) => text,
  gray: (text) => text,
  black: (text) => text,
  bold: (text) => text,
  dim: (text) => text,
  italic: (text) => text,
  underline: (text) => text,
  strikethrough: (text) => text,
  reset: (text) => text,
};

// Support for chaining like chalk.red.bold
Object.keys(mockChalk).forEach((key) => {
  mockChalk[key] = Object.assign(mockChalk[key], mockChalk);
});

module.exports = mockChalk;
