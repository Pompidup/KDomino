import { describe, expect, test } from "vitest";
import createContainer from "./container.js";

type Logger = {
  info: (message: string) => void;
  error: (message: string) => void;
};

const logger = (): Logger => ({
  info: (_message: string) => "Hello world info",
  error: (_message: string) => "Hello world error",
});

const secondLogger = (): Logger => ({
  info: (_message: string) => "Hello world info 2",
  error: (_message: string) => "Hello world error 2",
});

describe("createContainer", () => {
  test("should register a dependency and return test", () => {
    // Arrange
    const container = createContainer();

    // Act
    container.register<Logger>("logger", logger, false);
    const deps = container.resolve<Logger>("logger");

    // Assert
    expect(deps).toBeDefined();
    expect(deps.info("Hello world")).toBe("Hello world info");
    expect(deps.error("Hello world")).toBe("Hello world error");
  });

  test("should register a singleton dependency and return test", () => {
    // Arrange
    const container = createContainer();

    // Act
    container.register<Logger>("logger", logger, true);
    const deps = container.resolve<Logger>("logger");

    // Assert
    expect(deps).toBeDefined();
    expect(deps.info("Hello world")).toBe("Hello world info");
    expect(deps.error("Hello world")).toBe("Hello world error");
  });

  test("should replace depency if already exist", () => {
    // Arrange
    const container = createContainer();
    container.register<Logger>("logger", logger, false);

    // Act
    container.register<Logger>("logger", secondLogger, false);
    const deps = container.resolve<Logger>("logger");

    // Assert
    expect(deps).toBeDefined();
    expect(deps.info("Hello world")).toBe("Hello world info 2");
    expect(deps.error("Hello world")).toBe("Hello world error 2");
  });

  test("should not replace a singleton instance", () => {
    // Arrange
    const container = createContainer();
    container.register<Logger>("logger", logger, true);

    // Act
    container.register<Logger>("logger", secondLogger, true);
    const deps = container.resolve<Logger>("logger");

    // Assert
    expect(deps).toBeDefined();
    expect(deps.info("Hello world")).toBe("Hello world info");
    expect(deps.error("Hello world")).toBe("Hello world error");
  });

  test("should not replace a singleton instance wtesth a normal instance", () => {
    // Arrange
    const container = createContainer();
    container.register<Logger>("logger", logger, true);

    // Act
    container.register<Logger>("logger", secondLogger, false);
    const deps = container.resolve<Logger>("logger");

    // Assert
    expect(deps).toBeDefined();
    expect(deps.info("Hello world")).toBe("Hello world info");
    expect(deps.error("Hello world")).toBe("Hello world error");
  });

  test("should replace a normal instance wtesth a singleton instance", () => {
    // Arrange
    const container = createContainer();
    container.register<Logger>("logger", logger, false);

    // Act
    container.register<Logger>("logger", secondLogger, true);
    const deps = container.resolve<Logger>("logger");

    // Assert
    expect(deps).toBeDefined();
    expect(deps.info("Hello world")).toBe("Hello world info 2");
    expect(deps.error("Hello world")).toBe("Hello world error 2");
  });

  test("should throw an error when dependency is not found", () => {
    // Arrange
    const container = createContainer();

    // Act
    const action = () => container.resolve<Logger>("logger");

    // Assert
    expect(action).toThrow("Dependency logger not found");
  });

  test("should reset the container", () => {
    // Arrange
    const container = createContainer();
    container.register<Logger>("logger", logger, false);
    container.register<Logger>("secondLogger", secondLogger, true);

    // Act
    container.reset();
    const action = () => container.resolve<Logger>("logger");

    // Assert
    expect(action).toThrow("Dependency logger not found");
  });

  test("should remove a specific dependency", () => {
    // Arrange
    const container = createContainer();
    container.register<Logger>("logger", logger, false);
    container.register<Logger>("secondLogger", secondLogger, true);

    // Act
    container.remove("logger");
    container.remove("secondLogger");

    const action = () => container.resolve<Logger>("logger");
    const action2 = () => container.resolve<Logger>("secondLogger");

    // Assert
    expect(action).toThrow("Dependency logger not found");
    expect(action2).toThrow("Dependency secondLogger not found");
  });
});
