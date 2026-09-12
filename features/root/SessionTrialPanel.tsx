import React from 'react';
import { AttributeId, BranchState, Specialization, TrialState } from '../../game/contracts';
import { TRIAL_CONFIGS } from './trialConfig';

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

  const isStarted = branch.trialStarted || !!trial;
  const isComplete = branch.trialComplete || completedDays >= requiredDays;
  const isCrestAvailable = branch.crestAvailable || (isComplete && !branch.crestClaimed && !trial?.claimedAt);
  const isCrestClaimed = branch.crestClaimed || !!trial?.claimedAt;

  return (
    <article
      className={`trial-panel session-trial-panel ${className}`}
      style={{
        backgroundColor: '#1D231D',
        border: '1px solid rgba(233, 138, 75, 0.3)',
        borderRadius: '10px',
        padding: '16px',
        marginTop: '16px',
        color: '#F0E7D3',
        fontFamily: 'DM Sans, sans-serif',
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
              fontFamily: 'Fraunces, serif',
              fontSize: '18px',
              color: '#FFD38A',
            }}
          >
            {config.title}
          </h3>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
              textTransform: 'uppercase',
              backgroundColor: isCrestClaimed ? '#9FBA87' : isCrestAvailable ? '#E98A4B' : isStarted ? '#3B463B' : '#222822',
              color: isCrestClaimed || isCrestAvailable ? '#141713' : '#B9BEAC',
            }}
          >
            {isCrestClaimed ? 'Crest Claimed' : isCrestAvailable ? 'Crest Ready' : isStarted ? 'In Progress' : 'Not Started'}
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#B9BEAC' }}>
          {config.description}
        </p>
      </header>

      {/* Inline Error State */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            backgroundColor: '#2B1A1A',
            border: '1px solid #F0A79D',
            borderRadius: '6px',
            color: '#F0A79D',
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
              backgroundColor: isPending ? '#3B463B' : '#E98A4B',
              color: isPending ? '#B9BEAC' : '#141713',
              border: 'none',
              borderRadius: '6px',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#B9BEAC', marginBottom: '6px' }}>
              <span>Distinct Study/Effort Days:</span>
              <strong style={{ color: '#F0E7D3' }}>{completedDays} / {requiredDays} Days</strong>
            </div>
            {/* Visual Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#141713',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #3B463B',
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
                  backgroundColor: isComplete ? '#9FBA87' : '#E98A4B',
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
                backgroundColor: '#141713',
                color: '#F0E7D3',
                border: '1px solid #E98A4B',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isPending ? 'not-allowed' : 'pointer',
                marginBottom: '8px',
              }}
            >
              {isPending ? 'Recording Progress...' : `+ Record Day Session Progress (${completedDays}/${requiredDays})`}
            </button>
          )}

          {/* Claim Crest Button */}
          {isCrestAvailable && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => onClaimCrest?.(attribute)}
              style={{
                width: '100%',
                minHeight: '44px',
                backgroundColor: isPending ? '#3B463B' : '#9FBA87',
                color: isPending ? '#B9BEAC' : '#141713',
                border: 'none',
                borderRadius: '6px',
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
                backgroundColor: '#263323',
                border: '1px solid #9FBA87',
                borderRadius: '6px',
                color: '#D9E3B2',
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
