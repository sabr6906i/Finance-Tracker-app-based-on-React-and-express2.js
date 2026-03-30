// Icons.jsx — Inline SVG icons replacing all emojis
// Each icon is a pure SVG component with consistent sizing

const s = { width: "1em", height: "1em", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", verticalAlign: "-0.125em" };

// Category icons
export function SalaryIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="0" />
      <path d="M2 10h20" />
      <path d="M6 16h4" />
    </svg>
  );
}

export function FreelanceIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  );
}

export function FoodIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <path d="M18 8h1a4 4 0 010 8h-1" />
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

export function TransportIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <path d="M5 17H3a1 1 0 01-1-1V6a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="14.5" cy="17.5" r="2.5" />
      <path d="M18 5h2.3a1 1 0 01.8.4l2.7 3.6a1 1 0 01.2.6V16a1 1 0 01-1 1h-1" />
    </svg>
  );
}

export function EducationIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="13" y2="11" />
    </svg>
  );
}

export function EntertainmentIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <rect x="2" y="6" width="20" height="12" rx="0" />
      <polygon points="10 9 10 15 15 12 10 9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function UtilitiesIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function HealthcareIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
      <line x1="12" y1="10" x2="12" y2="16" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  );
}

export function ShoppingIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

export function OtherIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

// UI icons
export function WalletIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" style={{ ...s, width: "1.2em", height: "1.2em" }} {...props}>
      <rect x="1" y="4" width="22" height="16" rx="0" />
      <path d="M1 10h22" />
      <circle cx="18" cy="15" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function EditIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function ListIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function PieChartIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <path d="M21.21 15.89A10 10 0 118 2.83" />
      <path d="M22 12A10 10 0 0012 2v10z" />
    </svg>
  );
}

export function BarChartIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

export function AlertIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function ArrowUpIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

export function ArrowDownIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

export function CoinIcon(props) {
  return (
    <svg {...s} viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12h6" />
      <path d="M14 9H9.5a2.5 2.5 0 000 5H14" />
      <line x1="12" y1="6" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="18" />
    </svg>
  );
}

// Category icon map (replaces emoji CATEGORY_ICONS)
export const CATEGORY_ICON_MAP = {
  Salary:        SalaryIcon,
  Freelance:     FreelanceIcon,
  Food:          FoodIcon,
  Transport:     TransportIcon,
  Education:     EducationIcon,
  Entertainment: EntertainmentIcon,
  Utilities:     UtilitiesIcon,
  Healthcare:    HealthcareIcon,
  Shopping:      ShoppingIcon,
  Other:         OtherIcon,
};
