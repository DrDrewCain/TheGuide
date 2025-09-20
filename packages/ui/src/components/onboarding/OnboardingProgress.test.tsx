/**
 * Tests for OnboardingProgress component
 * Framework: React Testing Library with Jest/Vitest (jsdom). 
 * If your project uses a custom test-utils wrapper, replace direct RTL imports accordingly.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest'; // safe for Jest: will be tree-shaken or unused; if Jest is used, replace vi with jest as needed.
import * as FramerMotion from 'framer-motion';

// Mock framer-motion to reduce animation noise and make deterministic assertions.
// We keep key props (like className, children) and forward others.
vi.spyOn(FramerMotion, 'motion', 'get').mockReturnValue({
  // Minimal proxy that renders plain div/span while preserving props
  div: ({ children, className, ...rest }: any) => <div className={className} data-motion="div" {...rest}>{children}</div>,
  span: ({ children, className, ...rest }: any) => <span className={className} data-motion="span" {...rest}>{children}</span>,
} as any);

import { OnboardingProgress } from './OnboardingProgress';

function setup(props: Partial<React.ComponentProps<typeof OnboardingProgress>> = {}) {
  const defaultProps = { currentStep: 2, totalSteps: 5 } as const;
  return render(<OnboardingProgress {...defaultProps} {...props} />);
}

describe('OnboardingProgress', () => {
  test('renders progress header and step summary with correct values (happy path)', () => {
    setup({ currentStep: 3, totalSteps: 7 });
    expect(screen.getByText(/Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 3/i)).toBeInTheDocument();
    expect(screen.getByText(/of 7/i)).toBeInTheDocument();
    // percentage is rounded
    expect(screen.getByText('43%')).toBeInTheDocument();
    expect(screen.getByText(/Complete/i)).toBeInTheDocument();
  });

  test('shows remaining steps message when not on last step', () => {
    setup({ currentStep: 1, totalSteps: 4 });
    expect(screen.getByText('3 steps remaining to complete onboarding')).toBeInTheDocument();
  });

  test('shows completion message when on final step', () => {
    setup({ currentStep: 5, totalSteps: 5 });
    expect(screen.getByText("You're all done\! 🎉")).toBeInTheDocument();
    // 100% rounded display
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  test('renders one circular indicator per total step and marks states correctly (completed/current/upcoming)', () => {
    const { container } = setup({ currentStep: 3, totalSteps: 5 });
    // Pill/step circles are rendered as motion.div (mocked to div) carrying classes; count by class pattern.
    const circles = container.querySelectorAll('.w-12.h-12.rounded-full');
    expect(circles.length).toBe(5);

    // Completed steps (1 and 2) should not show the step number text; instead they show a Check icon (svg)
    // Verify by checking that the first two circles do not contain text "1" or "2".
    const indicators = container.querySelectorAll('[data-motion="div"].relative > [data-motion="div"].w-12.h-12.rounded-full');
    expect(indicators.length).toBe(5);

    const circle1 = indicators[0];
    const circle2 = indicators[1];
    const circle3 = indicators[2];
    const circle4 = indicators[3];
    const circle5 = indicators[4];

    // Completed: have bg-green-500 & no numeric text
    expect(circle1.className).toMatch(/bg-green-500/);
    expect(circle2.className).toMatch(/bg-green-500/);
    expect(within(circle1).queryByText('1')).not.toBeInTheDocument();
    expect(within(circle2).queryByText('2')).not.toBeInTheDocument();
    // Current: has border-[#b4e300] and displays the number bold
    expect(circle3.className).toMatch(/border-\[#b4e300\]/);
    expect(within(circle3).getByText('3')).toBeInTheDocument();
    // Upcoming: have border-slate-300 and are greyed
    expect(circle4.className).toMatch(/border-slate-300/);
    expect(circle5.className).toMatch(/border-slate-300/);
  });

  test('displays "Current Step" label and pulse layers only for current step', () => {
    const { container } = setup({ currentStep: 2, totalSteps: 3 });
    // "Current Step" label appears once
    expect(screen.getByText('Current Step')).toBeInTheDocument();

    // Two pulse overlays exist for the current step only (both are absolute inset-0 w-12 h-12)
    const pulses = container.querySelectorAll('.absolute.inset-0.w-12.h-12.rounded-full.bg-\\[\\#b4e300\\]');
    // Should be 2 pulses (opacity-30 and opacity-20)
    expect(pulses.length).toBe(2);
  });

  test('applies custom className to root wrapper alongside defaults', () => {
    const { container } = setup({ className: 'test-extra-class', currentStep: 1, totalSteps: 3 });
    const root = container.querySelector('.w-full.max-w-3xl.mx-auto');
    expect(root).toHaveClass('test-extra-class');
  });

  test('edge case: totalSteps = 1 results in a single indicator and 100% progress', () => {
    const { container } = setup({ currentStep: 1, totalSteps: 1 });
    const circles = container.querySelectorAll('.w-12.h-12.rounded-full');
    expect(circles.length).toBe(1);
    expect(screen.getByText('100%')).toBeInTheDocument();
    // Still shows the "You're all done\!" message given currentStep === totalSteps
    expect(screen.getByText("You're all done\! 🎉")).toBeInTheDocument();
  });

  test('edge case: currentStep below 1 clamps display semantics (shows negative/0 inputs gracefully)', () => {
    // Component does no clamping; ensure it renders without crashing and UI texts reflect inputs as given
    const { container } = setup({ currentStep: 0 as any, totalSteps: 4 });
    // Step label shows "Step 0 of 4"
    expect(screen.getByText(/Step 0/i)).toBeInTheDocument();
    expect(screen.getByText(/of 4/i)).toBeInTheDocument();
    // There should still be 4 circles
    expect(container.querySelectorAll('.w-12.h-12.rounded-full').length).toBe(4);
  });

  test('edge case: currentStep greater than totalSteps still renders and marks all steps as completed', () => {
    const { container } = setup({ currentStep: 6, totalSteps: 5 });
    const circles = Array.from(container.querySelectorAll('.w-12.h-12.rounded-full'));
    expect(circles.length).toBe(5);
    // All should be completed (bg-green-500) because stepNumber < currentStep for all
    circles.forEach(c => expect(c.className).toMatch(/bg-green-500/));
    // Percentage can exceed 100% due to inputs; rounded display shows 120%
    expect(screen.getByText('120%')).toBeInTheDocument();
  });

  test('edge case: totalSteps = 0 does not crash and renders NaN% (by current implementation)', () => {
    const { container } = setup({ currentStep: 0, totalSteps: 0 });
    // Just ensure the component renders a wrapper
    expect(container.querySelector('.w-full.max-w-3xl.mx-auto')).toBeInTheDocument();
    // Progress shows NaN%
    expect(screen.getByText('NaN%')).toBeInTheDocument();
  });
});