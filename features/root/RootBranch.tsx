import React, { useState } from 'react';
import { AttributeId, BranchState, NodeState, RootNodeInfo, Specialization, TrialState } from './types';
import { BRANCH_CONFIGS } from './config';
import { TRIAL_CONFIGS } from './trialConfig';
import { TOKENS } from './tokens';
import { BranchSvgRenderer } from './svg/BranchSvgRenderer';
import { RootNodeButton } from './RootNodeButton';
import { RootList } from './RootList';
import { SessionTrialPanel } from './SessionTrialPanel';
import { MilestoneTrialPanel } from './MilestoneTrialPanel';

export interface RootBranchProps {
  attribute: AttributeId;
  state: BranchState;
  trial?: TrialState | null;
  isPending?: boolean;
  error?: string | null;
  onSelectSpecialization?: (attribute: AttributeId, spec: Specialization) => void;
  onStartTrial?: (attribute: AttributeId, spec: Specialization) => void;
  onProgressSession?: (attribute: AttributeId) => void;
  onRecordMilestone?: (attribute: AttributeId, text: string) => void;
  onClaimCrest?: (attribute: AttributeId) => void;
  className?: string;
}

export const RootBranch: React.FC<RootBranchProps> = ({
  attribute,
  state,
  trial = null,
  isPending = false,
  error = null,
  onSelectSpecialization,
  onStartTrial,
  onProgressSession,
  onRecordMilestone,
  onClaimCrest,
  className = '',
}: RootBranchProps) => {
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

  const config = BRANCH_CONFIGS[attribute];
  const {
    xp,
    specialization,
    specializationAvailable,
    crestAvailable,
    crestClaimed,
  } = state;

  const legacySpec = (state as any).selectedSpecialization;
  const activeSpec: Specialization | null = specialization || legacySpec || null;
  const activeTrialConfig = activeSpec ? TRIAL_CONFIGS[activeSpec] : null;

  // Node state derivations
  const originState: NodeState = xp >= 1 ? 'unlocked' : 'locked';

  const spec1 = config.specializations[0];
  const spec2 = config.specializations[1];

  let spec1State: NodeState = 'locked';
  let spec2State: NodeState = 'locked';

  if (activeSpec === spec1.id) {
    spec1State = 'selected';
    spec2State = 'locked';
  } else if (activeSpec === spec2.id) {
    spec2State = 'selected';
    spec1State = 'locked';
  } else if (specializationAvailable) {
    spec1State = 'available';
    spec2State = 'available';
  }

  // Authoritative branch value - DO NOT derive crest eligibility in UI
  const isCrestAvailable = crestAvailable;

  const spec1CrestState: NodeState =
    activeSpec === spec1.id
      ? crestClaimed
        ? 'selected'
        : isCrestAvailable
        ? 'available'
        : state.trialComplete
        ? 'unlocked'
        : 'locked'
      : 'locked';

  const spec2CrestState: NodeState =
    activeSpec === spec2.id
      ? crestClaimed
        ? 'selected'
        : isCrestAvailable
        ? 'available'
        : state.trialComplete
        ? 'unlocked'
        : 'locked'
      : 'locked';

  // Node definitions with coordinates matching SVG viewBox 360x480
  const nodes: RootNodeInfo[] = [
    {
      id: config.originNode.id,
      label: config.originNode.label,
      subtitle: config.originNode.subtitle,
      type: 'origin',
      state: originState,
      xpRequired: 1,
      description: config.originNode.description,
      coordinates: { x: 180, y: 80, percentX: 50, percentY: 16.6 },
    },
    {
      id: spec1.id,
      label: spec1.label,
      subtitle: spec1.subtitle,
      type: 'specialization',
      specializationKey: spec1.id,
      state: spec1State,
      xpRequired: 80,
      description: spec1.description,
      coordinates: { x: 100, y: 220, percentX: 27.7, percentY: 45.8 },
    },
    {
      id: spec2.id,
      label: spec2.label,
      subtitle: spec2.subtitle,
      type: 'specialization',
      specializationKey: spec2.id,
      state: spec2State,
      xpRequired: 80,
      description: spec2.description,
      coordinates: { x: 260, y: 220, percentX: 72.2, percentY: 45.8 },
    },
    {
      id: spec1.crest.id,
      label: spec1.crest.label,
      subtitle: spec1.crest.subtitle,
      type: 'crest',
      state: spec1CrestState,
      xpRequired: 160,
      description: spec1.crest.description,
      coordinates: { x: 100, y: 370, percentX: 27.7, percentY: 77.0 },
    },
    {
      id: spec2.crest.id,
      label: spec2.crest.label,
      subtitle: spec2.crest.subtitle,
      type: 'crest',
      state: spec2CrestState,
      xpRequired: 160,
      description: spec2.crest.description,
      coordinates: { x: 260, y: 370, percentX: 72.2, percentY: 77.0 },
    },
  ];

  return (
    <section
      className={`root-branch-container ${className}`}
      aria-label={`${config.title}`}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          borderBottom: `1px solid ${TOKENS.color.borderRootSubtle}`,
          paddingBottom: '8px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontFamily: TOKENS.font.display,
              fontSize: '20px',
              color: TOKENS.color.textPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: config.accentColor,
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
            {config.title}
          </h2>
          <span style={{ fontSize: '12px', color: TOKENS.color.textSecondary }}>
            {config.subtitle} ({xp} XP)
          </span>
        </div>

        {/* View Mode Switcher */}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'visual' ? 'list' : 'visual')}
          style={{
            backgroundColor: TOKENS.color.bg,
            color: TOKENS.color.textPrimary,
            border: `1px solid ${TOKENS.color.borderLocked}`,
            borderRadius: TOKENS.radius.md,
            padding: '6px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            minHeight: '36px',
          }}
          aria-label={`Switch to ${viewMode === 'visual' ? 'Accessible List' : 'Visual SVG'} view for ${config.title}`}
        >
          {viewMode === 'visual' ? '📋 List View' : '🌿 Visual Tree'}
        </button>
      </header>

      {/* Specialization Prompt Banner */}
      {specializationAvailable && !activeSpec && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: TOKENS.color.nodeLocked,
            border: `1px solid ${TOKENS.color.ember}`,
            borderRadius: TOKENS.radius.lg,
            padding: '10px 14px',
            marginBottom: '12px',
            color: TOKENS.color.emberCore,
            fontSize: '13px',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }} aria-hidden="true">
            ✨
          </span>
          <div>
            <strong>A Path is Ready!</strong>
            <div style={{ fontSize: '12px', color: TOKENS.color.textPrimary }}>
              Select {spec1.label} or {spec2.label} below to commit your {attribute} specialization.
            </div>
          </div>
        </div>
      )}

      {/* Specialization Confirmation Badge */}
      {activeSpec && (
        <div
          style={{
            backgroundColor: TOKENS.color.surfaceHover,
            border: `1px solid ${config.accentColor}`,
            borderRadius: TOKENS.radius.lg,
            padding: '8px 12px',
            marginBottom: '12px',
            color: TOKENS.color.rootMature,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span aria-hidden="true">🌱</span>
            <span>
              Specialization:{' '}
              <strong style={{ textTransform: 'capitalize', color: TOKENS.color.textPrimary }}>
                {activeSpec}
              </strong>
            </span>
          </div>
          {isCrestAvailable && (
            <span
              style={{
                fontSize: '11px',
                backgroundColor: TOKENS.color.ember,
                color: TOKENS.color.bg,
                padding: '2px 6px',
                borderRadius: TOKENS.radius.sm,
                fontWeight: 600,
              }}
            >
              Crest Unlocked!
            </span>
          )}
        </div>
      )}

      {/* Main View Display */}
      {viewMode === 'visual' ? (
        <div className="root-svg-wrapper">
          <BranchSvgRenderer
            attribute={attribute}
            nodes={nodes}
            selectedSpecialization={activeSpec}
          />
          <div className="root-nodes-layer">
            {nodes.map((node: RootNodeInfo) => (
              <RootNodeButton
                key={node.id}
                node={node}
                onSelect={
                  node.specializationKey && onSelectSpecialization && !isPending
                    ? () => onSelectSpecialization(attribute, node.specializationKey!)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <RootList
          attribute={attribute}
          nodes={nodes}
          xp={xp}
          selectedSpecialization={activeSpec}
          onSelectSpecialization={onSelectSpecialization}
        />
      )}

      {/* Trial Panel Integration when Specialization is Active */}
      {activeSpec && activeTrialConfig && (
        activeTrialConfig.kind === 'distinct_days' ? (
          <SessionTrialPanel
            attribute={attribute}
            specialization={activeSpec}
            branch={state}
            trial={trial}
            isPending={isPending}
            error={error}
            onStartTrial={onStartTrial}
            onProgressSession={onProgressSession}
            onClaimCrest={onClaimCrest}
          />
        ) : (
          <MilestoneTrialPanel
            attribute={attribute}
            specialization={activeSpec}
            branch={state}
            trial={trial}
            isPending={isPending}
            error={error}
            onStartTrial={onStartTrial}
            onRecordMilestone={onRecordMilestone}
            onClaimCrest={onClaimCrest}
          />
        )
      )}
    </section>
  );
};
