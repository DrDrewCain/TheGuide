/**
 * Tests for GuestPrompt component.
 * Testing framework: Jest
 * Testing library: React Testing Library (+ @testing-library/user-event)
 *
 * If the project uses Vitest, you can switch jest.fn() to vi.fn() and keep the rest identical.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock framer-motion to render plain elements without animations to keep tests deterministic.
jest.mock('framer-motion', () => {
  const React = require('react');
  const passthrough = React.forwardRef<any, any>((props, ref) =>
    React.createElement(props.as || 'div', { ref, ...props }, props.children)
  );
  // motion.* -> render as the underlying HTML tag via "as" prop, default div
  const motionProxy = new Proxy(passthrough, {
    get: (_target, prop) => {
      // Return a component for any accessed tag (e.g., motion.div, motion.form, etc.)
      return React.forwardRef<any, any>((props, ref) =>
        React.createElement(props.as || 'div', { ref, ...props }, props.children)
      );
    },
  });

  return {
    __esModule: true,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: motionProxy,
  };
});

// Lucide icons render simple SVGs; no behavior to test. Provide lightweight mocks to avoid SVG warnings.
jest.mock('lucide-react', () => ({
  __esModule: true,
  ArrowRight: (props: any) => <svg data-testid="icon-arrow-right" {...props} />,
  Sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,
}));

// Button is a local component. If it adds extra behavior, prefer not to mock.
// However, to ensure deterministic behavior without external styling concerns, we mock as a styled button.
jest.mock('./Button', () => {
  return {
    __esModule: true,
    Button: ({ children, ...rest }: React.ComponentProps<'button'>) => (
      <button {...rest}>{children}</button>
    ),
  };
});

// Utilities
const renderGuestPrompt = (uiProps: Partial<import('./GuestPrompt').GuestPromptProps> = {}) => {
  // Lazy import to ensure mocks are in place before module evaluation
  const { GuestPrompt } = require('./GuestPrompt') as typeof import('./GuestPrompt');

  const defaultProps: import('./GuestPrompt').GuestPromptProps = {
    onSubmit: jest.fn(),
    className: 'test-class',
    isLoading: false,
    placeholder: "e.g., Should I accept a job offer in Austin with a 20% pay increase?",
    defaultValue: '',
  };

  const props = { ...defaultProps, ...uiProps };
  const utils = render(<GuestPrompt {...props} />);
  const textarea = screen.getByLabelText(/what decision are you facing\?/i) as HTMLTextAreaElement;
  const submitBtn = screen.getByRole('button', { name: /analyze/i });
  return { props, utils, textarea, submitBtn };
};

describe('GuestPrompt', () => {
  test('renders label, textarea with placeholder, and marketing text', () => {
    const { textarea } = renderGuestPrompt();

    expect(screen.getByText(/what decision are you facing\?/i)).toBeInTheDocument();
    expect(textarea).toHaveAttribute(
      'placeholder',
      "e.g., Should I accept a job offer in Austin with a 20% pay increase?"
    );
    expect(screen.getByText(/no sign-up required/i)).toBeInTheDocument();
    expect(screen.getByText(/10,000\+ simulations/i)).toBeInTheDocument();
    expect(screen.getByTestId('icon-sparkles')).toBeInTheDocument();
  });

  test('initially disables submit button when prompt is empty/whitespace', async () => {
    const { submitBtn, textarea } = renderGuestPrompt({ defaultValue: '' });
    expect(submitBtn).toBeDisabled();

    await userEvent.type(textarea, '   ');
    expect(submitBtn).toBeDisabled();
  });

  test('enables submit button when prompt has non-whitespace text and calls onSubmit on submit', async () => {
    const { textarea, submitBtn, props } = renderGuestPrompt();
    await userEvent.type(textarea, 'Take job in Austin?');

    expect(submitBtn).toBeEnabled();
    await userEvent.click(submitBtn);

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onSubmit).toHaveBeenCalledWith('Take job in Austin?');
  });

  test('does not submit when isLoading is true and shows loading indicator', async () => {
    const { textarea, props } = renderGuestPrompt({ isLoading: true });

    // When loading, the button label changes to "Analyzing..."
    expect(screen.getByText(/analyzing\.\.\./i)).toBeInTheDocument();

    await userEvent.type(textarea, 'Move to Seattle?');
    const loadingBtn = screen.getByRole('button', { name: /analyzing\.\.\./i });

    expect(loadingBtn).toBeDisabled();
    await userEvent.click(loadingBtn);
    expect(props.onSubmit).not.toHaveBeenCalled();
  });

  test('respects defaultValue and updates when defaultValue prop changes', async () => {
    const { utils, textarea } = renderGuestPrompt({ defaultValue: 'MBA vs work?' });
    expect(textarea.value).toBe('MBA vs work?');

    // Rerender with a new defaultValue to ensure effect updates internal state
    const { GuestPrompt } = require('./GuestPrompt') as typeof import('./GuestPrompt');
    const onSubmit = jest.fn();
    utils.rerender(<GuestPrompt onSubmit={onSubmit} defaultValue="Buy a house now?" />);

    expect((await screen.findByLabelText(/what decision/i))).toHaveValue('Buy a house now?');
  });

  test('shows suggestions on focus when prompt is empty and hides when prompt is filled', async () => {
    const { textarea } = renderGuestPrompt({ defaultValue: '' });

    // Focus the textarea to trigger suggestions visibility
    textarea.focus();

    // Verify suggestions header
    expect(await screen.findByText(/try one of these examples/i)).toBeInTheDocument();

    // At least one known suggestion is present
    const example = await screen.findByRole('button', {
      name: /should i take a job offer with 30% more pay but longer hours\?/i,
    });
    expect(example).toBeInTheDocument();

    // Click a suggestion populates the textarea and hides the suggestions
    await userEvent.click(example);
    expect(textarea.value).toMatch(/30% more pay/i);

    // After value is set, the suggestion block should disappear
    expect(screen.queryByText(/try one of these examples/i)).not.toBeInTheDocument();
  });

  test('clicking a suggestion focuses the textarea for immediate editing', async () => {
    const { textarea } = renderGuestPrompt({ defaultValue: '' });
    textarea.focus();

    const example = await screen.findByRole('button', {
      name: /is it worth moving to seattle for a tech job\?/i,
    });
    await userEvent.click(example);

    // JSDOM focus tracking
    expect(document.activeElement).toBe(textarea);
  });

  test('auto-resizes textarea when prompt changes (sets style.height to scrollHeight)', async () => {
    const { textarea } = renderGuestPrompt({ defaultValue: '' });

    // Mock scrollHeight to a deterministic value. JSDOM doesn't compute layout sizes.
    Object.defineProperty(textarea, 'scrollHeight', {
      value: 200,
      configurable: true,
    });

    await userEvent.type(textarea, 'A'.repeat(10));
    // The effect runs after value change; style.height should be updated to "200px"
    expect(textarea.style.height).toBe('200px');
  });

  test('form submit via Enter key inside textarea triggers submit when non-empty', async () => {
    const { textarea, props } = renderGuestPrompt();

    await userEvent.type(textarea, 'Back to school vs work{enter}');
    // The default handler is a form submit; our Button is type="submit"
    // onSubmit should fire since prompt is non-empty and not loading
    expect(props.onSubmit).toHaveBeenCalledWith('Back to school vs work');
  });

  test('trim behavior: leading/trailing whitespace still enables submit but value is not trimmed for callback', async () => {
    // According to implementation, trim is only used for disabling; it submits raw prompt
    const { textarea, submitBtn, props } = renderGuestPrompt();
    await userEvent.type(textarea, '   Buy now or wait?   ');
    expect(submitBtn).toBeEnabled();
    await userEvent.click(submitBtn);
    expect(props.onSubmit).toHaveBeenCalledWith('   Buy now or wait?   ');
  });
});