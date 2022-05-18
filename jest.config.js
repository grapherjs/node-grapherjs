module.exports = {
  roots: ["<rootDir>"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  preset: "ts-jest",
  testEnvironment: "node",
  coverageReporters: ["json", "html"],
  testRegex: "(/test/.*.(test|spec)).(js?|ts?)$",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  moduleDirectories: ["./", "node_modules", "src"],
  collectCoverage: true,
  coveragePathIgnorePatterns: ["(tests/.*.mock).(js?|ts?)$"],
  verbose: true,
};
