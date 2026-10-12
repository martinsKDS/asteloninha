// Ícones SVG de traço fino (estilo Feather/Lucide), sem dependências externas.
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const IconHome = (p) => (
  <svg {...base} {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    <path d="M10 21v-6h4v6" />
  </svg>
)

export const IconMeals = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
    <path d="M9 9h6" />
    <path d="M9 13h6" />
  </svg>
)

export const IconRanking = (p) => (
  <svg {...base} {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 6H5.5a1.5 1.5 0 0 0-1.5 1.5C4 9.5 5.5 11 8 11" />
    <path d="M16 6h2.5A1.5 1.5 0 0 1 20 7.5C20 9.5 18.5 11 16 11" />
    <path d="M12 13v4" />
    <path d="M9 20h6" />
    <path d="M10 17h4" />
  </svg>
)

export const IconProgress = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20V5" />
    <path d="M4 20h16" />
    <path d="m7 15 4-4 3 2.5 5-6" />
    <path d="M15.5 7.5H19V11" />
  </svg>
)

export const IconUsers = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    <path d="M17.5 14.2A5.5 5.5 0 0 1 20.5 19" />
  </svg>
)

export const IconUser = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
)

export const IconLogout = (p) => (
  <svg {...base} {...p}>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="M16 8l4 4-4 4" />
    <path d="M20 12H9" />
  </svg>
)

export const IconSearch = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
)

export const IconBell = (p) => (
  <svg {...base} {...p}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
    <path d="M10 21h4" />
  </svg>
)

export const IconCalendar = (p) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17" />
    <path d="M8 3v4M16 3v4" />
  </svg>
)

export const IconChevronDown = (p) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const IconArrowDown = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4v14" />
    <path d="m6 13 6 6 6-6" />
  </svg>
)

export const IconArrowUp = (p) => (
  <svg {...base} {...p}>
    <path d="M12 20V6" />
    <path d="m6 11 6-6 6 6" />
  </svg>
)

export const IconTrendDown = (p) => (
  <svg {...base} {...p}>
    <path d="M3 7l6.5 6.5 4-4L21 17" />
    <path d="M15 17h6v-6" />
  </svg>
)

export const IconTrendUp = (p) => (
  <svg {...base} {...p}>
    <path d="M3 17l6.5-6.5 4 4L21 7" />
    <path d="M15 7h6v6" />
  </svg>
)

export const IconFlag = (p) => (
  <svg {...base} {...p}>
    <path d="M5 21V4" />
    <path d="M5 4h12l-2 4 2 4H5" />
  </svg>
)

// Logo próprio (silhueta de felino estilizada em traço), apenas ilustrativa.
export const LogoMark = (p) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
    <path d="M8 40c2-14 12-24 26-24 8 0 14 3 18 8-4-1-8 0-10 2 6 2 9 7 8 13-2 9-10 15-22 15-10 0-18-5-20-14Z" />
    <path d="M20 20 17 10l9 5" />
    <path d="M34 16l6-7 1 9" />
    <circle cx="36" cy="30" r="1.6" fill="#fff" stroke="none" />
    <path d="M46 36c-4 0-6 2-8 4" />
  </svg>
)
