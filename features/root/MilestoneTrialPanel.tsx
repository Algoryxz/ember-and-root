import React, { useState } from 'react';
import { AttributeId, BranchState, Specialization, TrialState } from '../../game/contracts';
import { TRIAL_CONFIGS } from './trialConfig';

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

  const isStarted = branch.trialStarted || !!trial;
  const isComplete = branch.trialComplete || !!trial?.milestoneText;
  const isCrestAvailable = branch.crestAvailable || (isComplete && !branch.crestClaimed && !trial?.claimedAt);
  const isCrestClaimed = branch.crestClaimed || !!trial?.claimedAt;

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
        backgroundColor: '#1D231D',
        border: '1px solid rgba(255, 211, 138, 0.3)',
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
              backgroundColor: isPending ? '#3B463B' : '#FFD38A',
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
                style={{ display: 'block', fontSize: '12px', color: '#B9BEAC', marginBottom: '6px' }}
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
                  backgroundColor: '#141713',
                  border: '1px solid #3B463B',
                  borderRadius: '6px',
                  color: '#F0E7D3',
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
                  backgroundColor: inputText.trim() && !isPending ? '#E98A4B' : '#2A322A',
                  color: inputText.trim() && !isPending ? '#141713' : '#B9BEAC',
                  border: 'none',
                  borderRadius: '6px',
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
                backgroundColor: '#141713',
                border: '1px stroke #3B463B',
                borderRadius: '6px',
                marginBottom: '12px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#B9BEAC', marginBottom: '4px' }}>
                Declared Milestone:
              </div>
              <blockquote
                style={{
                  margin: 0,
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: '#F0E7D3',
                  fontFamily: 'Fraunces, serif',
                }}
              >
                "{trial?.milestoneText || inputText}"
              </blockquote>
            </div>
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
