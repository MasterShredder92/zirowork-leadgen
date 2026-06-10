// Session.jsx — ZiroWork Operator CRM
// Phase 1: no auth. Goes straight to the app.

function Root() {
  window.currentUser = { full_name: 'Zach Adkins', role: 'operator', email: 'slavior1992@gmail.com' };
  window.currentOperator = { name: 'ZiroWork', label: 'Operator CRM' };

  if (!window.App) {
    return React.createElement('div', { style: { color: 'red', padding: 24 } }, 'App shell not loaded.');
  }
  return React.createElement(window.App);
}

window.Root = Root;
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Root));
