import React, { forwardRef } from 'react';
import './PathButton.css';

export type PathButtonVariant = 'ember' | 'charcoal' | 'parchment' | 'seal' | 'ghost';
export type PathButtonSize = 'sm' | 'md' | 'lg';

export interface PathButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PathButtonVariant;
  size?: PathButtonSize;
  pending?: boolean;
  holdingPressure?: boolean;
  completed?: boolean;
  pendingText?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * PathButton — Tactile Physical Button Primitive
 *
 * Adapted from Petr Knoll's physical button mechanics (referenced on 21st.dev/CodePen)
 * Rebuilt strictly in Ember & Root's material language:
 * - Layer 1: Dark ink/charcoal base well with inner shadow (the depression well)
 * - Layer 2: Hand-ground brass/copper rim with subtle directional highlight
 * - Layer 3: Solid Ember copper face (#E98A4B) or deep forest charcoal face (#1D231D)
 * - Hover: warm ember simmer expands, rim highlight shifts
 * - Press (80–120ms): physical downward displacement (translate-y: 2px), compression of well depth
 * - Pending/Holding Pressure: held downward displacement with simmering core embers
 * - Focus: 2px pale-gold (#C4A96A) ring with 2px offset
 * - Zero glassmorphism, zero blue/purple gradients
 */
export const PathButton = forwardRef<HTMLButtonElement, PathButtonProps>(function PathButton(
  props: PathButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const {
    variant = 'ember',
    size = 'md',
    pending = false,
    holdingPressure = false,
    completed = false,
    pendingText,
    icon,
    disabled = false,
    type = 'button',
    className = '',
    children,
    ...rest
  } = props;

  const isActionDisabled = disabled || pending || completed;
  const isDepressed = holdingPressure || pending;

  const variantClass = `path-btn-${variant}`;
  const sizeClass = `path-btn-${size}`;

  const stateClasses = [
    isDepressed ? 'is-depressed' : '',
    pending ? 'is-pending' : '',
    completed ? 'is-completed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const combinedClassName = ['path-btn', variantClass, sizeClass, stateClasses, className]
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
      {/* Layer 1: Well base */}
      <span className="path-btn-well" aria-hidden="true" />

      {/* Layer 2: Hand-ground rim highlight */}
      <span className="path-btn-rim" aria-hidden="true" />

      {/* Layer 3: Surface face */}
      <span className="path-btn-face">
        {pending && <span className="path-btn-ember-spark" aria-hidden="true" />}
        {!pending && icon && <span className="path-btn-icon" aria-hidden="true">{icon}</span>}
        <span className="path-btn-content">
          {pending && pendingText ? pendingText : children}
        </span>
      </span>
    </button>
  );
});
