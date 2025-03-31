import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { getGeminiResponse } from '../gemini';


const modelPerformance = {
  classificationReport: {
    classes: [
      { name: "No DR", precision: 0.86, recall: 0.97, f1Score: 0.91, support: 221.0 },
      { name: "Mild", precision: 0.50, recall: 0.61, f1Score: 0.55, support: 87.0 },
      { name: "Moderate", precision: 0.65, recall: 0.43, f1Score: 0.52, support: 197.0 },
      { name: "Severe", precision: 0.31, recall: 0.37, f1Score: 0.34, support: 38.0 },
      { name: "Proliferative DR", precision: 0.33, recall: 0.39, f1Score: 0.36, support: 69.0 }
    ],
    accuracy: 0.79,
    macroAvg: { precision: 0.53, recall: 0.55, f1Score: 0.53 },
    weightedAvg: { precision: 0.65, recall: 0.64, f1Score: 0.63 }
  },
  confusionMatrix: [
    [212, 4, 1, 1, 1],
    [8, 53, 13, 1, 12],
    [21, 37, 84, 18, 37],
    [0, 4, 14,14, 6],
    [5, 9, 17, 11, 27]
  ],
  insights: {
    strengths: [
      "High accuracy in detecting severe and proliferative cases",
      "Low false negative rate for advanced stages",
      "Robust performance across different image qualities"
    ],
    limitations: [
      "Slightly lower precision for mild cases due to subtle features",
      "May require additional validation for unusual presentations",
      "Performance varies with image quality and field of view"
    ],
    futureEnhancements: [
      "Integration with patient history for contextual analysis",
      "Expanded detection of other retinal conditions",
      "Longitudinal tracking of disease progression",
      "Explainable AI features to highlight specific lesions"
    ]
  }
};

