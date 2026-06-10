/**
 * useStudents — Fetch, insert, update students
 *
 * Assumptions:
 *   - window.sb (Supabase client) is initialized globally
 *   - window.currentStudio?.id provides studio_id for filtering
 *   - React.useState, React.useEffect available as window.useState, window.useEffect
 */

function useStudents(familyId = null) {
  const [students, setStudents] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Fetch students, optionally filtered by family_id
  const fetch = React.useCallback(async (fId = familyId) => {
    setLoading(true);
    setError(null);
    try {
      const studioId = window.currentStudio?.id;
      if (!studioId) {
        setError('No studio selected');
        setLoading(false);
        return;
      }

      let query = window.sb
        .from('students')
        .select('*')
        .eq('studio_id', studioId);

      // Filter by family if provided
      if (fId) {
        query = query.eq('family_id', fId);
      }

      const { data, error: err } = await query.order('first_name', { ascending: true });

      if (err) throw err;
      setStudents(data || []);
    } catch (err) {
      console.error('useStudents fetch error:', err);
      setError(err?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  // Fetch students for a specific family
  const fetchByFamily = React.useCallback(async (fId) => {
    setLoading(true);
    setError(null);
    try {
      const studioId = window.currentStudio?.id;
      if (!studioId) throw new Error('No studio selected');
      if (!fId) throw new Error('Family ID required');

      const { data, error: err } = await window.sb
        .from('students')
        .select('*')
        .eq('studio_id', studioId)
        .eq('family_id', fId)
        .order('first_name', { ascending: true });

      if (err) throw err;
      setStudents(data || []);
      return data;
    } catch (err) {
      console.error('useStudents fetchByFamily error:', err);
      setError(err?.message || 'Failed to fetch students for family');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Insert a new student
  const insert = React.useCallback(async (payload) => {
    setError(null);
    try {
      const studioId = window.currentStudio?.id;
      if (!studioId) throw new Error('No studio selected');

      const { data, error: err } = await window.sb
        .from('students')
        .insert({ studio_id: studioId, ...payload })
        .select()
        .single();

      if (err) throw err;
      setStudents(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('useStudents insert error:', err);
      setError(err?.message || 'Failed to create student');
      throw err;
    }
  }, []);

  // Update a student
  const update = React.useCallback(async (studentId, updates) => {
    setError(null);
    try {
      const { data, error: err } = await window.sb
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .select()
        .single();

      if (err) throw err;
      setStudents(prev => prev.map(s => s.id === studentId ? data : s));
      return data;
    } catch (err) {
      console.error('useStudents update error:', err);
      setError(err?.message || 'Failed to update student');
      throw err;
    }
  }, []);

  // Delete a student (hard delete from database)
  const remove = React.useCallback(async (studentId) => {
    setError(null);
    try {
      const { error: err } = await window.sb
        .from('students')
        .delete()
        .eq('id', studentId);

      if (err) throw err;
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      console.error('useStudents remove error:', err);
      setError(err?.message || 'Failed to delete student');
      throw err;
    }
  }, []);

  // Auto-fetch when familyId changes (if provided on hook instantiation)
  React.useEffect(() => {
    if (familyId) {
      fetch();
    }
  }, [familyId, fetch]);

  return {
    students,
    fetch,
    fetchByFamily,
    insert,
    update,
    remove,
    loading,
    error,
  };
}

window.useStudents = useStudents;
