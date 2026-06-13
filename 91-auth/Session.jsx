// Session.jsx — ZiroWork Operator CRM auth gate.
// Real Supabase Auth: an operator must sign in, and the session must carry
// app_metadata.role === 'operator'. Only then do we seed the globals the views read
// and render the app. No bypass — privileged actions (billing) depend on this.

function Root() {
  const { useState, useEffect } = React;
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    window.sb.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user && session.user.app_metadata && session.user.app_metadata.role === 'operator') {
        setUser(session.user);
      }
      setChecking(false);
    });
  }, []);

  if (!window.App) {
    return React.createElement('div', { style: { color: 'red', padding: 24 } }, 'App shell not loaded.');
  }
  if (!window.OperatorLogin) {
    return React.createElement('div', { style: { color: 'red', padding: 24 } }, 'Login not loaded.');
  }

  if (checking) {
    return React.createElement('div',
      { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 14 } },
      'Loading…');
  }

  if (!user) {
    return React.createElement(window.OperatorLogin, { onLogin: setUser });
  }

  // Seed the globals the views read, from the real session.
  window.currentUser = {
    full_name: (user.user_metadata && user.user_metadata.full_name) || 'Zach Adkins',
    role: 'operator',
    email: user.email,
  };
  window.currentOperator = { name: 'ZiroWork', label: 'Operator CRM' };
  return React.createElement(window.App);
}

window.Root = Root;
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Root));
