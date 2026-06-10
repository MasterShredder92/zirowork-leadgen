// icons.jsx — Inline SVG icon components (extended)
function makeIcon(paths, opts = {}) {
  return function Icon({ size = 16, color = 'currentColor', strokeWidth = 1.75, style, className }) {
    return React.createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: size, height: size, viewBox: '0 0 24 24',
      fill: opts.fill ? color : 'none',
      stroke: opts.fill ? 'none' : color,
      strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
      style, className,
    }, ...paths.map((d, i) => React.createElement('path', { key: i, d })));
  };
}

const Icons = {
  Users:          makeIcon(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0','M22 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75']),
  Calendar:       makeIcon(['M8 2v4','M16 2v4','M3 10h18','M21 8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z']),
  Sparkles:       makeIcon(['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z','M20 3v4','M22 5h-4','M4 17v2','M5 18H3']),
  Settings:       makeIcon(['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z','M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z']),
  Music:          makeIcon(['M9 18V5l12-2v13','M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z']),
  Search:         makeIcon(['M21 21l-4.35-4.35','M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z']),
  Bell:           makeIcon(['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9','M10.3 21a1.94 1.94 0 0 0 3.4 0']),
  ChevronRight:   makeIcon(['M9 18l6-6-6-6']),
  ChevronLeft:    makeIcon(['M15 18l-6-6 6-6']),
  ChevronDown:    makeIcon(['M6 9l6 6 6-6']),
  X:              makeIcon(['M18 6 6 18','M6 6l12 12']),
  Send:           makeIcon(['M22 2 11 13','M22 2 15 22 11 13 2 9l20-7z']),
  Music2:         makeIcon(['M9 18V5l12-2v13','M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z']),
  Bookmark:       makeIcon(['M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z']),
  Clock:          makeIcon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M12 6v6l4 2']),
  ArrowUpRight:   makeIcon(['M7 17 17 7','M7 7h10v10']),
  TrendingUp:     makeIcon(['M22 7 13.5 15.5 8.5 10.5 2 17','M16 7h6v6']),
  DollarSign:     makeIcon(['M12 1v22','M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']),
  MoreHorizontal: makeIcon(['M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z','M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z','M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z']),
  // New icons for expanded nav
  Home:           makeIcon(['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z','M9 22V12h6v10']),
  Map:            makeIcon(['M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z','M8 2v16','M16 6v16']),
  UserCheck:      makeIcon(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0','M17 11l2 2 4-4']),
  User:           makeIcon(['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z']),
  UserPlus:       makeIcon(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0','M19 8v6','M22 11h-6']),
  FileText:       makeIcon(['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8']),
  Banknote:       makeIcon(['M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z','M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M6 12h.01','M18 12h.01']),
  BarChart2:      makeIcon(['M18 20V10','M12 20V4','M6 20v-6']),
  GitBranch:      makeIcon(['M6 3v12','M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z','M15 6a9 9 0 0 1-9 9']),
  Target:         makeIcon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z','M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z']),
  Zap:            makeIcon(['M13 2 3 14h9l-1 8 10-12h-9l1-8z']),
  Plus:           makeIcon(['M12 5v14','M5 12h14']),
  ArrowRight:     makeIcon(['M5 12h14','M12 5l7 7-7 7']),
  Circle:         makeIcon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z']),
  CheckCircle2:   makeIcon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M9 12l2 2 4-4']),
  AlertCircle:    makeIcon(['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M12 8v4','M12 16h.01']),
  RefreshCw:      makeIcon(['M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8','M21 3v5h-5','M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16','M3 21v-5h5']),
  Workflow:       makeIcon(['M17 3a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3','M21 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4','M7 7H3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z']),
  Menu:           makeIcon(['M3 12h18','M3 6h18','M3 18h18']),
  // BUG FIX: 5 missing icons referenced in components
  Inbox:          makeIcon(['M22 12h-6l-2 3h-4l-2-3H2','M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z']),
  Camera:         makeIcon(['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z','M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z']),
  Pencil:         makeIcon(['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z','M15 5l4 4']),
  Check:          makeIcon(['M20 6 9 17l-5-5']),
  ArrowLeft:      makeIcon(['M19 12H5','M12 19l-7-7 7-7']),
};

window.LucideReact = Icons;
