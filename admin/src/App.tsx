import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface Student {
  id: string;
  name: string;
  email: string;
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
        <form className="login-card" onSubmit={handleLogin}>
          <h2>RoomSync Admin</h2>
          <p>Sign in to manage room assignments</p>
          
          {message && <div className="toast-message" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{message}</div>}

          <div className="input-group">
            <label htmlFor="email">Admin Email</label>
            <input 
              id="email"
              type="email" 
              placeholder="admin@roomsync.edu" 
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
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <h1>RoomSync Admin</h1>
          <button className="text-btn" onClick={handleLogout} style={{ padding: 0, color: '#FF3B30', background: 'none' }}>
            Log Out
          </button>
        </div>
        <div className="admin-stats">
          <div className="stat-card">
            <span>Total Students</span>
            <strong>{students.length}</strong>
          </div>
          <div className="stat-card">
            <span>Assigned</span>
            <strong>{students.filter(s => s.roomStatus === 'Assigned').length}</strong>
          </div>
        </div>
      </header>

      <main className="admin-content">
        {message && <div className="toast-message">{message}</div>}
        
        <section className="controls">
          <button className="primary-btn" onClick={runAssignment}>Run Assignment Algorithm</button>
          
          <input 
            type="file" 
            accept=".csv" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button className="secondary-btn" onClick={() => fileInputRef.current?.click()}>
            Upload Student List (CSV)
          </button>
        </section>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>
        ) : (
          <table className="student-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Compatibility Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No students found. Upload a CSV list.</td></tr>
              ) : (
                students.map(student => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${student.compatibility}%`, 
                            backgroundColor: student.compatibility > 80 ? '#4CAF50' : student.compatibility > 0 ? '#FFC107' : '#e0e0e0' 
                          }}
                        ></div>
                        <span>{student.compatibility}%</span>
                      </div>
                    </td>
                    <td><span className={`status-badge ${student.roomStatus.toLowerCase().replace(' ', '-')}`}>{student.roomStatus}</span></td>
                    <td><button className="text-btn">Details</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default App;
