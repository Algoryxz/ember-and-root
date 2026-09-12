import React from 'react';

export interface ChoiceCardOption<T extends string> {
  id: T;
  label: string;
  description?: string;
  badge?: string;
  hint?: string;
}

export interface ChoiceCardProps<T extends string> {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  options: ChoiceCardOption<T>[];
  selected: T | null;
  onSelect: (id: T) => void;
  className?: string;
}

export function ChoiceCard<T extends string>({
  title,
  subtitle,
  eyebrow,
  options,
  selected,
  onSelect,
  className = '',
}: ChoiceCardProps<T>) {
  return (
    <div className={`w-full max-w-md ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        {eyebrow && (
          <span className="inline-block text-xs uppercase tracking-widest text-[#E98A4B] font-semibold mb-1">
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl font-serif text-[#F0E7D3] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[#B9BEAC] mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Options Stack */}
      <div className="space-y-3" role="radiogroup" aria-label={title}>
        {options.map((opt) => {
          const isChosen = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isChosen}
              onClick={() => onSelect(opt.id)}
              className={`w-full min-h-[56px] p-4 sm:p-5 rounded-xl text-left border transition-all duration-150 ease-out active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] ${
                isChosen
                  ? 'bg-[#232B23] border-[#E98A4B] shadow-lg shadow-[#E98A4B]/10'
                  : 'bg-[#1D231D] border-[#2D382D] hover:border-[#374537] hover:bg-[#202720]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-serif text-[#F0E7D3]">
                      {opt.label}
                    </span>
                    {opt.badge && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#141713] text-[#FFD38A] border border-[#374537]">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {opt.description && (
                    <p className="text-xs sm:text-sm text-[#B9BEAC] mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  )}
                  {opt.hint && (
                    <p className="text-[11px] text-[#8E9782] mt-1 italic">
                      {opt.hint}
                    </p>
                  )}
                </div>

                {/* Radio Circle Indicator */}
                <div
                  className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center transition-colors ${
                    isChosen
                      ? 'border-[#E98A4B] bg-[#E98A4B]'
                      : 'border-[#374537] bg-[#141713]'
                  }`}
                  aria-hidden="true"
                >
                  {isChosen && <div className="w-2 h-2 rounded-full bg-[#141713]" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