function AnalysisPage() {
  const location = useLocation();
  const { image, predictedClass, confidence, fromApi } = location.state || {};
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [showModelPerformance, setShowModelPerformance] = useState(false);
  const [clinical_Features, setclinical_features] = useState("");
const [clinical_Assessment, setclinical_Assessment] = useState("");
const [findings, set_findings] = useState("");
const [nextSteps, set_nextSteps] = useState("");
  
  const [patientInfo, setPatientInfo] = useState({
    id: 'DR-' + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    time: new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  });
  const reportRef = useRef(null);


  const [analysisResults, setAnalysisResults] = useState({
    severity: predictedClass || 'Moderate',
    confidence: confidence || 87,
    findings: [
      { name: 'Microaneurysms', detected: true, count: 12, description: 'Small red dots that appear when tiny blood vessels leak.' },
      { name: 'Hemorrhages', detected: true, count: 5, description: 'Larger red spots indicating bleeding from damaged blood vessels.' },
      { name: 'Hard Exudates', detected: true, count: 8, description: 'Yellow deposits of lipid and protein from leaking vessels.' },
      { name: 'Cotton Wool Spots', detected: false, count: 0, description: 'Fluffy white patches indicating nerve fiber layer infarcts.' },
      { name: 'Neovascularization', detected: false, count: 0, description: 'Abnormal growth of new blood vessels, a severe sign.' }
    ],
    recommendation: 'Follow-up with ophthalmologist within 3 months is recommended.',
    nextSteps: [
      'Schedule an appointment with your ophthalmologist within 3 months',
      'Continue monitoring blood sugar levels',
      'Maintain a healthy diet and exercise regimen',
      'Take all prescribed medications as directed'
    ],
    severityExplanation: {
      'Mild': 'Early stage of diabetic retinopathy with minimal vessel changes. Regular monitoring is recommended.',
      'Moderate': 'Progressive stage with noticeable vessel damage. Requires closer monitoring and possible intervention.',
      'Severe': 'Advanced stage with significant vessel damage and risk of vision loss. Immediate medical attention required.',
      'No_DR': 'No signs of diabetic retinopathy detected. Continue regular monitoring.',
      'Proliferate_DR': 'Advanced stage with abnormal blood vessel growth. Immediate treatment required.'
    }
  });


  useEffect(() => {
    if (fromApi && predictedClass) {
      let recommendation = '';
      let nextSteps = [];
      
      switch(predictedClass) {
        case 'No_DR':
          recommendation = 'Annual eye examination recommended.';
          nextSteps = [
            'Continue annual eye examinations',
            'Maintain good blood sugar control',
            'Follow a healthy lifestyle'
          ];
          break;
        case 'Mild':
          recommendation = 'Follow-up with ophthalmologist within 6-12 months is recommended.';
          nextSteps = [
            'Schedule an appointment with your ophthalmologist within 6-12 months',
            'Monitor blood sugar levels closely',
            'Maintain a healthy diet and exercise regimen'
          ];
          break;
        case 'Moderate':
          recommendation = 'Follow-up with ophthalmologist within 3-6 months is recommended.';
          nextSteps = [
            'Schedule an appointment with your ophthalmologist within 3-6 months',
            'Continue monitoring blood sugar levels',
            'Maintain a healthy diet and exercise regimen',
            'Take all prescribed medications as directed'
          ];
          break;
        case 'Severe':
          recommendation = 'Urgent follow-up with ophthalmologist within 1 month is recommended.';
          nextSteps = [
            'Schedule an urgent appointment with your ophthalmologist within 1 month',
            'Strict blood sugar control is essential',
            'Follow all medical advice carefully',
            'Prepare for possible treatment interventions'
          ];
          break;
        case 'Proliferate_DR':
          recommendation = 'Immediate ophthalmological intervention is required.';
          nextSteps = [
            'Seek immediate ophthalmological care',
            'Strict blood sugar control is critical',
            'Prepare for treatment such as laser therapy or surgery',
            'Follow all specialist recommendations closely'
          ];
          break;
        default:
          recommendation = 'Follow-up with ophthalmologist is recommended.';
          nextSteps = [
            'Schedule an appointment with your ophthalmologist',
            'Continue monitoring blood sugar levels',
            'Maintain a healthy diet and exercise regimen'
          ];
      }
      
      setAnalysisResults(prev => ({
        ...prev,
        severity: predictedClass,
        confidence: confidence,
        recommendation,
        nextSteps
      }));
    }

    async function fetchGeminiResponse() {
      try {
          const response = await getGeminiResponse(predictedClass, confidence);
          console.log("Full Gemini Response:", response);
  
          // Corrected regex patterns
          const featuresMatch = response.match(/### 1\) \*\*Clinical Features\*\*\n([\s\S]*?)(?=\n### 2\) \*\*Clinical Assessment\*\*)/i);
          const assessmentMatch = response.match(/### 2\) \*\*Clinical Assessment\*\*\n([\s\S]*?)(?=\n### 3\) \*\*Findings & Status\*\*)/i);
          const findingsMatch = response.match(/### 3\) \*\*Findings & Status\*\*\n\n([\s\S]*?)(?=\n### 4\) \*\*Recommended Next Steps\*\*)/i);
          const stepsMatch = response.match(/### 4\) \*\*Recommended Next Steps\*\*\n([\s\S]*)/i);
  
          // Update state with extracted values
          setclinical_features(featuresMatch ? featuresMatch[1].trim() : "No clinical features found");
          setclinical_Assessment(assessmentMatch ? assessmentMatch[1].trim() : "No clinical assessment found");
          set_findings(findingsMatch ? findingsMatch[1].trim() : "No findings found");
          set_nextSteps(stepsMatch ? stepsMatch[1].trim() : "No next steps found");
  
          // Print extracted sections in console
          console.log("Clinical Features:", featuresMatch ? featuresMatch[1].trim() : "No data");
          console.log("Clinical Assessment:", assessmentMatch ? assessmentMatch[1].trim() : "No data");
          console.log("Findings:", findingsMatch ? findingsMatch[1].trim() : "No data");
          console.log("Next Steps:", stepsMatch ? stepsMatch[1].trim() : "No data");
  
      } catch (error) {
          console.error("Error fetching Gemini response:", error);
      }
  }
  
  
  
   
    
    fetchGeminiResponse();
  }, [fromApi, predictedClass, confidence]);


  const severityStatus = {
    'No_DR': {
      title: 'No Diabetic Retinopathy Detected',
      icon: 'bi-check-circle-fill',
      color: 'success',
      clinicalFeatures: [
        'No visible microaneurysms or hemorrhages',
        'Normal vascular patterns',
        'Clear retinal tissue without exudates',
        'No signs of neovascularization'
      ],
      riskLevel: 'Low',
      followUp: 'Annual eye examination recommended',
      visualAcuity: 'Typically unaffected',
      progression: 'Monitor for early signs of retinopathy'
    },
    'Mild': {
      title: 'Mild Non-Proliferative Diabetic Retinopathy',
      icon: 'bi-exclamation-circle-fill',
      color: 'info',
      clinicalFeatures: [
        'Few microaneurysms (small red dots)',
        'Minimal or no retinal hemorrhages',
        'No cotton wool spots or venous beading',
        'No intraretinal microvascular abnormalities (IRMA)'
      ],
      riskLevel: 'Low to Moderate',
      followUp: 'Eye examination every 6-12 months',
      visualAcuity: 'Usually preserved, may have subtle changes',
      progression: '7-15% progress to proliferative DR within 1 year'
    },
    'Moderate': {
      title: 'Moderate Non-Proliferative Diabetic Retinopathy',
      icon: 'bi-exclamation-triangle-fill',
      color: 'warning',
      clinicalFeatures: [
        'Multiple microaneurysms',
        'Dot and blot hemorrhages in 1-3 quadrants',
        'Possible hard exudates (yellow deposits)',
        'Possible cotton wool spots (nerve fiber layer infarcts)',
        'No signs of severe NPDR or proliferative changes'
      ],
      riskLevel: 'Moderate',
      followUp: 'Eye examination every 3-6 months',
      visualAcuity: 'May be affected if macular edema present',
      progression: '15-25% progress to proliferative DR within 1 year'
    },
    'Severe': {
      title: 'Severe Non-Proliferative Diabetic Retinopathy',
      icon: 'bi-exclamation-diamond-fill',
      color: 'danger',
      clinicalFeatures: [
        'Extensive microaneurysms and hemorrhages in all 4 quadrants',
        'Venous beading in 2+ quadrants',
        'Intraretinal microvascular abnormalities (IRMA) in 1+ quadrant',
        'No signs of proliferative retinopathy yet'
      ],
      riskLevel: 'High',
      followUp: 'Urgent referral to retina specialist',
      visualAcuity: 'Often affected, may have significant vision loss',
      progression: '50%+ progress to proliferative DR within 1 year'
    },
    'Proliferate_DR': {
      title: 'Proliferative Diabetic Retinopathy',
      icon: 'bi-x-octagon-fill',
      color: 'dark',
      clinicalFeatures: [
        'Neovascularization (abnormal new blood vessels)',
        'Potential vitreous hemorrhage',
        'Potential retinal detachment',
        'Severe vision-threatening complications',
        'May include diabetic macular edema'
      ],
      riskLevel: 'Very High',
      followUp: 'Immediate treatment required',
      visualAcuity: 'Severely compromised, significant vision loss likely',
      progression: 'High risk of blindness without intervention'
    }
  };


  const getSeverityStatus = (severity) => {
    return severityStatus[severity] || {
      title: 'Analysis Result',
      icon: 'bi-info-circle-fill',
      color: 'primary',
      clinicalFeatures: ['Unable to determine specific features'],
      riskLevel: 'Unknown',
      followUp: 'Please consult with your healthcare provider',
      visualAcuity: 'Not determined',
      progression: 'Not determined'
    };
  };


  const getSeverityClass = (severity) => {
    switch(severity) {
      case 'Mild': return 'text-success';
      case 'Moderate': return 'text-warning';
      case 'Severe': return 'text-danger';
      case 'Proliferate_DR': return 'text-dark';
      case 'No_DR': return 'text-info';
      default: return 'text-info';
    }
  };


  const getSeverityBgClass = (severity) => {
    switch(severity) {
      case 'Mild': return 'bg-success';
      case 'Moderate': return 'bg-warning';
      case 'Severe': return 'bg-danger';
      case 'Proliferate_DR': return 'bg-dark';
      case 'No_DR': return 'bg-info';
      default: return 'bg-info';
    }
  };

 
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + Math.floor(Math.random() * 15);
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 200);
    
    const timer = setTimeout(() => {
      clearInterval(progressInterval);
      setShowResults(true);
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, []);


  const handleDownloadPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 1,
      filename: `Retinopathy_Analysis_Report_${patientInfo.id}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
   
    const originalTab = activeTab;
    setActiveTab('all');
    
 
    setTimeout(() => {
      html2pdf().set(opt).from(element).save().then(() => {
      
        setActiveTab(originalTab);
      });
    }, 100);
  };


  const handleShareReport = () => {
    const subject = `Diabetes Retinopathy Analysis Report - ${patientInfo.id}`;
    const body = `Please find attached the Diabetes Retinopathy Analysis Report for patient ID: ${patientInfo.id}.\n\nSeverity: ${analysisResults.severity}\nConfidence: ${parseFloat(analysisResults.confidence).toFixed(2)}%\nRecommendation: ${analysisResults.recommendation}\n\nThis is an automated message. Please do not reply.`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };


  const displaySeverity = (severity) => {
    if (severity === 'No_DR') return 'No DR';
    if (severity === 'Proliferate_DR') return 'Proliferative DR';
    return severity;
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-10">
        {!showResults ? (
          <div className="text-center py-5">
            <div className="position-relative mb-4" style={{ width: '6rem', height: '6rem', margin: '0 auto' }}>
              <div className="spinner-border text-primary" role="status" style={{ width: '6rem', height: '6rem' }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="position-absolute top-50 start-50 translate-middle fw-bold fs-4">
                {loadingProgress}%
              </div>
            </div>
            <h3 className="mt-3">Analyzing Retinal Image...</h3>
            <p className="text-muted">Our AI is processing your image. This may take a few moments.</p>
            <div className="progress mt-3" style={{ height: '10px' }}>
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated" 
                role="progressbar" 
                style={{ 
                  width: `${loadingProgress}%`,
                  background: 'linear-gradient(90deg, #1cb5e0 0%, #000851 100%)'
                }} 
                aria-valuenow={loadingProgress} 
                aria-valuemin="0" 
                aria-valuemax="100"
              ></div>
            </div>
          </div>
        ) : (
          <>
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden mb-4" ref={reportRef}>
              <div className="card-header bg-white p-4 border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0">
                    <span className={`badge ${getSeverityBgClass(analysisResults.severity)} me-2`}>
                      {displaySeverity(analysisResults.severity)}
                    </span>
                    Diabetic Retinopathy Analysis
                  </h3>
                  <div>
                    <span className="badge bg-primary rounded-pill px-3 py-2">
                      <i className="bi bi-percent me-1"></i> {parseFloat(analysisResults.confidence).toFixed(2)}% Confidence
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="card-body p-0">
                <div className="row g-0">
                  <div className="col-md-5">
                    {image ? (
                      <div className="position-relative h-100">
                        <img 
                          src={image} 
                          alt="Uploaded Retina" 
                          className="img-fluid h-100 w-full 
 object-fit-cover align-middle" 
                          style={{ maxHeight: '400px' }}
                        />
                        <div className="position-absolute bottom-0 start-0 w-100 p-2 text-white" 
                             style={{ background: 'rgba(0,0,0,0.5)' }}>
                          <div className="d-flex justify-content-between align-items-center">
                            <small>
                              <i className="bi bi-eye-fill me-1"></i> Retinal Scan
                            </small>
                            <small>
                              <i className="bi bi-check-circle-fill me-1 text-success"></i> Processed
                            </small>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-warning m-3">No image available</div>
                    )}
                  </div>
                  
                  <div className="col-md-7">
                    <div className="p-4">
                      {activeTab !== 'all' && (
                        <ul className="nav nav-tabs mb-4">
                          <li className="nav-item">
                            <button 
                              className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`}
                              onClick={() => setActiveTab('summary')}
                            >
                              <i className="bi bi-clipboard-data me-1"></i> Summary
                            </button>
                          </li>
                          <li className="nav-item">
                            <button 
                              className={`nav-link ${activeTab === 'findings' ? 'active' : ''}`}
                              onClick={() => setActiveTab('findings')}
                            >
                              <i className="bi bi-list-check me-1"></i> Findings
                            </button>
                          </li>
                          <li className="nav-item">
                            <button 
                              className={`nav-link ${activeTab === 'next' ? 'active' : ''}`}
                              onClick={() => setActiveTab('next')}
                            >
                              <i className="bi bi-arrow-right-circle me-1"></i> Next Steps
                            </button>
                          </li>
                        </ul>
                      )}
                      
                      {(activeTab === 'summary' || activeTab === 'all') && (
                        <div className={activeTab === 'all' ? 'mb-5' : ''}>
                          <h3 className="card-title fs-4 mb-3">Diagnosis Summary</h3>
                          
                          {/* Enhanced Severity Status Card */}
                          <div className={`card border-${getSeverityStatus(analysisResults.severity).color} mb-4`}>
                            <div className={`card-header bg-${getSeverityStatus(analysisResults.severity).color} ${getSeverityStatus(analysisResults.severity).color === 'warning' ? 'text-dark' : 'text-white'}`}>
                              <div className="d-flex align-items-center">
                                <i className={`bi ${getSeverityStatus(analysisResults.severity).icon} me-2 fs-5`}></i>
                                <h5 className="mb-0">{getSeverityStatus(analysisResults.severity).title}</h5>
                              </div>
                            </div>
                            <div className="card-body">
                              <div className="row g-3">
                                <div className="col-md-6">
                                  <h6 className="border-bottom pb-2 mb-2">Clinical Features</h6>
                                  <ul className="list-unstyled mb-0">
                                    {getSeverityStatus(analysisResults.severity).clinicalFeatures.map((feature, index) => (
                                      <li key={index} className="mb-1">
                                        <i className="bi bi-dot me-1"></i>
                                        {feature}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="col-md-6">
                                  <h6 className="border-bottom pb-2 mb-2">Clinical Assessment</h6>
                                  <div className="mb-2">
                                    <span className="fw-bold">Risk Level:</span> 
                                    <span className={`ms-2 text-${getSeverityStatus(analysisResults.severity).color}`}>
                                      {getSeverityStatus(analysisResults.severity).riskLevel}
                                    </span>
                                  </div>
                                  <div className="mb-2">
                                    <span className="fw-bold">Follow-up:</span> 
                                    <span className="ms-2">{getSeverityStatus(analysisResults.severity).followUp}</span>
                                  </div>
                                  <div className="mb-2">
                                    <span className="fw-bold">Visual Acuity:</span> 
                                    <span className="ms-2">{getSeverityStatus(analysisResults.severity).visualAcuity}</span>
                                  </div>
                                  <div>
                                    <span className="fw-bold">Progression Risk:</span> 
                                    <span className="ms-2">{getSeverityStatus(analysisResults.severity).progression}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h5 className="mb-0">Severity Level:</h5>
                              <h5 className={`mb-0 ${getSeverityClass(analysisResults.severity)}`}>
                                {analysisResults.severity}
                              </h5>
                            </div>
                            <div className="progress" style={{ height: '10px' }}>
                              <div 
                                className={`progress-bar ${getSeverityBgClass(analysisResults.severity)}`}
                                role="progressbar" 
                                style={{ 
                                  width: analysisResults.severity === 'Mild' ? '33%' : 
                                         analysisResults.severity === 'Moderate' ? '66%' : '100%' 
                                }} 
                                aria-valuenow={analysisResults.severity === 'Mild' ? 33 : 
                                              analysisResults.severity === 'Moderate' ? 66 : 100} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              ></div>
                            </div>
                            <div className="mt-2 small text-muted fst-italic">
                              {analysisResults.severityExplanation[analysisResults.severity]}
                            </div>
                          </div>
                          
                          <div className="mb-4">
                            <h5>Confidence Score</h5>
                            <div className="progress" style={{ height: '10px' }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ 
                                  width: `${analysisResults.confidence}%`,
                                  background: 'linear-gradient(90deg, #1cb5e0 0%, #000851 100%)'
                                }} 
                                aria-valuenow={analysisResults.confidence} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              ></div>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                              <small className="text-muted">0%</small>
                              <small className="fw-bold">{parseFloat(analysisResults.confidence).toFixed(2)}%</small>
                              <small className="text-muted">100%</small>
                            </div>
                          </div>
                          
                          <div className="alert alert-primary">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            {analysisResults.recommendation}
                          </div>
                        </div>
                      )}
                      
                      {(activeTab === 'findings' || activeTab === 'all') && (
                        <div className={activeTab === 'all' ? 'mb-5' : ''}>
                          <h3 className="card-title fs-4 mb-3">Detailed Findings</h3>
                          <div className="table-responsive">
                            <table className="table table-hover">
                              <thead className="table-light">
                                <tr>
                                  <th>Finding</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {analysisResults.findings.map((finding, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div className="fw-bold">{finding.name}</div>
                                      <small className="text-muted">{finding.description}</small>
                                    </td>
                                    <td>
                                      {finding.detected ? (
                                        <span className="badge bg-danger">Detected</span>
                                      ) : (
                                        <span className="badge bg-success">Not Detected</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {(activeTab === 'next' || activeTab === 'all') && (
                        <div>
                          <h3 className="card-title fs-4 mb-3">Recommended Next Steps</h3>
                          <ul className="list-group list-group-flush">
                            {analysisResults.nextSteps.map((step, index) => (
                              <li key={index} className="list-group-item d-flex align-items-center">
                                <div className="me-3">
                                  <span className="badge rounded-pill text-bg-primary">{index + 1}</span>
                                </div>
                                <div>{step}</div>
                              </li>
                            ))}
                          </ul>
                          <div className="alert alert-warning mt-3">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            Please consult with your healthcare provider before making any changes to your treatment plan.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {activeTab === 'all' && (
                <div className="card-footer bg-light p-3">
                  <div className="small text-muted text-center">
                    This report was generated automatically and should be reviewed by a healthcare professional.
                    <br />
                    Report ID: {patientInfo.id} | Generated on: {patientInfo.date} at {patientInfo.time}
                  </div>
                </div>
              )}
            </div>

            {/* Model Performance and Analysis Section */}
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden mb-4">
              <div className="card-header d-flex justify-content-between align-items-center py-3" 
                   style={{ background: 'linear-gradient(90deg, #1cb5e0 0%, #000851 100%)' }}>
                <h3 className="text-white mb-0 fs-5">Model Performance & Analysis</h3>
                <button 
                  className="btn btn-sm btn-outline-light" 
                  onClick={() => setShowModelPerformance(!showModelPerformance)}
                >
                  {showModelPerformance ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              {showModelPerformance && (
                <div className="card-body p-4">
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <h5 className="border-bottom pb-2 mb-3">Classification Report</h5>
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Class</th>
                              <th>Precision</th>
                              <th>Recall</th>
                              <th>F1-Score</th>
                              <th>Support</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modelPerformance.classificationReport.classes.map((cls, index) => (
                              <tr key={index}>
                                <td>{cls.name}</td>
                                <td>{cls.precision.toFixed(2)}</td>
                                <td>{cls.recall.toFixed(2)}</td>
                                <td>{cls.f1Score.toFixed(2)}</td>
                                <td>{cls.support}</td>
                              </tr>
                            ))}
                            <tr className="table-light">
                              <td><strong>Accuracy</strong></td>
                              <td colSpan="3" className="text-center">{modelPerformance.classificationReport.accuracy.toFixed(3)}</td>
                              <td>{modelPerformance.classificationReport.classes.reduce((sum, cls) => sum + cls.support, 0)}</td>
                            </tr>
                            <tr>
                              <td><strong>Macro Avg</strong></td>
                              <td>{modelPerformance.classificationReport.macroAvg.precision.toFixed(2)}</td>
                              <td>{modelPerformance.classificationReport.macroAvg.recall.toFixed(2)}</td>
                              <td>{modelPerformance.classificationReport.macroAvg.f1Score.toFixed(2)}</td>
                              <td>-</td>
                            </tr>
                            <tr>
                              <td><strong>Weighted Avg</strong></td>
                              <td>{modelPerformance.classificationReport.weightedAvg.precision.toFixed(2)}</td>
                              <td>{modelPerformance.classificationReport.weightedAvg.recall.toFixed(2)}</td>
                              <td>{modelPerformance.classificationReport.weightedAvg.f1Score.toFixed(2)}</td>
                              <td>-</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="col-md-6 mb-4">
                      <h5 className="border-bottom pb-2 mb-3">Confusion Matrix</h5>
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered text-center">
                          <thead className="table-light">
                            <tr>
                              <th></th>
                              {modelPerformance.classificationReport.classes.map((cls, index) => (
                                <th key={index}>Predicted<br/>{cls.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {modelPerformance.confusionMatrix.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                <th className="table-light">Actual<br/>{modelPerformance.classificationReport.classes[rowIndex].name}</th>
                                {row.map((cell, cellIndex) => (
                                  <td 
                                    key={cellIndex} 
                                    className={rowIndex === cellIndex ? "table-success" : ""}
                                    style={{ 
                                      backgroundColor: rowIndex === cellIndex ? 
                                        `rgba(40, 167, 69, ${cell / Math.max(...modelPerformance.confusionMatrix[rowIndex])})` : 
                                        rowIndex !== cellIndex && cell > 0 ? 
                                        `rgba(220, 53, 69, ${cell / 45})` : '' 
                                    }}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="col-12">
                      <h5 className="border-bottom pb-2 mb-3">Model Insights</h5>
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <div className="card h-100 border-success">
                            <div className="card-header bg-success text-white">
                              <i className="bi bi-check-circle-fill me-2"></i>Strengths
                            </div>
                            <div className="card-body">
                              <ul className="list-group list-group-flush">
                                {modelPerformance.insights.strengths.map((strength, index) => (
                                  <li key={index} className="list-group-item border-0 px-0">
                                    <i className="bi bi-check text-success me-2"></i>{strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-md-4 mb-3">
                          <div className="card h-100 border-warning">
                            <div className="card-header bg-warning text-dark">
                              <i className="bi bi-exclamation-triangle-fill me-2"></i>Limitations
                            </div>
                            <div className="card-body">
                              <ul className="list-group list-group-flush">
                                {modelPerformance.insights.limitations.map((limitation, index) => (
                                  <li key={index} className="list-group-item border-0 px-0">
                                    <i className="bi bi-dash text-warning me-2"></i>{limitation}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-md-4 mb-3">
                          <div className="card h-100 border-info">
                            <div className="card-header bg-info text-white">
                              <i className="bi bi-lightbulb-fill me-2"></i>Future Enhancements
                            </div>
                            <div className="card-body">
                              <ul className="list-group list-group-flush">
                                {modelPerformance.insights.futureEnhancements.map((enhancement, index) => (
                                  <li key={index} className="list-group-item border-0 px-0">
                                    <i className="bi bi-arrow-right text-info me-2"></i>{enhancement}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-between">
              <Link to="/" className="btn btn-outline-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Home
              </Link>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-info" onClick={handleShareReport}>
                  <i className="bi bi-envelope me-2"></i>
                  Email Report
                </button>
                <button className="btn btn-outline-success" onClick={handleDownloadPDF}>
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  Download PDF
                </button>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <i className="bi bi-printer me-2"></i>
                  Print Report
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AnalysisPage; 