import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/UIComponents';
import {
  BookOpen, Search, Filter, Clock, User, Star, ArrowRight, RefreshCw, Bookmark
} from 'lucide-react';

export default function CoursesPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedLevel, setSelectedLevel] = useState('ALL');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.getCourses();
      if (res.success) {
        setCourses(res.courses || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load courses catalog');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.competency_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'ALL' || c.level?.toUpperCase() === selectedLevel.toUpperCase();
    return matchesSearch && matchesLevel;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* HEADER */}
      <div className="velora-card gradient-border-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>
            MoES Micro-Learning Repository
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            Capacity Course Catalog
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Specialized modules curated by senior IMD meteorologists and oceanographers.
          </p>
        </div>

        {/* SEARCH & LEVEL FILTER */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <select
            className="form-control"
            style={{ width: '140px' }}
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="ALL">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      {/* COURSE CARDS GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw className="pulse-glow" size={28} style={{ margin: '0 auto 0.5rem' }} />
          <p>Loading Course Catalog...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="velora-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No courses match your filter criteria.</p>
        </div>
      ) : (
        <div className="grid-cols-3">
          {filteredCourses.map(course => (
            <div key={course.id} className="velora-card velora-card-interactive" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <Badge variant={course.level === 'advanced' ? 'danger' : course.level === 'intermediate' ? 'primary' : 'success'}>
                    {course.level || 'Intermediate'}
                  </Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                    {course.category}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                  {course.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {course.description ? (course.description.length > 110 ? course.description.substring(0, 110) + '...' : course.description) : ''}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.75rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {course.duration_hours} Hours</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={14} /> {course.trainer_name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24' }}><Star size={14} fill="#fbbf24" /> {course.rating || 4.8}</span>
                </div>

                <Link to={`/courses/${course.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  View Syllabus & Enroll <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
