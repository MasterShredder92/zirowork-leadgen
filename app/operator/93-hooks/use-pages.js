window.usePages = function usePages() {
  const [state, setState] = React.useState({ data: [], loading: true, error: null });
  const INST = { piano: 'Piano', guitar: 'Guitar', vocals: 'Voice', drums: 'Drums' };

  const load = React.useCallback(async () => {
    if (!window.sb) { setState(s => ({ ...s, loading: false })); return; }
    const { data, error } = await window.sb
      .from('client_pages')
      .select('*')
      .order('created_at', { ascending: false });
    setState({
      loading: false,
      error,
      data: (data || []).map(r => ({
        id: r.id,
        client_name: r.school_name || '—',
        program: INST[r.instrument] || r.instrument,
        type: 'Landing Page',
        status: r.status || 'live',
        slug: `${r.slug}/${r.instrument}`,
        last_updated: r.updated_at
          ? new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—',
      })),
    });
  }, []);

  React.useEffect(() => { load(); }, []);
  return { ...state, refetch: load };
};
