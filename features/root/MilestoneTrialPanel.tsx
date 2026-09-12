import React, { useState } from 'react';
import { AttributeId, BranchState, Specialization, TrialState } from '../../game/contracts';
import { TRIAL_CONFIGS } from './trialConfig';
import { TOKENS } from './tokens';

export interface MilestoneTrialPanelProps {
  attribute: AttributeId;
  specialization: Specialization;
  branch: BranchState;
  trial: TrialState | null;
  isPending?: boolean;
  error?: string | null;
  onStartTrial?: (attribute: AttributeId, spec: Specialization) => void;
  onRecordMilestone?: (attribute: AttributeId, text: string) => void;
  onClaimCrest?: (attribute: AttributeId) => void;
  className?: string;
}

export const MilestoneTrialPanel: React.FC<MilestoneTrialPanelProps> = ({
  attribute,
  specialization,
  branch,
  trial,
  isPending = false,
  error = null,
  onStartTrial,
  onRecordMilestone,
  onClaimCrest,
  className = '',
}: MilestoneTrialPanelProps) => {
  const config = TRIAL_CONFIGS[specialization];
  const [inputText, setInputText] = useState<string>(trial?.milestoneText || '');

  // Authoritative branch values - DO NOT derive crest eligibility in UI
  const isStarted = branch.trialStarted;
  const isComplete = branch.trialComplete;
  const isCrestAvailable = branch.crestAvailable;
  const isCrestClaimed = branch.crestClaimed;

  const handleSubmitMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && onRecordMilestone && !isPending) {
      onRecordMilestone(attribute, inputText.trim());
    }
  };

  return (
    <article
      className={`trial-panel milestone-trial-panel ${className}`}
      style={{
        backgroundColor: TOKENS.color.surface,
        border: `1px solid ${TOKENS.color.borderEmberCoreSubtle}`,
        borderRadius: TOKENS.radius.xl,
        padding: '16px',
        marginTop: '16px',
        color: TOKENS.color.textPrimary,
        fontFamily: TOKENS.font.ui,
        opacity: isPending ? 0.8 : 1,
      }}
      aria-label={`${config.title} Panel`}
    >
      {/* Header */}
      <header style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <h3
            style={{
              margin: 0,
              fontFamily: TOKENS.font.display,
              fontSize: '18px',
              color: TOKENS.color.emberCore,
            }}
          >
            {config.title}
          </h3>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: TOKENS.radius.sm,
              fontWeight: 600,
              textTransform: 'uppercase',
              backgroundColor: isCrestClaimed
                ? TOKENS.color.root
                : isCrestAvailable
                ? TOKENS.color.ember
                : isComplete
                ? TOKENS.color.surfaceHover
                : isStarted
                ? TOKENS.color.borderLocked
                : TOKENS.color.nodeLocked,
              color: isCrestClaimed || isCrestAvailable ? TOKENS.color.bg : TOKENS.color.textSecondary,
            }}
          >
            {isCrestClaimed
              ? 'Crest Claimed'
              : isCrestAvailable
              ? 'Crest Ready'
              : isComplete
              ? 'Trial Complete'
              : isStarted
              ? 'In Progress'
              : 'Not Started'}
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: TOKENS.color.textSecondary }}>
          {config.description}
        </p>
      </header>

      {/* Inline Error State */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            backgroundColor: TOKENS.color.errorBg,
            border: `1px solid ${TOKENS.color.error}`,
            borderRadius: TOKENS.radius.md,
            color: TOKENS.color.error,
            fontSize: '12px',
            marginBottom: '12px',
          }}
        >
          <strong>Mutation Error:</strong> {error}
        </div>
      )}

      {/* Trial Body */}
      {!isStarted ? (
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onStartTrial?.(attribute, specialization)}
            style={{
              width: '100%',
              minHeight: '44px',
              backgroundColor: isPending ? TOKENS.color.borderLocked : TOKENS.color.emberCore,
              color: isPending ? TOKENS.color.textSecondary : TOKENS.color.bg,
              border: 'none',
              borderRadius: TOKENS.radius.md,
              fontSize: '14px',
              fontWeight: 600,
              cursor: isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>✍️</span> {isPending ? 'Starting Trial...' : `Start ${config.title}`}
          </button>
        </div>
      ) : (
        <div>
          {/* Milestone Declaration Input / Output */}
          {!isComplete ? (
            <form onSubmit={handleSubmitMilestone} style={{ marginBottom: '12px' }}>
              <label
                htmlFor={`milestone-input-${attribute}`}
                style={{ display: 'block', fontSize: '12px', color: TOKENS.color.textSecondary, marginBottom: '6px' }}
              >
                {config.evidencePrompt}
              </label>
              <textarea
                id={`milestone-input-${attribute}`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write your milestone reflection..."
                rows={3}
                disabled={isPending}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: TOKENS.color.bg,
                  border: `1px solid ${TOKENS.color.borderLocked}`,
                  borderRadius: TOKENS.radius.md,
                  color: TOKENS.color.textPrimary,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  marginBottom: '8px',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isPending}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  backgroundColor: inputText.trim() && !isPending ? TOKENS.color.ember : TOKENS.color.nodeLocked,
                  color: inputText.trim() && !isPending ? TOKENS.color.bg : TOKENS.color.textSecondary,
                  border: 'none',
                  borderRadius: TOKENS.radius.md,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: inputText.trim() && !isPending ? 'pointer' : 'not-allowed',
                }}
              >
                {isPending ? 'Recording Reflection...' : 'Declare Milestone Reflection'}
              </button>
            </form>
          ) : (
            <div
              style={{
                padding: '12px',
                backgroundColor: TOKENS.color.bg,
                border: `1px solid ${TOKENS.color.borderLocked}`,
                borderRadius: TOKENS.radius.md,
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '11px', color: TOKENS.color.textSecondary, marginBottom: '4px' }}>
                Declared Milestone:
              </div>
              <blockquote
                style={{
                  margin: 0,
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: TOKENS.color.textPrimary,
                  fontFamily: TOKENS.font.display,
                }}
              >
                "{trial?.milestoneText || inputText}"
              </blockquote>
            </div>
          )}

          {/* Trial Complete awaiting 160 Branch XP */}
          {isComplete && !isCrestAvailable && !isCrestClaimed && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: TOKENS.color.surfaceHover,
                border: `1px solid ${TOKENS.color.borderLocked}`,
                borderRadius: TOKENS.radius.md,
                fontSize: '12px',
                color: TOKENS.color.textSecondary,
                marginBottom: '8px',
                textAlign: 'center',
              }}
            >
              📜 Trial completed! Reach 160 Branch XP to unlock Crest claim (Current: {branch.xp}/160 XP).
            </div>
          )}

          {/* Authoritative Claim Crest Button */}
          {isCrestAvailable && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onClaimCrest?.(attribute)}
              style={{
                width: '100%',
                minHeight: '44px',
                backgroundColor: isPending ? TOKENS.color.borderLocked : TOKENS.color.root,
                color: isPending ? TOKENS.color.textSecondary : TOKENS.color.bg,
                border: 'none',
                borderRadius: TOKENS.radius.md,
                fontSize: '14px',
                fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                boxShadow: isPending ? 'none' : '0 0 12px rgba(159, 186, 135, 0.4)',
              }}
            >
              👑 {isPending ? 'Claiming Crest...' : `Claim ${config.crestName} Crest!`}
            </button>
          )}

          {/* Claimed Badge */}
          {isCrestClaimed && (
            <div
              style={{
                padding: '10px',
                backgroundColor: TOKENS.color.surfaceHover,
                border: `1px solid ${TOKENS.color.root}`,
                borderRadius: TOKENS.radius.md,
                color: TOKENS.color.rootMature,
                fontSize: '13px',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              ✨ Permanent Crest Claimed: {config.crestName}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
