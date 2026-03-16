import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "next-themes";
import { describe, expect, it, vi } from "vitest";

// Mock the useTheme hook
vi.mock("next-themes", () => ({
  __esModule: true,
  useTheme: vi.fn(),
}));

describe("ThemeToggle", () => {
  it("should render correctly in light mode and switch to dark mode on click", () => {
    // Arrange
    const setTheme = vi.fn();
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: "light",
      setTheme,
    });

    render(<ThemeToggle />);

    // Assert
    expect(screen.getByLabelText("Cambiar a modo oscuro")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cambiar a modo claro")).toBeNull();

    // Act
    fireEvent.click(screen.getByRole("button"));

    // Assert that setTheme was called with 'dark'
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("should render correctly in dark mode and switch to light mode on click", () => {
    // Arrange
    const setTheme = vi.fn();
    (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: "dark",
      setTheme,
    });

    render(<ThemeToggle />);

    // Assert
    expect(screen.getByLabelText("Cambiar a modo claro")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cambiar a modo oscuro")).toBeNull();

    // Act
    fireEvent.click(screen.getByRole("button"));

    // Assert that setTheme was called with 'light'
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
