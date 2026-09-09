import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Save, Trash2, PlusCircle, UploadCloud, FileText, X } from 'lucide-react';

export default function CourseEditorPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [competencies, setCompetencies] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [editingModule, setEditingModule] = useState(null);
  const [lessonDrafts, setLessonDrafts] = useState({});
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    instructions: '',
    deadline: '',
    max_score: 100
  });
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [submissionReview, setSubmissionReview] = useState({});
  const [gradeDrafts, setGradeDrafts] = useState({});

  useEffect(() => {
    fetchCourse();
    fetchCompetencies();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const [courseRes, uploadsRes] = await Promise.all([
        api.getCourseById(id),
        api.getCourseUploads(id)
      ]);

      if (courseRes.success) {
        setCourse(courseRes.course);
      }

      if (uploadsRes.success) {
        setUploads(uploadsRes.files || []);
      }

      await fetchAssignments();
    } catch (err) {
      toast.error('Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await api.getAssignments(`course_id=${id}`);
      if (res.success) {
        setAssignments(res.assignments || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompetencies = async () => {
    try {
      const res = await api.getCompetencies();
      if (res.success) {
        setCompetencies(res.competencies || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const form = course || {
    title: '',
    short_description: '',
    description: '',
    category: 'Materials Characterization',
    difficulty: 'intermediate',
    duration_hours: 4,
    status: 'published',
    is_free: 1,
    competencies: []
  };

  const handleFormChange = (field, value) => {
    setCourse(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        short_description: form.short_description || '',
        description: form.description || '',
        category: form.category,
        difficulty: form.difficulty,
        duration_hours: Number(form.duration_hours) || 0,
        max_students: Number(form.max_students) || 100,
        status: form.status,
        is_free: Number(form.is_free),
        competencies: form.competencies?.map(c => c.id || c.competency_id || c) || []
      };

      const res = await api.updateCourse(id, payload);
      if (res.success) {
        toast.success('Course updated successfully.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this course? This action cannot be undone.')) return;

    try {
      const res = await api.deleteCourse(id);
      if (res.success) {
        toast.success('Course deleted.');
        navigate('/trainer');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete course.');
    }
  };

  const handleAddModule = async () => {
    if (!moduleTitle.trim()) {
      toast.error('Module title is required.');
      return;
    }

    try {
      let res;
      if (editingModule) {
        res = await api.updateModule(id, editingModule, { title: moduleTitle.trim(), description: moduleDescription.trim() });
      } else {
        res = await api.addModuleToCourse(id, { title: moduleTitle.trim(), description: moduleDescription.trim() });
      }

      if (res.success) {
        toast.success(editingModule ? 'Module updated successfully.' : 'Module added successfully.');
        setModuleTitle('');
        setModuleDescription('');
        setEditingModule(null);
        fetchCourse();
      }
    } catch (err) {
      toast.error(err.message || (editingModule ? 'Failed to update module.' : 'Failed to add module.'));
    }
  };

  const beginModuleEdit = (module) => {
    setEditingModule(module.id);
    setModuleTitle(module.title || '');
    setModuleDescription(module.description || '');
  };

  const cancelModuleEdit = () => {
    setEditingModule(null);
    setModuleTitle('');
    setModuleDescription('');
  };

  const updateLessonDraft = (moduleId, field, value) => {
    setLessonDrafts(prev => ({
      ...prev,
      [moduleId]: {
        ...(prev[moduleId] || { title: '', duration_minutes: 15 }),
        [field]: value
      }
    }));
  };

  const resetLessonDraft = (moduleId) => {
    setLessonDrafts(prev => ({
      ...prev,
      [moduleId]: { title: '', description: '', content_type: 'reading', content_text: '', duration_minutes: 15 }
    }));
  };

  const beginLessonEdit = (moduleId, lesson) => {
    setEditingLesson({ moduleId, lessonId: lesson.id });
    setLessonDrafts(prev => ({
      ...prev,
      [moduleId]: {
        title: lesson.title || '',
        description: lesson.description || '',
        content_type: lesson.content_type || 'reading',
        content_text: lesson.content_text || '',
        duration_minutes: Number(lesson.duration_minutes ?? lesson.duration_mins ?? 15)
      }
    }));
  };

  const cancelLessonEdit = (moduleId) => {
    setEditingLesson(null);
    resetLessonDraft(moduleId);
  };

  const handleAddLesson = async (moduleId) => {
    const draft = lessonDrafts[moduleId] || {};
    if (!draft.title || !draft.title.trim()) {
      toast.error('Lesson title is required.');
      return;
    }

    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description || '',
        content_type: draft.content_type || 'reading',
        content_text: draft.content_text || '',
        duration_minutes: Number(draft.duration_minutes) || 15
      };

      let res;
      if (editingLesson?.moduleId === moduleId && editingLesson.lessonId) {
        res = await api.updateLesson(editingLesson.lessonId, payload);
      } else {
        res = await api.createLesson({ ...payload, module_id: moduleId });
      }

      if (res.success) {
        toast.success(editingLesson?.moduleId === moduleId ? 'Lesson updated successfully.' : 'Lesson added successfully.');
        setEditingLesson(null);
        resetLessonDraft(moduleId);
        fetchCourse();
      }
    } catch (err) {
      toast.error(err.message || (editingLesson?.moduleId === moduleId ? 'Failed to update lesson.' : 'Failed to add lesson.'));
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error('Choose a file before uploading.');
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('resource_type', 'resource');

      const res = await api.uploadCourseFile(id, formData);
      if (res.success) {
        toast.success('Course file uploaded successfully.');
        setSelectedFile(null);
        fetchCourse();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload file.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAssignmentFormChange = (field, value) => {
    setAssignmentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateAssignment = async () => {
    if (!assignmentForm.title.trim()) {
      toast.error('Assignment title is required.');
      return;
    }

    setAssignmentSubmitting(true);
    try {
      const res = await api.createAssignment({
        course_id: id,
        title: assignmentForm.title.trim(),
        description: assignmentForm.description.trim(),
        instructions: assignmentForm.instructions.trim(),
        deadline: assignmentForm.deadline || null,
        max_score: Number(assignmentForm.max_score) || 100
      });

      if (res.success) {
        toast.success('Assignment created successfully.');
        setAssignmentForm({ title: '', description: '', instructions: '', deadline: '', max_score: 100 });
        fetchAssignments();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create assignment.');
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Delete this assignment?')) return;

    try {
      const res = await api.deleteAssignment(assignmentId);
      if (res.success) {
        toast.success('Assignment deleted.');
        fetchAssignments();
        setSubmissionReview(prev => ({ ...prev, [assignmentId]: [] }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete assignment.');
    }
  };

  const loadSubmissions = async (assignmentId) => {
    try {
      const res = await api.getAssignmentSubmissions(assignmentId);
      if (res.success) {
        setSubmissionReview(prev => ({
          ...prev,
          [assignmentId]: res.submissions || []
        }));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load assignment submissions.');
    }
  };

  const updateGradeDraft = (submissionId, field, value) => {
    setGradeDrafts(prev => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [field]: value
      }
    }));
  };

  const handleGradeSubmission = async (submissionId, assignmentId, submission) => {
    try {
      const draft = gradeDrafts[submissionId] || {};
      const res = await api.gradeSubmission(submissionId, {
        score: Number(draft.score ?? submission.score ?? 0),
        feedback: draft.feedback ?? submission.feedback ?? ''
      });

      if (res.success) {
        toast.success('Submission graded successfully.');
        loadSubmissions(assignmentId);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to grade submission.');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;

    try {
      const res = await api.deleteLesson(lessonId);
      if (res.success) {
        toast.success('Lesson deleted successfully.');
        if (editingLesson?.lessonId === lessonId) {
          setEditingLesson(null);
        }
        fetchCourse();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete lesson.');
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;

    try {
      const res = await api.deleteModule(id, moduleId);
      if (res.success) {
        toast.success('Module deleted successfully.');
        if (editingModule === moduleId) {
          cancelModuleEdit();
        }
        fetchCourse();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete module.');
    }
  };

  const handleReorderModule = async (moduleId, direction) => {
    try {
      const res = await api.reorderModule(id, moduleId, direction);
      if (res.success) {
        toast.success('Module order updated.');
        fetchCourse();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reorder module.');
    }
  };

  const handleDeleteUpload = async (fileId) => {
    try {
      const res = await api.deleteUploadedFile(fileId);
      if (res.success) {
        toast.success('Uploaded file removed.');
        fetchCourse();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove file.');
    }
  };

  if (loading || !course) {
    return <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading course editor...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/trainer" className="btn btn-sm btn-secondary">
          <ArrowLeft size={14} /> Back to Trainer Portal
        </Link>

        <button onClick={handleDelete} className="btn btn-sm btn-danger">
          <Trash2 size={14} /> Delete Course
        </button>
      </div>

      <div className="velora-card gradient-border-top">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Edit Course</h1>

        <div className="form-group">
          <label className="form-label">Course Title</label>
          <input
            className="form-control"
            value={form.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
          />
        </div>

        <div className="grid-cols-2" style={{ gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              className="form-control"
              value={form.category || ''}
              onChange={(e) => handleFormChange('category', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <select
              className="form-control"
              value={form.difficulty || 'intermediate'}
              onChange={(e) => handleFormChange('difficulty', e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid-cols-2" style={{ gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Duration (Hours)</label>
            <input
              type="number"
              className="form-control"
              value={form.duration_hours || 0}
              onChange={(e) => handleFormChange('duration_hours', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={form.status || 'published'}
              onChange={(e) => handleFormChange('status', e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Short Description</label>
          <input
            className="form-control"
            value={form.short_description || ''}
            onChange={(e) => handleFormChange('short_description', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            rows={5}
            className="form-control"
            value={form.description || ''}
            onChange={(e) => handleFormChange('description', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Competencies</label>
          <select
            multiple
            className="form-control"
            value={(form.competencies || []).map(c => String(c.id || c.competency_id || c))}
            onChange={(e) => {
              const selectedValues = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
              const selectedCompetencies = competencies.filter(c => selectedValues.includes(c.id));
              handleFormChange('competencies', selectedCompetencies);
            }}
            style={{ minHeight: '120px' }}
          >
            {competencies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="velora-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Course Modules</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              className="form-control"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder={editingModule ? 'Edit module title' : 'New module title'}
              style={{ flex: '1 1 240px' }}
            />
            <button className="btn btn-primary" onClick={handleAddModule}>
              <PlusCircle size={14} /> {editingModule ? 'Save Module Changes' : 'Add Module'}
            </button>
            {editingModule && (
              <button className="btn btn-sm btn-secondary" onClick={cancelModuleEdit}>
                Cancel Edit
              </button>
            )}
          </div>

          <textarea
            rows={2}
            className="form-control"
            value={moduleDescription}
            onChange={(e) => setModuleDescription(e.target.value)}
            placeholder={editingModule ? 'Update module description' : 'Module description (optional)'}
          />
        </div>

        {course.modules?.length ? course.modules.map((module, index) => {
          const draft = lessonDrafts[module.id] || { title: '', description: '', content_type: 'reading', content_text: '', duration_minutes: 15 };

          return (
            <div key={module.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', backgroundColor: '#0f172a', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '0.75rem' }}>
                <strong style={{ color: 'var(--text-main)' }}>Module {index + 1}: {module.title}</strong>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleReorderModule(module.id, 'up')} disabled={index === 0}>
                    ↑
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleReorderModule(module.id, 'down')} disabled={index === course.modules.length - 1}>
                    ↓
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => beginModuleEdit(module)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteModule(module.id)}>
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{module.description || 'No description provided.'}</div>

              {module.lessons?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {module.lessons.map((lesson) => (
                    <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lesson.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lesson.duration_minutes || lesson.duration_mins} mins • {lesson.content_type || 'reading'}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => beginLessonEdit(module.id, lesson)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteLesson(lesson.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>No lessons added to this module yet.</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid rgba(148,163,184,0.18)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    className="form-control"
                    value={draft.title}
                    onChange={(e) => updateLessonDraft(module.id, 'title', e.target.value)}
                    placeholder="New lesson title"
                    style={{ flex: '1 1 180px' }}
                  />
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={draft.duration_minutes}
                    onChange={(e) => updateLessonDraft(module.id, 'duration_minutes', e.target.value)}
                    placeholder="Duration mins"
                    style={{ width: '130px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <select
                    className="form-control"
                    value={draft.content_type || 'reading'}
                    onChange={(e) => updateLessonDraft(module.id, 'content_type', e.target.value)}
                    style={{ flex: '1 1 180px' }}
                  >
                    <option value="reading">Reading</option>
                    <option value="video">Video</option>
                    <option value="quiz">Quiz</option>
                    <option value="assessment">Assessment</option>
                  </select>
                </div>

                <textarea
                  rows={3}
                  className="form-control"
                  value={draft.description || ''}
                  onChange={(e) => updateLessonDraft(module.id, 'description', e.target.value)}
                  placeholder="Lesson summary or instructor notes"
                />

                <textarea
                  rows={4}
                  className="form-control"
                  value={draft.content_text || ''}
                  onChange={(e) => updateLessonDraft(module.id, 'content_text', e.target.value)}
                  placeholder="Lesson body / content text"
                />

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={() => handleAddLesson(module.id)}>
                    <PlusCircle size={14} /> {editingLesson?.moduleId === module.id ? 'Save Lesson Changes' : 'Add Lesson'}
                  </button>

                  {editingLesson?.moduleId === module.id && (
                    <button className="btn btn-sm btn-secondary" onClick={() => cancelLessonEdit(module.id)}>
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No modules added yet.</div>
        )}
      </div>

      <div className="velora-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Assignments</h3>

        <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Assignment Title</label>
            <input
              className="form-control"
              value={assignmentForm.title}
              onChange={(e) => handleAssignmentFormChange('title', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max Score</label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={assignmentForm.max_score}
              onChange={(e) => handleAssignmentFormChange('max_score', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            rows={3}
            className="form-control"
            value={assignmentForm.description}
            onChange={(e) => handleAssignmentFormChange('description', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Instructions</label>
          <textarea
            rows={4}
            className="form-control"
            value={assignmentForm.instructions}
            onChange={(e) => handleAssignmentFormChange('instructions', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Deadline</label>
          <input
            type="datetime-local"
            className="form-control"
            value={assignmentForm.deadline}
            onChange={(e) => handleAssignmentFormChange('deadline', e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={handleCreateAssignment} disabled={assignmentSubmitting}>
          {assignmentSubmitting ? 'Creating...' : 'Create Assignment'}
        </button>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {assignments.length ? assignments.map((assignment) => (
            <div key={assignment.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', backgroundColor: '#0f172a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>{assignment.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {assignment.max_score || 100} points • {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'No deadline'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => loadSubmissions(assignment.id)}>
                    Review Submissions
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteAssignment(assignment.id)}>
                    Delete
                  </button>
                </div>
              </div>

              <div style={{ color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                {assignment.description || 'No description provided.'}
              </div>

              {assignment.instructions ? (
                <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-main)' }}>Instructions:</strong> {assignment.instructions}
                </div>
              ) : null}

              {submissionReview[assignment.id]?.length ? (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {submissionReview[assignment.id].map((submission) => (
                    <div key={submission.id} style={{ border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', padding: '0.75rem', backgroundColor: 'rgba(59,130,246,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{submission.user_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {submission.status} • {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Submitted'}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {submission.score !== null && submission.score !== undefined ? `${submission.score}/${assignment.max_score || 100}` : 'Not graded yet'}
                        </div>
                      </div>

                      <div style={{ marginTop: '0.75rem', color: 'var(--text-main)' }}>
                        <strong>Submission:</strong>
                        <div style={{ marginTop: '0.35rem', whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                          {submission.submission_text || 'No text submission provided.'}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem' }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>Score</label>
                        <input
                          type="number"
                          min="0"
                          max={assignment.max_score || 100}
                          className="form-control"
                          value={gradeDrafts[submission.id]?.score ?? submission.score ?? ''}
                          onChange={(e) => updateGradeDraft(submission.id, 'score', e.target.value)}
                        />

                        <label className="form-label" style={{ marginBottom: 0 }}>Feedback</label>
                        <textarea
                          rows={3}
                          className="form-control"
                          value={gradeDrafts[submission.id]?.feedback ?? submission.feedback ?? ''}
                          onChange={(e) => updateGradeDraft(submission.id, 'feedback', e.target.value)}
                        />
                      </div>

                      <button
                        className="btn btn-primary"
                        style={{ marginTop: '0.75rem' }}
                        onClick={() => handleGradeSubmission(submission.id, assignment.id, submission)}
                      >
                        Save Grade
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No submissions have been received yet.
                </div>
              )}
            </div>
          )) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No assignments created for this course yet.</div>
          )}
        </div>
      </div>

      <div className="velora-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadCloud size={18} color="var(--primary)" /> Uploaded Course Resources
        </h3>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input
            type="file"
            className="form-control"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            style={{ flex: '1 1 260px' }}
          />

          <button className="btn btn-primary" onClick={handleUploadFile} disabled={!selectedFile || uploadingFile}>
            <UploadCloud size={14} /> {uploadingFile ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {uploads.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {uploads.map((file) => (
              <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem 1rem', backgroundColor: '#0f172a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <FileText size={18} color="var(--primary)" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.original_name || file.file_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {file.resource_type || 'resource'} • {(file.size_bytes / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {file.file_url ? (
                    <a href={`http://localhost:5000${file.file_url}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                      View
                    </a>
                  ) : null}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUpload(file.id)}>
                    <X size={14} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No course files uploaded yet.</div>
        )}
      </div>
    </div>
  );
}
