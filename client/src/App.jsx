import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import AnalysisPage from './components/AnalysisPage';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <div className="bg-white min-vh-100 d-flex flex-column">
        <nav className="navbar navbar-expand-lg navbar-dark shadow-sm" style={{ background: 'linear-gradient(90deg, #1cb5e0 0%, #000851 100%)' }}>
          <div className="container">
            <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
              <i className="bi bi-eye-fill me-2 fs-3 text-warning"></i>
              <span className="fs-4">Diabetes Retinopathy Analyzer</span>
            </Link>
            <div className="ms-auto d-none d-md-block">
              <span className="badge rounded-pill text-bg-warning px-3 py-2">
                <i className="bi bi-shield-check me-1"></i> Medical Grade Analysis
              </span>
            </div>
          </div>
        </nav>
        
        <div className="container py-3 flex-grow-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
          </Routes>
        </div>
        
        <footer className="text-white text-center py-3" style={{ background: 'linear-gradient(90deg, #000851 0%, #1cb5e0 100%)' }}>
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-4 text-md-start">
                <i className="bi bi-shield-plus fs-1 text-warning"></i>
              </div>
              <div className="col-md-4">
                <p className="mb-0">© 2025 Diabetes Retinopathy Analyzer</p>
              </div>
              <div className="col-md-4 text-md-end">
               
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
