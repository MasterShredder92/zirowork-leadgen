// Generic Supabase table hook — for one-off queries outside the named hooks.
// Named hooks (useClients, useLeads, etc.) live in use-local-data.js.

function useSupabaseTable(table, filters) {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const filterKey = filters ? JSON.stringify(filters) : '';
  React.useEffect(() => {
    if (!window.sb) { setLoading(false); return; }
    let q = window.sb.from(table).select('*').order('created_at', { ascending: false });
    if (filters) Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    q.then(({ data: rows, error: err }) => {
      setData(rows || []);
      setError(err);
      setLoading(false);
    });
  }, [table, filterKey]);
  return { data, loading, error };
}

window.useSupabaseTable = useSupabaseTable;
