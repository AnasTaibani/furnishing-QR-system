// End Use constants for furnishing products
export const END_USES = [
  { id: 'sofas', label: 'Sofas', icon: 'Sofa' },
  { id: 'curtains', label: 'Curtains', icon: 'Blinds' },
  { id: 'blinds', label: 'Blinds', icon: 'PanelTopOpen' },
  { id: 'cushions', label: 'Cushions', icon: 'Square' },
];

export const END_USE_MAP = Object.fromEntries(END_USES.map((e) => [e.id, e]));

export function getEndUseLabel(id) {
  return END_USE_MAP[id]?.label || id || '';
}
