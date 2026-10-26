import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  BarChart3, 
  AlertOctagon, 
  Activity, 
  HelpCircle, 
  LogOut, 
  Search, 
  Bell, 
  Settings, 
  Download, 
  Upload, 
  TrendingUp, 
  UserCheck, 
  ChevronRight, 
  Play,
  FileSpreadsheet
} from 'lucide-react';
import './App.css';

interface Student {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  compatibility: number;
  roomStatus: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users'>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudents = async (authToken = token) => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/students`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      } else {
        setMessage('Failed to fetch students. Ensure you are logged in as Admin.');
        if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
      }
    } catch (err) {
      setMessage('Error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStudents(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage('Please enter email and password.');
      return;
    }

    setLoginLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        if (data.user?.role !== 'ADMIN') {
          setMessage('Access denied. Admin role required.');
          return;
        }
        localStorage.setItem('adminToken', data.token);
        setToken(data.token);
        setMessage('Logged in successfully!');
      } else {
        setMessage(data.message || 'Login failed. Invalid credentials.');
      }
    } catch (err) {
      setMessage('Error connecting to authentication server.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setStudents([]);
    setMessage('Logged out successfully.');
  };

  const runAssignment = async () => {
    try {
      setMessage('Running assignment...');
      const res = await fetch(`${API_URL}/api/admin/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessage(data.message || 'Assignment run completed.');
      fetchStudents(); // Refresh the list
    } catch (err) {
      setMessage('Error running assignment.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setMessage('Uploading students...');
      const res = await fetch(`${API_URL}/api/admin/upload`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessage(data.message || 'Upload completed.');
      fetchStudents(); // Refresh the list
    } catch (err) {
      setMessage('Error uploading file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <video
          className="login-bg-video"
          src="/iut_campus.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="login-bg-overlay" />
        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-logo-container">
            <img
              src="/iut_logo.png"
              alt="IUT Logo"
              style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'contain', background: '#fff', padding: 2 }}
            />
            <h2>IUT RoomSync</h2>
          </div>
          <p>Admin Portal — Islamic University of Technology</p>
          
          {message && <div className="toast-message error">{message}</div>}

          <div className="input-group">
            <label htmlFor="email">Admin Email</label>
            <input 
              id="email"
              type="email" 
              placeholder="admin@iut-dhaka.edu" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="primary-btn login-btn" disabled={loginLoading}>
            {loginLoading ? 'Signing in...' : 'Sign In to IUT Admin'}
          </button>
        </form>
      </div>
    );
  }

  // Dynamic stats from real data
  const totalStudents = students.length;
  const assignedStudents = students.filter(s => s.roomStatus === 'Assigned').length;
  const unassignedStudents = students.filter(s => s.roomStatus === 'Unassigned').length;
  const syncRate = totalStudents > 0 ? Math.round((assignedStudents / totalStudents) * 100) : 0;

  return (
    <div className="admin-app-layout">
      {/* Sidebar with IUT Branding */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon" style={{ background: '#006A4E', borderRadius: 12, overflow: 'hidden', padding: 4 }}>
            <img
              src="/iut_logo.png"
              alt="IUT"
              style={{ width: 32, height: 32, objectFit: 'contain' }}
            />
          </div>
          <div className="brand-text">
            <h2>IUT RoomSync</h2>
            <span>PROVOST ADMIN</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <UsersIcon size={20} />
            <span>User Management</span>
          </button>
          
          <button className="nav-item disabled" onClick={() => AlertOctagon}>
            <BarChart3 size={20} />
            <span>Group Analytics</span>
          </button>
          
          <button className="nav-item disabled">
            <AlertOctagon size={20} />
            <span>Report Handling</span>
          </button>
          
          <button className="nav-item disabled">
            <Activity size={20} />
            <span>System Health</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item support-btn">
            <HelpCircle size={20} />
            <span>Support</span>
          </button>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main-container">
        {/* Top Header Bar */}
        <header className="admin-top-bar">
          <div className="search-box">
            <Search size={18} color="#8E8E93" />
            <input type="text" placeholder="Search analytics or users..." />
          </div>

          <div className="top-bar-right">
            <button className="header-icon-btn">
              <Bell size={20} />
              <div className="badge-dot" />
            </button>
            <button className="header-icon-btn">
              <Settings size={20} />
            </button>
            <div className="user-profile-badge">
              <div className="user-info">
                <span className="user-name">IUT Provost</span>
                <span className="user-role">HOUSING ADMIN</span>
              </div>
              <div className="user-avatar-circle">
                <span>A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-main-content">
          {message && <div className="global-toast">{message}</div>}

          {activeTab === 'dashboard' ? (
            /* TAB 1: System Overview (Image 3) */
            <div className="dashboard-view">
              <div className="view-header">
                <div>
                  <h1 className="view-title">IUT Campus Overview</h1>
                  <p className="view-subtitle">Real-time housing metrics for Islamic University of Technology halls of residence.</p>
                </div>
                <button className="export-btn" onClick={() => alert('Exporting PDF/CSV System Report...')}>
                  <Download size={18} style={{ marginRight: 8 }} />
                  <span>Export Report</span>
                </button>
              </div>

              {/* Stats Card Row */}
              <div className="stats-grid">
                <div className="dashboard-stat-card">
                  <div className="stat-icon-wrapper users-blue">
                    <UsersIcon size={22} color="#006A4E" />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">IUT STUDENTS</span>
                    <h3 className="stat-value">{totalStudents}</h3>
                    <span className="stat-trend trend-up">
                      <TrendingUp size={14} style={{ marginRight: 4 }} />
                      <span>Registered</span>
                    </span>
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="stat-icon-wrapper success-green">
                    <UserCheck size={22} color="#059669" />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">ROOM ASSIGNED</span>
                    <h3 className="stat-value">{assignedStudents}</h3>
                    <span className="stat-trend trend-high">
                      <span>Confirmed</span>
                    </span>
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="stat-icon-wrapper reports-red">
                    <AlertOctagon size={22} color="#DC2626" />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">UNASSIGNED</span>
                    <h3 className="stat-value">{unassignedStudents}</h3>
                    <span className="stat-trend trend-warning">
                      <span>Pending</span>
                    </span>
                  </div>
                </div>

                <div className="dashboard-stat-card">
                  <div className="stat-icon-wrapper groups-purple">
                    <LayoutDashboard size={22} color="#006A4E" />
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">ALLOCATION RATE</span>
                    <h3 className="stat-value">{syncRate}%</h3>
                    <span className="stat-trend trend-high">
                      <span>{syncRate >= 50 ? 'On Track' : 'Low'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Section: Chart + Issues */}
              <div className="dashboard-middle-row">
                {/* User Growth wave line chart */}
                <div className="chart-card">
                  <div className="chart-header">
                    <h3 className="chart-title">Student Registration Trend</h3>
                    <select className="chart-select">
                      <option>Last 30 Days</option>
                      <option>Last 7 Days</option>
                    </select>
                  </div>
                  <div className="chart-body">
                    {/* SVG Curve Line Chart */}
                    <svg viewBox="0 0 500 200" width="100%" height="100%">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#006A4E" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#006A4E" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="0" y1="150" x2="500" y2="150" stroke="#F3F4F6" strokeWidth="1" />
                      <line x1="0" y1="100" x2="500" y2="100" stroke="#F3F4F6" strokeWidth="1" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#F3F4F6" strokeWidth="1" />
                      
                      {/* Gradient Fill */}
                      <path 
                        d="M 0 140 Q 120 130, 240 70 T 480 80 L 500 80 L 500 200 L 0 200 Z" 
                        fill="url(#chartGradient)" 
                      />
                      
                      {/* Smooth Curve */}
                      <path 
                        d="M 0 140 Q 120 130, 240 70 T 480 80" 
                        fill="none" 
                        stroke="#006A4E" 
                        strokeWidth="4" 
                      />
                      
                      {/* Circle points */}
                      <circle cx="120" cy="133" r="5" fill="#006A4E" />
                      <circle cx="240" cy="70" r="5" fill="#006A4E" />
                      <circle cx="360" cy="98" r="5" fill="#006A4E" />
                      
                      {/* Chart Labels */}
                      <text x="10" y="180" fill="#9CA3AF" fontSize="10">WEEK 1</text>
                      <text x="160" y="180" fill="#9CA3AF" fontSize="10">WEEK 2</text>
                      <text x="310" y="180" fill="#9CA3AF" fontSize="10">WEEK 3</text>
                      <text x="440" y="180" fill="#9CA3AF" fontSize="10">WEEK 4</text>
                    </svg>
                  </div>
                </div>

                {/* Top Issues Card */}
                <div className="issues-card">
                  <div className="issues-header">
                    <h3 className="chart-title">⚠️ Top Issues</h3>
                  </div>
                  <div className="issues-list">
                    <div className="issue-item border-red">
                      <div className="issue-details">
                        <h4 className="issue-name">Incompatible sleep schedules</h4>
                        <span className="issue-meta">North Hall • Floor 4 • 3 Reports</span>
                      </div>
                      <ChevronRight size={18} color="#C7C7CC" />
                    </div>

                    <div className="issue-item border-orange">
                      <div className="issue-details">
                        <h4 className="issue-name">Noise complaints</h4>
                        <span className="issue-meta">South Hall • 8 Reports</span>
                      </div>
                      <ChevronRight size={18} color="#C7C7CC" />
                    </div>

                    <div className="issue-item border-blue">
                      <div className="issue-details">
                        <h4 className="issue-name">Cleanliness discrepancies</h4>
                        <span className="issue-meta">Female Hall of Residence • 2 Reports</span>
                      </div>
                      <ChevronRight size={18} color="#C7C7CC" />
                    </div>
                  </div>
                  <button className="view-all-issues" onClick={() => AlertOctagon}>View All Issues</button>
                </div>
              </div>

              {/* Bottom Section: Recent Activity */}
              <div className="recent-activity-card">
                <div className="activity-header-row">
                  <h3 className="chart-title">🔄 Recent Activity</h3>
                  <button className="see-full-log-btn" onClick={() => alert('Opening full activity log...')}>See full log</button>
                </div>
                <div className="activity-list-row">
                  <div className="activity-timeline-item">
                    <div className="activity-avatar image-1" />
                    <div className="activity-info-box">
                      <p className="activity-desc"><strong>New Room Group Formed</strong></p>
                      <span className="activity-sub">"IUT Coders Quad" • South Hall 204</span>
                    </div>
                  </div>

                  <div className="activity-timeline-item">
                    <div className="activity-badge-circle warning">
                      <span>⚠️</span>
                    </div>
                    <div className="activity-info-box">
                      <p className="activity-desc"><strong>Room Reassignment Request</strong></p>
                      <span className="activity-sub">North Hall 105 • Pending review</span>
                    </div>
                  </div>

                  <div className="activity-timeline-item">
                    <div className="activity-avatar image-2" />
                    <div className="activity-info-box">
                      <p className="activity-desc"><strong>Student ID Verified</strong></p>
                      <span className="activity-sub">Limas Soubello (200041101) • CSE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: User Management (Original functions + styled premium) */
            <div className="user-management-view">
              <div className="view-header">
                <div>
                  <h1 className="view-title">IUT Student Management</h1>
                  <p className="view-subtitle">Upload student list CSV, execute hall matching, and manage room allocations.</p>
                </div>
              </div>

              {/* Algorithm Trigger bar */}
              <div className="actions-bar-card">
                <h3>Matching Operations</h3>
                <p>Run the compatibility assignment algorithm to match student groups with residence halls.</p>
                <div className="op-buttons">
                  <button className="primary-run-btn" onClick={runAssignment}>
                    <Play size={18} style={{ marginRight: 8 }} />
                    <span>Run Assignment Algorithm</span>
                  </button>

                  <input 
                    type="file" 
                    accept=".csv" 
                    style={{ display: 'none' }} 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                  />
                  <button className="secondary-upload-btn" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={18} style={{ marginRight: 8 }} />
                    <span>Upload Student List (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Table section */}
              <div className="table-wrapper-card">
                <div className="table-header-row">
                  <h3>IUT Student Directory</h3>
                  <span className="student-count-tag">{students.length} Students</span>
                </div>

                {loading ? (
                  <div className="table-loading">
                    <div className="spinner"></div>
                    <p>Fetching database records...</p>
                  </div>
                ) : (
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Student ID</th>
                        <th>Email</th>
                        <th>Compatibility</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-table-cell">
                            <FileSpreadsheet size={48} color="#C7C7CC" style={{ marginBottom: 12 }} />
                            <p>No students enrolled. Upload a CSV spreadsheet to populate the database.</p>
                          </td>
                        </tr>
                      ) : (
                        students.map(student => (
                          <tr key={student.id}>
                            <td className="student-name-cell">
                              <div className="mini-avatar">
                                {student.name[0]}
                              </div>
                              <span className="tbl-name">{student.name}</span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#006A4E', fontSize: 13 }}>{student.studentId || '—'}</td>
                            <td className="tbl-email">{student.email}</td>
                            <td>
                              <div className="tbl-progress-bar">
                                <div 
                                  className="tbl-progress-fill" 
                                  style={{ 
                                    width: `${student.compatibility}%`, 
                                    backgroundColor: student.compatibility > 80 ? '#059669' : student.compatibility > 50 ? '#D97706' : '#e5e7eb' 
                                  }}
                                ></div>
                                <span className="tbl-progress-text">{student.compatibility}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`tbl-status-badge ${student.roomStatus.toLowerCase().replace(' ', '-')}`}>
                                {student.roomStatus}
                              </span>
                            </td>
                            <td>
                              <button className="tbl-details-btn" onClick={() => alert(`Student: ${student.name}\nID: ${student.studentId || 'N/A'}\nEmail: ${student.email}\nCompatibility: ${student.compatibility}%\nStatus: ${student.roomStatus}`)}>
                                Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Floating Action Button */}
      <button className="floating-plus-btn" onClick={() => alert('Quick Actions menu...')}>
        <span>+</span>
      </button>
    </div>
  );
}

export default App;
