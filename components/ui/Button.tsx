import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'completion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  pending?: boolean;
  completed?: boolean;
  pendingText?: string;
  children?: React.ReactNode;
}

/**
 * Ember & Root — Reusable Button Primitive
 * Owned by: Deeptiman (Experience / Frontend Lead)
 * Visual Direction: Illuminated Field Journal
 * 
 * Invariants:
 * - Native <button> element
 * - Minimum 44×44px interactive target
 * - Warm Ember accent for primary / subtle parchment border for secondary / ghost
 * - Pressed scale micro-interaction (0.97, ~80ms)
 * - Accessible focus-visible and aria-busy states
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  props: ButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {
    variant = 'primary',
    pending = false,
    completed = false,
    pendingText,
    disabled = false,
    type = 'button',
    className = '',
    children,
    ...rest
  } = props;

  const isActionDisabled = disabled || pending || completed;

  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    completion: 'btn-completion',
  }[variant];

  const stateClasses = [
    pending ? 'btn-pending' : '',
    completed ? 'is-completed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const combinedClassName = ['btn', variantClass, stateClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={combinedClassName}
      disabled={isActionDisabled}
      aria-busy={pending ? 'true' : undefined}
      aria-disabled={isActionDisabled ? 'true' : undefined}
      {...rest}
    >
      {pending && <span className="btn-spinner" aria-hidden="true" />}
      <span>{pending && pendingText ? pendingText : children}</span>
    </button>
  );
});
