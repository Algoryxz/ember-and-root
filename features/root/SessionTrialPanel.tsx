import React from 'react';
import { AttributeId, BranchState, Specialization, TrialState } from '../../game/contracts';
import { TRIAL_CONFIGS } from './trialConfig';
import { TOKENS } from './tokens';

export interface SessionTrialPanelProps {
  attribute: AttributeId;
  specialization: Specialization;
  branch: BranchState;
  trial: TrialState | null;
  isPending?: boolean;
  error?: string | null;
  onStartTrial?: (attribute: AttributeId, spec: Specialization) => void;
  onProgressSession?: (attribute: AttributeId) => void;
  onClaimCrest?: (attribute: AttributeId) => void;
  className?: string;
}

export const SessionTrialPanel: React.FC<SessionTrialPanelProps> = ({
  attribute,
  specialization,
  branch,
  trial,
  isPending = false,
  error = null,
  onStartTrial,
  onProgressSession,
  onClaimCrest,
  className = '',
}: SessionTrialPanelProps) => {
  const config = TRIAL_CONFIGS[specialization];
  const requiredDays = trial?.requiredDays ?? config.requiredDays ?? 5;
  const completedDays = trial?.distinctDaysCompleted ?? 0;
  const progressPercent = Math.min(100, Math.round((completedDays / requiredDays) * 100));

  // Authoritative branch values - DO NOT derive crest eligibility in UI
  const isStarted = branch.trialStarted;
  const isComplete = branch.trialComplete;
  const isCrestAvailable = branch.crestAvailable;
  const isCrestClaimed = branch.crestClaimed;

  return (
    <article
      className={`trial-panel session-trial-panel ${className}`}
      style={{
        backgroundColor: TOKENS.color.surface,
        border: `1px solid ${TOKENS.color.borderEmberSubtle}`,
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
              backgroundColor: isPending ? TOKENS.color.borderLocked : TOKENS.color.ember,
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
            <span>📜</span> {isPending ? 'Starting Trial...' : `Start ${config.title}`}
          </button>
        </div>
      ) : (
        <div>
          {/* Progress Tracker */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: TOKENS.color.textSecondary,
                marginBottom: '6px',
              }}
            >
              <span>Distinct Study/Effort Days:</span>
              <strong style={{ color: TOKENS.color.textPrimary }}>
                {completedDays} / {requiredDays} Days
              </strong>
            </div>
            {/* Visual Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: TOKENS.color.bg,
                borderRadius: TOKENS.radius.sm,
                overflow: 'hidden',
                border: `1px solid ${TOKENS.color.borderLocked}`,
              }}
              role="progressbar"
              aria-valuenow={completedDays}
              aria-valuemin={0}
              aria-valuemax={requiredDays}
              aria-label={`Trial progress: ${completedDays} of ${requiredDays} days complete`}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: isComplete ? TOKENS.color.root : TOKENS.color.ember,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Actions */}
          {!isComplete && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onProgressSession?.(attribute)}
              style={{
                width: '100%',
                minHeight: '44px',
                backgroundColor: TOKENS.color.bg,
                color: TOKENS.color.textPrimary,
                border: `1px solid ${TOKENS.color.ember}`,
                borderRadius: TOKENS.radius.md,
                fontSize: '13px',
                fontWeight: 600,
                cursor: isPending ? 'not-allowed' : 'pointer',
                marginBottom: '8px',
              }}
            >
              {isPending ? 'Recording Progress...' : `+ Record Day Session Progress (${completedDays}/${requiredDays})`}
            </button>
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
