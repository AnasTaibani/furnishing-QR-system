// Wash care constants. Icons rendered as inline SVG in components/washcare-icons.jsx.
export const WASH_CARE_OPTIONS = [
  { id: 'wash_40', label: 'Wash 40°', printableLabel: 'WASH 40°' },
  { id: 'no_bleach', label: "Don't bleach", printableLabel: 'NO BLEACH' },
  { id: 'no_tumble', label: "Don't tumble", printableLabel: 'NO TUMBLE' },
  { id: 'hang_dry', label: 'Hang dry', printableLabel: 'HANG DRY' },
  { id: 'dry_clean', label: 'Can dry clean', printableLabel: 'DRY CLEAN' },
  { id: 'iron_2_dots', label: 'Iron upto 2 dots', printableLabel: 'IRON ••' },
];

export const WASH_CARE_MAP = Object.fromEntries(
  WASH_CARE_OPTIONS.map((w) => [w.id, w])
);

export function getWashCareLabel(id) {
  return WASH_CARE_MAP[id]?.label || id || '';
}
