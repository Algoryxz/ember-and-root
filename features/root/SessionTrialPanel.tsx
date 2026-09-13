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
      <header style={{ marginBottom: '16px', borderBottom: '1px solid rgba(159, 186, 135, 0.15)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            <div
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: TOKENS.color.textSecondary,
                fontFamily: TOKENS.font.display,
                fontStyle: 'italic',
                marginBottom: '2px',
              }}
            >
              FOLIO NO. T-{specialization.toUpperCase()} · DATED EVIDENCE RECORD
            </div>
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
          </div>
          <span
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: TOKENS.radius.sm,
              fontWeight: 600,
              letterSpacing: '0.05em',
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
        <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: TOKENS.color.textSecondary, lineHeight: '1.4' }}>
          {config.description}
        </p>
        {trial?.startedAt && (
          <div
            style={{
              fontSize: '11px',
              color: TOKENS.color.root,
              fontFamily: TOKENS.font.display,
              fontStyle: 'italic',
              marginTop: '6px',
            }}
          >
            Initiated: {trial.startedAt.split('T')[0]}
          </div>
        )}
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
          <strong>Error:</strong> {error}
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
          {/* Botanical Evidence Folio Grid */}
          <div className="botanical-evidence-folio" style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: TOKENS.color.textSecondary,
                marginBottom: '10px',
                fontFamily: TOKENS.font.display,
              }}
            >
              <span>EVIDENCE RECORD ({completedDays} / {requiredDays} SESSIONS SEALED):</span>
              <strong style={{ color: TOKENS.color.textPrimary }}>
                {isComplete ? 'ALL RITUALS COMPLETE' : `${requiredDays - completedDays} REMAINING`}
              </strong>
            </div>

            {/* Grid of Dated Evidence Slots */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {Array.from({ length: requiredDays }).map((_, idx) => {
                const isSealed = idx < completedDays;
                const dayNum = String(idx + 1).padStart(2, '0');
                const isFirstDay = idx === 0 && trial?.startedAt;

                return (
                  <div
                    key={idx}
                    className={`evidence-slot ${isSealed ? 'sealed' : 'pending'}`}
                    style={{
                      padding: '10px 12px',
                      borderRadius: TOKENS.radius.md,
                      backgroundColor: isSealed ? '#1F2A1E' : 'rgba(25, 32, 25, 0.6)',
                      border: isSealed ? `1px solid ${TOKENS.color.root}` : `1px dashed ${TOKENS.color.borderLocked}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'border-color 0.2s ease, background-color 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isSealed ? TOKENS.color.rootMature : TOKENS.color.textSecondary,
                          fontFamily: TOKENS.font.ui,
                          letterSpacing: '0.05em',
                        }}
                      >
                        DAY {dayNum}
                      </span>
                      <span style={{ fontSize: '12px' }} aria-hidden="true">
                        {isSealed ? '🌿' : '⏳'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '10px',
                        fontFamily: TOKENS.font.display,
                        fontStyle: 'italic',
                        color: isSealed ? TOKENS.color.textPrimary : TOKENS.color.textSecondary,
                      }}
                    >
                      {isSealed
                        ? isFirstDay
                          ? `SEALED [${trial.startedAt.split('T')[0]}]`
                          : 'SEALED IMPRESSION'
                        : 'PENDING RITUAL'}
                    </div>
                  </div>
                );
              })}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
              }}
            >
              <span>✒️</span> {isPending ? 'Recording Progress...' : `Inscribe Day Session Progress (${completedDays}/${requiredDays})`}
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
              📜 Trial evidence complete! Reach 160 Branch XP to unlock Crest claim (Current: {branch.xp}/160 XP).
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>👑</span> {isPending ? 'Claiming Crest...' : `Claim ${config.crestName} Crest!`}
            </button>
          )}

          {/* Claimed Badge */}
          {isCrestClaimed && (
            <div
              style={{
                padding: '12px',
                backgroundColor: TOKENS.color.surfaceHover,
                border: `1px solid ${TOKENS.color.root}`,
                borderRadius: TOKENS.radius.md,
                color: TOKENS.color.rootMature,
                fontSize: '13px',
                textAlign: 'center',
                fontWeight: 600,
                fontFamily: TOKENS.font.display,
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

