// src/ai/taskGovernance.js
export function requireHumanConfirm({ action, resource }) {
  return {
    allowed: false,
    reason: `Human confirmation required before "${action}" on "${resource}".`
  };
}
