import React from 'react';

interface JournalRendererProps {
  content: string;
  onToggleChecklist?: (lineIndex: number, isChecked: boolean) => void;
  className?: string;
}

export function JournalRenderer({
  content,
  onToggleChecklist,
  className = '',
}: JournalRendererProps) {
  const lines = content.split('\n');

  // Helper to render inline tags (#mind, #body, #will, #craft, etc.)
  function renderInlineContent(text: string) {
    const parts = text.split(/(#[a-zA-Z0-9_-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.toLowerCase();
        let tagColor = 'bg-[#1D231D] text-[#B9BEAC] border-[#2A332A]';
        if (tag === '#mind') tagColor = 'bg-[#9FBA87]/15 text-[#9FBA87] border-[#9FBA87]/30';
        else if (tag === '#body') tagColor = 'bg-[#D9E3B2]/15 text-[#D9E3B2] border-[#D9E3B2]/30';
        else if (tag === '#will') tagColor = 'bg-[#E98A4B]/15 text-[#E98A4B] border-[#E98A4B]/30';
        else if (tag === '#craft') tagColor = 'bg-[#FFD38A]/15 text-[#FFD38A] border-[#FFD38A]/30';

        return (
          <span
            key={index}
            className={`inline-block px-1.5 py-0.5 mx-0.5 text-xs font-medium rounded-[4px] border ${tagColor}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }

  return (
    <div className={`journal-rendered space-y-2 text-[#F0E7D3] font-['DM_Sans'] text-sm leading-relaxed ${className}`}>
      {lines.map((line, lineIndex) => {
        const trimmed = line.trim();

        // 1. Empty lines -> paragraph spacing
        if (!trimmed) {
          return <div key={lineIndex} className="h-2" />;
        }

        // 2. Horizontal divider
        if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
          return <hr key={lineIndex} className="my-3 border-t border-[#1D231D]" />;
        }

        // 3. Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={lineIndex} className="font-['Fraunces'] text-base font-medium text-[#F0E7D3] mt-3 mb-1">
              {renderInlineContent(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={lineIndex} className="font-['Fraunces'] text-lg font-medium text-[#F0E7D3] mt-3 mb-1">
              {renderInlineContent(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={lineIndex} className="font-['Fraunces'] text-xl font-normal text-[#F0E7D3] mt-4 mb-1">
              {renderInlineContent(trimmed.slice(2))}
            </h2>
          );
        }

        // 4. Blockquotes / Field Inscriptions
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={lineIndex}
              className="pl-3 py-1 my-1 border-l-2 border-[#E98A4B]/60 italic font-['Fraunces'] text-[#B9BEAC] bg-[#141713]/40 rounded-r"
            >
              {renderInlineContent(trimmed.slice(2))}
            </blockquote>
          );
        }

        // 5. Checklists: - [ ] or - [x]
        const checklistMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s*(.*)$/);
        if (checklistMatch) {
          const isChecked = checklistMatch[1].toLowerCase() === 'x';
          const itemText = checklistMatch[2];

          return (
            <div key={lineIndex} className="flex items-start gap-2.5 my-1 group">
              <button
                type="button"
                onClick={() => onToggleChecklist?.(lineIndex, !isChecked)}
                className={`w-4 h-4 mt-0.5 rounded-[4px] border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A96A] ${
                  isChecked
                    ? 'bg-[#E98A4B] border-[#E98A4B] text-[#141713]'
                    : 'bg-[#1D231D] border-[#2A332A] hover:border-[#E98A4B]/60'
                }`}
                aria-label={`Toggle "${itemText}"`}
                aria-pressed={isChecked}
              >
                {isChecked && (
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path
                      fillRule="evenodd"
                      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <span className={isChecked ? 'line-through text-[#B9BEAC]/60' : 'text-[#F0E7D3]'}>
                {renderInlineContent(itemText)}
              </span>
            </div>
          );
        }

        // 6. Bullet lists: - or *
        if (/^[-*]\s+(.*)$/.test(trimmed)) {
          const bulletText = trimmed.replace(/^[-*]\s+/, '');
          return (
            <div key={lineIndex} className="flex items-start gap-2 pl-2 my-0.5">
              <span className="text-[#E98A4B] mt-1 text-xs">•</span>
              <span>{renderInlineContent(bulletText)}</span>
            </div>
          );
        }

        // 7. Numbered lists: 1. 2. etc.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={lineIndex} className="flex items-start gap-2 pl-2 my-0.5">
              <span className="text-[#B9BEAC] text-xs font-mono mt-0.5">{numMatch[1]}.</span>
              <span>{renderInlineContent(numMatch[2])}</span>
            </div>
          );
        }

        // 8. Normal plain text line
        return (
          <p key={lineIndex} className="my-0.5">
            {renderInlineContent(line)}
          </p>
        );
      })}
    </div>
  );
}
