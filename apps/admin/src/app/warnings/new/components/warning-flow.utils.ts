export interface WarningFlowInputs {
  title: string;
  message: string;
  areaName: string;
}

export type WarningStep = 'compose' | 'confirm';

export type WarningFlowAction =
  | { type: 'CONTINUE' }
  | { type: 'CANCEL' }
  | { type: 'SENT' };

export function canProceedToConfirmation(input: WarningFlowInputs): boolean {
  return Boolean(input.title.trim() && input.message.trim() && input.areaName.trim());
}

export function warningFlowReducer(
  current: WarningStep,
  action: WarningFlowAction,
): WarningStep {
  if (action.type === 'CONTINUE') {
    return 'confirm';
  }
  if (action.type === 'CANCEL' || action.type === 'SENT') {
    return 'compose';
  }
  return current;
}

export function warningSummary(input: {
  title: string;
  message: string;
  areaName: string;
  radiusKm?: number;
  drawMode?: 'pin' | 'box' | 'polygon';
  hasPolygon?: boolean;
  evacuationCount: number;
}) {
  let targetText = input.areaName;

  if (input.drawMode === 'pin' || (!input.drawMode && input.radiusKm)) {
    targetText = `${input.areaName} (${input.radiusKm ?? 0} km radius)`;
  } else if (input.hasPolygon) {
    targetText = `${input.areaName} (Custom ${input.drawMode === 'box' ? 'box' : 'polygon'})`;
  }

  return {
    heading: input.title,
    body: input.message,
    target: targetText,
    evacuationCount: input.evacuationCount,
  };
}
