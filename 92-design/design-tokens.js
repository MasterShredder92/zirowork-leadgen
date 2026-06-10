// design-tokens.js — Centralized design system tokens
// Mirrors design-system.md decisions. Replaces inline hardcoded values.
// All theme-aware colors use functions to reflect current T.isDark state.

/**
 * USAGE:
 *
 * import { TOKENS } from './design-tokens.js';
 * const T = window.T || {};
 *
 * const inputStyle = {
 *   borderColor: TOKENS.colors.border(T.isDark),
 *   backgroundColor: TOKENS.colors.inputBg(T.isDark),
 *   borderRadius: TOKENS.radius.md,
 *   padding: `${TOKENS.spacing.xs}px ${TOKENS.spacing.sm}px`,
 * };
 *
 * const badgeStyle = {
 *   padding: `${TOKENS.spacing.xs}px ${TOKENS.spacing.sm}px`,
 *   borderRadius: TOKENS.radius.lg,
 *   ...TOKENS.badges.active(T.isDark),
 * };
 */

const TOKENS = {
  // ═══════════════════════════════════════════════════════════════════════
  // COLORS — All variants dark + light, accessed via isDark boolean
  // ═══════════════════════════════════════════════════════════════════════

  colors: {
    // Borders — theme-aware tints
    border: (isDark) =>
      isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    borderMed: (isDark) =>
      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.11)',
    borderFocused: (isDark) =>
      isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',

    // Input field backgrounds
    inputBg: (isDark) =>
      isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBgFocused: (isDark) =>
      isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',

    // Status colors — badge backgrounds + text
    success: {
      light: { bg: '#D1F4E8', text: '#034636' },
      dark: { bg: 'rgba(34,197,94,0.15)', text: '#4ADE80' },
    },
    warning: {
      light: { bg: '#FEE9A6', text: '#78350F' },
      dark: { bg: 'rgba(251,191,36,0.15)', text: '#FCD34D' },
    },
    error: {
      light: { bg: '#FDCCCB', text: '#7F1D1D' },
      dark: { bg: 'rgba(239,68,68,0.15)', text: '#F87171' },
    },
    info: {
      light: { bg: '#BFDBFE', text: '#0C2340' },
      dark: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
    },

    // Billing status badges (used in family detail)
    paid: (isDark) => isDark
      ? { bg: 'rgba(16,185,129,0.15)', text: '#34D399' }
      : { bg: '#D1F4E8', text: '#034636' },
    pending: (isDark) => isDark
      ? { bg: 'rgba(245,158,11,0.15)', text: '#FCD34D' }
      : { bg: '#FEE9A6', text: '#78350F' },
    overdue: (isDark) => isDark
      ? { bg: 'rgba(239,68,68,0.15)', text: '#F87171' }
      : { bg: '#FDCCCB', text: '#7F1D1D' },

    // Accent / brand
    accent: (isDark) => isDark ? '#FD802E' : '#D9641C',

    // Hover / active states
    hover: (isDark) => isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    active: (isDark) => isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SPACING — Hard tokens (px)
  // ═══════════════════════════════════════════════════════════════════════

  spacing: {
    xs: 4,    // micro gaps, tight fields
    sm: 8,    // input padding, small gaps
    md: 12,   // standard padding
    lg: 16,   // section padding
    xl: 20,   // header padding
    xxl: 24,  // page margins
    xxxl: 28, // KPI grid gaps
  },

  // ═══════════════════════════════════════════════════════════════════════
  // RADIUS — Hard tokens (px)
  // ═══════════════════════════════════════════════════════════════════════

  radius: {
    sm: 4,    // tight: small inputs, small buttons
    md: 6,    // standard: inputs, pills
    lg: 8,    // larger: buttons, cards
    xl: 12,   // section borders, major containers
    full: 999, // pills, badges
  },

  // ═══════════════════════════════════════════════════════════════════════
  // TYPOGRAPHY — Font sizes + weights
  // ═══════════════════════════════════════════════════════════════════════

  typography: {
    h1: { fontSize: 24, fontWeight: 700 },      // Page title
    h2: { fontSize: 16, fontWeight: 700 },      // Section title
    h3: { fontSize: 13, fontWeight: 700 },      // Small heading (drawer tabs)
    body: { fontSize: 12, fontWeight: 400 },    // Table cells, general content
    bodyMed: { fontSize: 12, fontWeight: 500 }, // Secondary body
    bodyBold: { fontSize: 12, fontWeight: 600 }, // Emphasized body
    label: { fontSize: 11, fontWeight: 600 },   // Form labels, column headers
    labelUp: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
    meta: { fontSize: 11, fontWeight: 400 },    // Timestamps, metadata
    small: { fontSize: 10, fontWeight: 500 },   // Stat labels, badges
    smallUp: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' },
    stat: { fontSize: 20, fontWeight: 600 },    // KPI numbers
    statLarge: { fontSize: 24, fontWeight: 700 }, // Large stat values
  },

  // ═══════════════════════════════════════════════════════════════════════
  // LAYOUT — Common dimension patterns
  // ═══════════════════════════════════════════════════════════════════════

  layout: {
    headerPadding: '20px 24px',
    contentPadding: '16px 24px',
    tabHeight: 40,
    buttonHeight: 32,
    inputHeight: 32,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // FOCUS STATES — Consistent keyboard focus handling
  // ═══════════════════════════════════════════════════════════════════════

  focus: (isDark) => ({
    outlineColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '2px',
  }),

  // ═══════════════════════════════════════════════════════════════════════
  // COMPONENTS — Reusable composite styles (modal, table, form, card, badge)
  // ═══════════════════════════════════════════════════════════════════════

  components: {
    // MODAL — Overlay + container styles
    modal: {
      overlay: (isDark) => ({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }),
      container: (isDark) => ({
        background: isDark ? '#1a1a1a' : '#fff',
        borderRadius: 12,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: isDark
          ? '0 20px 45px rgba(0,0,0,0.5)'
          : '0 20px 45px rgba(0,0,0,0.12)',
        maxWidth: 520,
        maxHeight: '90vh',
        overflow: 'auto',
        padding: 0,
      }),
      header: (isDark) => ({
        padding: '24px 28px 20px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
      }),
      title: {
        fontSize: 18,
        fontWeight: 700,
        margin: 0,
        letterSpacing: '-0.3px',
      },
      body: {
        padding: '24px 28px',
      },
      footer: (isDark) => ({
        padding: '20px 28px',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end',
      }),
    },

    // TABLE — Row, header, cell styles
    table: {
      wrapper: (isDark) => ({
        flex: 1,
        overflowX: 'auto',
        overflowY: 'auto',
        display: 'block',
        position: 'relative',
      }),
      element: (isDark) => ({
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
      }),
      header: (isDark) => ({
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
      }),
      headerCell: (isDark) => ({
        textAlign: 'left',
        padding: '10px 14px',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)',
        position: 'sticky',
        top: 0,
        background: isDark ? '#1a1a1a' : '#fff',
        whiteSpace: 'nowrap',
      }),
      row: (isDark, isSelected = false) => ({
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        cursor: 'pointer',
        background: isSelected
          ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
          : 'transparent',
        transition: 'background 0.08s',
      }),
      rowHover: (isDark) => ({
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      }),
      cell: (isDark) => ({
        padding: '11px 14px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }),
      stickyCell: (isDark) => ({
        position: 'sticky',
        left: 0,
        zIndex: 2,
        background: isDark ? '#1a1a1a' : '#fff',
        boxShadow: isDark ? '2px 0 8px rgba(0,0,0,0.25)' : '2px 0 8px rgba(0,0,0,0.10)',
      }),
    },

    // FORM — Input, label, button styles
    form: {
      label: (isDark) => ({
        fontSize: 11,
        fontWeight: 600,
        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
        display: 'block',
        marginBottom: 4,
      }),
      input: (isDark) => ({
        padding: '7px 10px',
        borderRadius: 6,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.11)'}`,
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        color: isDark ? '#fff' : '#000',
        fontSize: 12,
        fontFamily: 'inherit',
        width: '100%',
        boxSizing: 'border-box',
      }),
      inputFocused: (isDark) => ({
        borderColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      }),
      button: (isDark, variant = 'primary') => {
        if (variant === 'primary') {
          return {
            padding: '8px 16px',
            background: isDark ? '#3B82F6' : '#1E40AF',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s',
          };
        } else {
          // secondary
          return {
            padding: '8px 16px',
            background: 'transparent',
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.11)'}`,
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          };
        }
      },
    },

    // CARD — Container + border styles
    card: {
      container: (isDark) => ({
        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 8,
        padding: '12px 14px',
        cursor: 'pointer',
        position: 'relative',
        userSelect: 'none',
      }),
      hover: (isDark) => ({
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      }),
      header: (isDark) => ({
        padding: '12px 14px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
      }),
      body: {
        padding: '12px 14px',
      },
    },

    // BADGE — Status/role indicators
    badge: {
      default: (isDark) => ({
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 16,
        fontSize: 10,
        fontWeight: 600,
        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.055)',
        color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      }),
      success: (isDark) => ({
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 16,
        fontSize: 10,
        fontWeight: 600,
        background: isDark ? 'rgba(34,197,94,0.15)' : '#D1F4E8',
        color: isDark ? '#4ADE80' : '#034636',
      }),
      warning: (isDark) => ({
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 16,
        fontSize: 10,
        fontWeight: 600,
        background: isDark ? 'rgba(251,191,36,0.15)' : '#FEE9A6',
        color: isDark ? '#FCD34D' : '#78350F',
      }),
      error: (isDark) => ({
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 16,
        fontSize: 10,
        fontWeight: 600,
        background: isDark ? 'rgba(239,68,68,0.15)' : '#FDCCCB',
        color: isDark ? '#F87171' : '#7F1D1D',
      }),
      info: (isDark) => ({
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 16,
        fontSize: 10,
        fontWeight: 600,
        background: isDark ? 'rgba(59,130,246,0.15)' : '#BFDBFE',
        color: isDark ? '#3B82F6' : '#0C2340',
      }),
      pill: (isDark) => ({
        display: 'inline-block',
        padding: '6px 14px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 500,
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.11)'}`,
      }),
    },

    // ════════════════════════════════════════════════════════════════════════
    // FLOW/CANVAS — Leads, Lifecycle, Dashboard canvas-style patterns
    // ════════════════════════════════════════════════════════════════════════

    flow: {
      // Mini avatar (18x18 circle, used in lead cards, roster lists)
      miniAvatar: {
        width: 18,
        height: 18,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 7,
        fontWeight: 700,
        flexShrink: 0,
        border: '1.5px solid var(--surface)',
        marginLeft: -5,
      },
      // Flow port — connector dot on node (10x10 absolute positioned circle)
      port: (side) => {
        const pos = {
          top: { top: -5, left: '50%', transform: 'translateX(-50%)' },
          bottom: { bottom: -5, left: '50%', transform: 'translateX(-50%)' },
          left: { left: -5, top: '50%', transform: 'translateY(-50%)' },
          right: { right: -5, top: '50%', transform: 'translateY(-50%)' },
        }[side] || {};
        return {
          position: 'absolute',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          zIndex: 2,
          ...pos,
        };
      },
      // Flow node container (absolute positioned, animated card)
      nodeContainer: {
        position: 'absolute',
        userSelect: 'none',
        animation: 'leadsFlowIn 0.22s ease',
        cursor: 'grab',
        zIndex: 10,
      },
      // Flow node expanded card (border + shadow on active)
      nodeCard: (isDark, expanded, stageColor) => ({
        background: 'var(--surface)',
        border: expanded
          ? `1.5px solid ${stageColor}55`
          : `1px solid var(--border)`,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: expanded
          ? `0 0 0 3px ${stageColor}12, 0 6px 20px rgba(0,0,0,0.18)`
          : '0 2px 8px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s var(--zw-ease), border-color 0.15s var(--zw-ease)',
      }),
      // Flow node header (stage label + count + chevron)
      nodeHeader: {
        padding: '12px 14px 10px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      },
      // Flow node expandable list (max-height animation)
      nodeList: {
        maxHeight: 500,
        overflow: 'hidden',
        transition: 'max-height 0.25s var(--zw-ease)',
      },
      // Stage type badge (uppercase, colored bg)
      stageBadge: {
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.07em',
        padding: '2px 8px',
        borderRadius: 20,
        textTransform: 'uppercase',
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // AVATAR — Circular user/person indicators
    // ════════════════════════════════════════════════════════════════════════

    avatar: {
      // Standard avatar (circular, themed background)
      default: (isDark, size = 32) => ({
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        flexShrink: 0,
      }),
      // Large avatar (used in roster headers, 40x40+)
      large: {
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 700,
        flexShrink: 0,
      },
      // Small avatar (used in tables, lists, 24x24)
      small: {
        width: 24,
        height: 24,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        fontWeight: 700,
        flexShrink: 0,
        border: '1px solid rgba(0,0,0,0.1)',
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // FLEX LAYOUTS — Common flexbox patterns
    // ════════════════════════════════════════════════════════════════════════

    flexbox: {
      // Row center (flex, center align, gap)
      rowCenter: (gap = 8) => ({
        display: 'flex',
        alignItems: 'center',
        gap,
      }),
      // Row between (space-between)
      rowBetween: (gap = 8) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap,
      }),
      // Column flex (vertical stack)
      col: (gap = 8) => ({
        display: 'flex',
        flexDirection: 'column',
        gap,
      }),
      // Flex 1 (expand to fill)
      flex1: {
        flex: 1,
      },
      // Min-width 0 (text ellipsis trick for flex children)
      minWidth0: {
        minWidth: 0,
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // TEXT TRUNCATION — Ellipsis + overflow patterns
    // ════════════════════════════════════════════════════════════════════════

    truncate: {
      // Single line ellipsis
      singleLine: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
      // Multi-line ellipsis (requires max-height)
      multiLine: (lines = 2) => ({
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }),
    },

    // ════════════════════════════════════════════════════════════════════════
    // DRAWER/PANEL — Detail drawers, modals, side panels
    // ════════════════════════════════════════════════════════════════════════

    drawer: {
      // Drawer overlay (fixed fullscreen)
      overlay: (isDark) => ({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        zIndex: 90,
      }),
      // Drawer panel container
      panel: (isDark) => ({
        background: isDark ? '#0a0a0a' : '#fff',
        height: '100vh',
        width: 380,
        overflowY: 'auto',
        borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: isDark
          ? '-4px 0 20px rgba(0,0,0,0.4)'
          : '-4px 0 20px rgba(0,0,0,0.08)',
        animation: 'slideInRight 0.25s ease',
      }),
      // Drawer header (sticky, with close button)
      header: (isDark) => ({
        padding: '20px 24px 16px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        position: 'sticky',
        top: 0,
        background: isDark ? '#0a0a0a' : '#fff',
        zIndex: 5,
      }),
      // Drawer title
      title: {
        fontSize: 18,
        fontWeight: 700,
        margin: 0,
      },
      // Drawer content body
      body: {
        padding: '16px 24px',
      },
      // Drawer footer (sticky bottom, buttons)
      footer: (isDark) => ({
        padding: '16px 24px',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        position: 'sticky',
        bottom: 0,
        background: isDark ? '#0a0a0a' : '#fff',
        zIndex: 5,
        display: 'flex',
        gap: 12,
        justifyContent: 'flex-end',
      }),
    },

    // ════════════════════════════════════════════════════════════════════════
    // SECTION — Grouped content blocks with headers
    // ════════════════════════════════════════════════════════════════════════

    section: {
      // Section container (padded, bordered)
      container: (isDark) => ({
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 8,
        padding: '16px 18px',
      }),
      // Section header (title + optional action)
      header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: `1px solid rgba(255,255,255,0.05)`,
      },
      // Section title
      title: {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      },
      // Section body (content inside)
      body: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // STAT/KPI — Financial, enrollment, metric displays
    // ════════════════════════════════════════════════════════════════════════

    stat: {
      // Stat container (column layout)
      container: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      },
      // Stat label (small, uppercase)
      label: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        opacity: 0.6,
      },
      // Stat value (large number)
      value: {
        fontSize: 20,
        fontWeight: 600,
      },
      // Stat unit/subtext (small secondary text)
      unit: {
        fontSize: 11,
        fontWeight: 400,
        opacity: 0.7,
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // LIST/ROW — Table-like row items with hover states
    // ════════════════════════════════════════════════════════════════════════

    listRow: {
      // Row container (padding, border, hover)
      container: (isDark) => ({
        padding: '11px 14px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        cursor: 'pointer',
        transition: 'background 0.08s',
      }),
      // Row hover state
      hover: (isDark) => ({
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      }),
      // Row selected state
      selected: (isDark) => ({
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      }),
      // Cell content (flex item)
      cell: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 0,
      },
    },

    // ════════════════════════════════════════════════════════════════════════
    // TAB — Tab nav patterns
    // ════════════════════════════════════════════════════════════════════════

    tabs: {
      // Tab container (flex row, no-wrap)
      container: {
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderBottom: `1px solid var(--border)`,
        overflowX: 'auto',
      },
      // Individual tab button
      tab: (isDark, isActive = false) => ({
        padding: '10px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: isActive ? '2px solid var(--text)' : '2px solid transparent',
        color: isActive
          ? (isDark ? '#fff' : '#000')
          : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }),
    },

    // ════════════════════════════════════════════════════════════════════════
    // TOOLTIP/POPOVER — Floating labels, hints
    // ════════════════════════════════════════════════════════════════════════

    tooltip: {
      // Tooltip container (small, positioned absolutely/fixed)
      container: (isDark) => ({
        background: isDark ? '#1a1a1a' : '#000',
        color: isDark ? '#fff' : '#fff',
        padding: '6px 10px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 500,
        position: 'absolute',
        zIndex: 1000,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        boxShadow: isDark
          ? '0 4px 12px rgba(0,0,0,0.4)'
          : '0 4px 12px rgba(0,0,0,0.3)',
      }),
    },

    // ════════════════════════════════════════════════════════════════════════
    // DIVIDER — Horizontal/vertical separators
    // ════════════════════════════════════════════════════════════════════════

    divider: {
      // Horizontal divider (full-width line)
      horizontal: (isDark) => ({
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
      }),
      // Vertical divider (thin line)
      vertical: (isDark) => ({
        borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        height: '100%',
      }),
    },
  },
};

window.TOKENS = TOKENS;
