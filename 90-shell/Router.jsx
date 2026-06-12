// Router.jsx — ZiroWork Operator CRM
// Routes remapped to operator pages. Old school-CRM routes removed.
const TWEAK_DEFAULTS = { accent: '#FD802E', density: 'comfortable' };

function App() {
  const { useState, useEffect, useRef } = React;
  const [navHistory, setNavHistory] = useState(['command-center']);
  const [navDirection, setNavDirection] = useState('forward');
  const view = navHistory[navHistory.length - 1];
  const [tweaks, setTweak] = (window.useTweaks || (() => [TWEAK_DEFAULTS, () => {}]))(TWEAK_DEFAULTS);
  const [, forceUpdate] = useState(0);
  const isMobile = window.useIsMobile ? window.useIsMobile() : false;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contentTouchRef = useRef(null);

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener('zw-theme-changed', handler);
    return () => window.removeEventListener('zw-theme-changed', handler);
  }, []);

  const nav = v => {
    setNavDirection('forward');
    setNavHistory(prev => {
      if (prev[prev.length - 1] === v) return prev;
      return [...prev, v];
    });
  };

  const goBack = () => {
    setNavDirection('back');
    setNavHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };

  const handleContentTouchStart = e => {
    if (!isMobile || mobileNavOpen) return;
    const t = e.touches[0];
    if (t.clientX < 40) contentTouchRef.current = { x: t.clientX, y: t.clientY };
  };
  const handleContentTouchEnd = e => {
    if (!contentTouchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - contentTouchRef.current.x;
    const dy = Math.abs(t.clientY - contentTouchRef.current.y);
    if (dx > 60 && dy < 50 && navHistory.length > 1) goBack();
    contentTouchRef.current = null;
  };

  const MOBILE_TITLES = {
    'command-center':   'Command Center',
    'clients':          'Clients',
    'onboarding':       'Onboarding',
    'campaigns':        'Campaigns',
    'pages':            'Pages',
    'leads':            'Leads',
    'conversations':    'Conversations',
    'escalations':      'Escalations',
    'bookings':         'Bookings',
    'enrollments':      'Enrollments',
    'reporting':        'Reporting',
    'automation-rules': 'Automation Rules',
    'integrations':     'Integrations',
    'settings':         'Settings',
    'insights':         'Insights',
    'studio-map':       'Studio Map',
  };

  const renderMain = () => {
    switch (view) {
      case 'command-center':   return window.CommandCenterView   ? React.createElement(window.CommandCenterView,   { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Command Center' });
      case 'clients':          return window.ClientsView          ? React.createElement(window.ClientsView,          { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Clients' });
      case 'onboarding':       return window.ClientOnboardingView ? React.createElement(window.ClientOnboardingView, { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Onboarding' });
      case 'campaigns':        return window.CampaignsView        ? React.createElement(window.CampaignsView,        { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Campaigns' });
      case 'pages':            return window.PagesView            ? React.createElement(window.PagesView,            { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Pages' });
      case 'leads':            return window.LeadsView            ? React.createElement(window.LeadsView,            { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Leads' });
      case 'conversations':    return window.ConversationsView    ? React.createElement(window.ConversationsView,    { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Conversations' });
      case 'escalations':      return window.EscalationsView      ? React.createElement(window.EscalationsView,      { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Escalations' });
      case 'bookings':         return window.BookingsView         ? React.createElement(window.BookingsView,         { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Bookings' });
      case 'enrollments':      return window.EnrollmentsView      ? React.createElement(window.EnrollmentsView,      { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Enrollments' });
      case 'reporting':        return window.ReportingView        ? React.createElement(window.ReportingView,        { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Reporting' });
      case 'automation-rules': return window.AutomationRulesView  ? React.createElement(window.AutomationRulesView,  { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Automation Rules' });
      case 'integrations':     return window.IntegrationsView     ? React.createElement(window.IntegrationsView,     { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Integrations' });
      case 'settings':         return window.SettingsView         ? React.createElement(window.SettingsView,         { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Settings' });
      case 'insights':         return window.InsightsView         ? React.createElement(window.InsightsView,         { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Insights' });
      case 'studio-map':       return window.StudioMapView        ? React.createElement(window.StudioMapView,        { onNavigate: nav }) : React.createElement(window.ComingSoon, { label: 'Studio Map' });
      default:                 return React.createElement(window.ComingSoon, { label: view });
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>
      {window.Sidebar ? React.createElement(window.Sidebar, { currentView: view, onNavigate: nav, mobileOpen: mobileNavOpen, onMobileClose: () => setMobileNavOpen(false) }) : null}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}
        onTouchStart={isMobile ? handleContentTouchStart : undefined}
        onTouchEnd={isMobile ? handleContentTouchEnd : undefined}>

        {!isMobile && (
          <div style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {(window.currentOperator && window.currentOperator.name) || 'ZiroWork'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {window.UserMenu ? React.createElement(window.UserMenu) : null}
            </div>
          </div>
        )}

        {isMobile && window.MobileHeader && React.createElement(window.MobileHeader, {
          onMenuOpen: () => setMobileNavOpen(true),
          onBack: goBack,
          canGoBack: navHistory.length > 1,
          pageTitle: MOBILE_TITLES[view] || (view.charAt(0).toUpperCase() + view.slice(1).replace(/-/g, ' ')),
        })}

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div key={view} style={{
            height: '100%',
            animation: isMobile
              ? `${navDirection === 'back' ? 'zwPageBack' : 'zwPageIn'} 0.22s cubic-bezier(0.2,0,0,1) both`
              : 'none',
          }}>
            {renderMain()}
          </div>
        </div>
      </div>

      {window.TweaksPanel && React.createElement(window.TweaksPanel, null,
        window.TweakSection && React.createElement(window.TweakSection, { label: 'Accent' }),
        window.TweakColor && React.createElement(window.TweakColor, {
          label: 'Color', value: tweaks.accent,
          options: ['#FD802E', '#4338CA', '#065F46', '#1D4ED8', '#92400E'],
          onChange: v => setTweak('accent', v),
        })
      )}
    </div>
  );
}

window.App = App;
