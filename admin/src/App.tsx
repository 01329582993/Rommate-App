import React, { useState } from 'react';
import './App.css';

interface Student {
  id: string;
  name: string;
  email: string;
  compatibility: number;
  roomStatus: string;
}

function App() {
  const [students] = useState<Student[]>([
    { id: '1', name: 'Alex Johnson', email: 'alex@uni.edu', compatibility: 95, roomStatus: 'Assigned' },
    { id: '2', name: 'Jordan Smith', email: 'jordan@uni.edu', compatibility: 88, roomStatus: 'Unassigned' },
    { id: '3', name: 'Casey Lee', email: 'casey@uni.edu', compatibility: 42, roomStatus: 'Pending' },
  ]);

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>RoomSync Admin</h1>
        <div className="admin-stats">
          <div className="stat-card">
            <span>Total Students</span>
            <strong>156</strong>
          </div>
          <div className="stat-card">
            <span>Rooms Configured</span>
            <strong>42</strong>
          </div>
        </div>
      </header>

      <main className="admin-content">
        <section className="controls">
          <button className="primary-btn">Run Assignment Algorithm</button>
          <button className="secondary-btn">Upload Student List</button>
        </section>

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
            {students.map(student => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${student.compatibility}%`, backgroundColor: student.compatibility > 80 ? '#4CAF50' : '#FFC107' }}
                    ></div>
                    <span>{student.compatibility}%</span>
                  </div>
                </td>
                <td><span className={`status-badge ${student.roomStatus.toLowerCase()}`}>{student.roomStatus}</span></td>
                <td><button className="text-btn">Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default App;
