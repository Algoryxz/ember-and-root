import React, { useState } from 'react';
import { AttributeId, BranchState, Specialization, TrialState } from '../../game/contracts';
import { TRIAL_CONFIGS } from './trialConfig';

export interface MilestoneTrialPanelProps {
  attribute: AttributeId;
  specialization: Specialization;
  branch: BranchState;
  trial: TrialState | null;
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
    if (inputText.trim() && onRecordMilestone) {
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

      {/* Trial Body */}
      {!isStarted ? (
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={() => onStartTrial?.(attribute, specialization)}
            style={{
              width: '100%',
              minHeight: '44px',
              backgroundColor: '#FFD38A',
              color: '#141713',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>✍️</span> Start {config.title}
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
                disabled={!inputText.trim()}
                style={{
                  width: '100%',
                  minHeight: '44px',
                  backgroundColor: inputText.trim() ? '#E98A4B' : '#2A322A',
                  color: inputText.trim() ? '#141713' : '#B9BEAC',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Declare Milestone Reflection
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
              onClick={() => onClaimCrest?.(attribute)}
              style={{
                width: '100%',
                minHeight: '44px',
                backgroundColor: '#9FBA87',
                color: '#141713',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(159, 186, 135, 0.4)',
              }}
            >
              👑 Claim {config.crestName} Crest!
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
