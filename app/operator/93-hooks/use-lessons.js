/**
 * useLessons — Fetch, create, update, cancel lessons
 *
 * Assumptions:
 *   - window.sb (Supabase client) is initialized globally
 *   - window.currentStudio?.id provides studio_id for filtering
 *   - React.useState, React.useEffect available as window.useState, window.useEffect
 *
 * Lesson object structure:
 *   { id, student_id, teacher_id, instrument, day, time, level, blocks_per_week, status, created_at, updated_at, ... }
 */

function useLessons() {
  const [lessons, setLessons] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Transform day string (e.g. 'Monday') to number (1-5) for calendar
  const dayToNum = (dayStr) => {
    const days = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5 };
    return days[dayStr] || 1;
  };

  // Transform time string (e.g. '4:00 PM') to decimal hour (16.0)
  const timeToHour = (timeStr) => {
    if (!timeStr) return 14; // default
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours + (minutes / 60);
  };

  // Fetch all lessons for the studio (for calendar view)
  const fetch = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const studioId = window.currentStudio?.id;
      if (!studioId) {
        setError('No studio selected');
        setLoading(false);
        return;
      }

      // Fetch lessons with teacher details for calendar display
      const { data, error: err } = await window.sb
        .from('lessons')
        .select('*, teacher:teacher_id(name), student:student_id(first_name, last_name)')
        .eq('studio_id', studioId)
        .order('day', { ascending: true })
        .order('time', { ascending: true });

      if (err) throw err;
      setLessons(data || []);
    } catch (err) {
      console.error('useLessons fetch error:', err);
      setError(err?.message || 'Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch lessons for a specific student
  const fetchByStudent = React.useCallback(async (studentId) => {
    setLoading(true);
    setError(null);
    try {
      if (!studentId) throw new Error('Student ID required');

      const { data, error: err } = await window.sb
        .from('lessons')
        .select('*, teacher:teacher_id(name), student:student_id(first_name, last_name)')
        .eq('student_id', studentId)
        .order('day', { ascending: true })
        .order('time', { ascending: true });

      if (err) throw err;
      setLessons(data || []);
      return data;
    } catch (err) {
      console.error('useLessons fetchByStudent error:', err);
      setError(err?.message || 'Failed to fetch lessons for student');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new lesson
  const insert = React.useCallback(async (payload) => {
    setError(null);
    try {
      const studioId = window.currentStudio?.id;
      if (!studioId) throw new Error('No studio selected');

      const { data, error: err } = await window.sb
        .from('lessons')
        .insert({ studio_id: studioId, status: 'scheduled', ...payload })
        .select()
        .single();

      if (err) throw err;
      setLessons(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('useLessons insert error:', err);
      setError(err?.message || 'Failed to create lesson');
      throw err;
    }
  }, []);

  // Update a lesson (reschedule, change time, etc.)
  const update = React.useCallback(async (lessonId, updates) => {
    setError(null);
    try {
      const { data, error: err } = await window.sb
        .from('lessons')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', lessonId)
        .select()
        .single();

      if (err) throw err;
      setLessons(prev => prev.map(l => l.id === lessonId ? data : l));
      return data;
    } catch (err) {
      console.error('useLessons update error:', err);
      setError(err?.message || 'Failed to update lesson');
      throw err;
    }
  }, []);

  // Mark lesson as completed
  const complete = React.useCallback(async (lessonId) => {
    return update(lessonId, { status: 'completed' });
  }, [update]);

  // Cancel a lesson
  const cancel = React.useCallback(async (lessonId) => {
    return update(lessonId, { status: 'cancelled' });
  }, [update]);

  // Delete a lesson
  const remove = React.useCallback(async (lessonId) => {
    setError(null);
    try {
      const { error: err } = await window.sb
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (err) throw err;
      setLessons(prev => prev.filter(l => l.id !== lessonId));
    } catch (err) {
      console.error('useLessons delete error:', err);
      setError(err?.message || 'Failed to delete lesson');
      throw err;
    }
  }, []);

  // Transform lesson to calendar event format
  const toCalendarEvent = (lesson, teacherColor = 'victoria') => ({
    id: lesson.id,
    title: `${lesson.student?.first_name || ''} ${lesson.student?.last_name || ''}`.trim() || 'Lesson',
    room: lesson.instrument || 'Studio',
    day: dayToNum(lesson.day),
    startHour: timeToHour(lesson.time),
    duration: 1, // 1 hour default; could be updated from duration_minutes field if it exists
    teacherColor,
    status: lesson.status || 'scheduled',
    studentId: lesson.student_id,
    teacherId: lesson.teacher_id,
  });

  // Auto-fetch on mount
  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    lessons,
    fetch,
    fetchByStudent,
    insert,
    update,
    complete,
    cancel,
    remove,
    toCalendarEvent,
    loading,
    error,
  };
}

window.useLessons = useLessons;
