/**
 * StatsCard component tests
 * Framework: Jest
 * Library: @testing-library/react
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { StatsCard } from "./StatsCard";

/**
 * Additional StatsCard tests
 * - Library: @testing-library/react
 * - Matchers: Base expect (no jest-dom required)
 * - Focus: change/trend rendering, icons, class names, and props coverage
 */
describe("StatsCard - additional coverage", () => {
  const React = require("react");
  const { render, screen } = require("@testing-library/react");
  const { StatsCard } = require("./StatsCard");

  it("renders label and numeric value", () => {
    const { container } = render(React.createElement(StatsCard, { label: "Revenue", value: 123 }));
    expect(screen.getByText("Revenue")).toBeTruthy();
    expect(screen.getByText("123")).toBeTruthy();
    // When change is undefined, no percentage should be shown
    expect(screen.queryByText(/%$/)).toBeNull();
    expect(container.firstElementChild).toBeTruthy();
  });

  it("renders label with string value", () => {
    render(React.createElement(StatsCard, { label: "Status", value: "OK" }));
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("OK")).toBeTruthy();
  });

  it('shows positive change with "up" trend: green text and up icon', () => {
    const { container } = render(React.createElement(StatsCard, { label: "L", value: 100, change: 5, trend: "up" }));
    // Text content "+5%"
    expect(screen.getByText(/\+5%$/)).toBeTruthy();
    // Percent text colored green
    const pct = container.querySelector("span.text-green-600");
    expect(pct).toBeTruthy();
    // Up arrow icon (lucide) should be present with green-500 class
    const upIcon = container.querySelector("svg.w-4.h-4.text-green-500");
    expect(upIcon).toBeTruthy();
  });

  it('shows negative change with "down" trend: red text and down icon', () => {
    const { container } = render(React.createElement(StatsCard, { label: "L", value: 100, change: -3, trend: "down" }));
    expect(screen.getByText(/-3%$/)).toBeTruthy();
    const pct = container.querySelector("span.text-red-600");
    expect(pct).toBeTruthy();
    const downIcon = container.querySelector("svg.w-4.h-4.text-red-500");
    expect(downIcon).toBeTruthy();
  });

  it("renders zero change and no trend: gray text and no trend icon", () => {
    const { container } = render(React.createElement(StatsCard, { label: "Z", value: 0, change: 0 }));
    expect(screen.getByText(/^0%$/)).toBeTruthy();
    const pct = container.querySelector("span.text-gray-600");
    expect(pct).toBeTruthy();
    // No up/down trend icons
    const trendIcon = container.querySelector("svg.text-green-500, svg.text-red-500");
    expect(trendIcon).toBeNull();
  });

  it("renders positive change with no trend: gray text and no trend icon", () => {
    const { container } = render(React.createElement(StatsCard, { label: "X", value: 42, change: 8 }));
    expect(screen.getByText(/\+8%$/)).toBeTruthy();
    const pct = container.querySelector("span.text-gray-600");
    expect(pct).toBeTruthy();
    const trendIcon = container.querySelector("svg.text-green-500, svg.text-red-500");
    expect(trendIcon).toBeNull();
  });

  it("renders provided custom icon", () => {
    const React = require("react");
    const customIcon = React.createElement("span", { "data-testid": "custom-icon" }, "I");
    const { container } = render(React.createElement(StatsCard, { label: "With Icon", value: "v", icon: customIcon }));
    expect(screen.getByTestId("custom-icon")).toBeTruthy();
    // Icon wrapper container exists
    const iconWrap = container.querySelector(".w-12.h-12.bg-gray-100.rounded-full");
    expect(iconWrap).toBeTruthy();
  });

  it("applies custom className to the root container", () => {
    const { container } = render(React.createElement(StatsCard, { label: "C", value: 1, className: "custom-class" }));
    const root = container.firstElementChild;
    expect(root).toBeTruthy();
    // Ensure our custom class is applied alongside base classes
    expect((root as HTMLElement).className).toContain("custom-class");
  });

  it('trend styling is independent of change sign (up trend with negative change)', () => {
    const { container } = render(React.createElement(StatsCard, { label: "Edge", value: 1, change: -2, trend: "up" }));
    // Text should display '-2%' but styling/icon follow 'up'
    expect(screen.getByText(/-2%$/)).toBeTruthy();
    const pct = container.querySelector("span.text-green-600");
    expect(pct).toBeTruthy();
    const upIcon = container.querySelector("svg.w-4.h-4.text-green-500");
    expect(upIcon).toBeTruthy();
  });
});