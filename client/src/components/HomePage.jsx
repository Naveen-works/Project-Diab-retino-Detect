import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


const modelInfo = {
  title: "Diabetes Retinopathy - Severity Classification",
  introduction: "Early detection of diabetic retinopathy is crucial for preventing vision loss. Our AI-powered analysis tool helps identify signs of retinopathy in retinal images with high accuracy.",
  objectives: [
    "Predict the severity of diabetic retinopathy from retinal images",
    "Assist healthcare professionals in early diagnosis",
    "Provide accurate and automated classification to improve patient outcomes"
  ],
  dataset: {
    source: "EyePACS and APTOS 2019 Blindness Detection datasets",
    description: "88,702 high-resolution retina images graded for diabetic retinopathy severity",
    distribution: [
      { class: "No DR", percentage: 53.3, count: 47279 },
      { class: "Mild", percentage: 10.4, count: 9225 },
      { class: "Moderate", percentage: 11.2, count: 9934 },
      { class: "Severe", percentage: 11.5, count: 10201 },
      { class: "Proliferative DR", percentage: 13.6, count: 12063 }
    ]
  },
  methodology: {
    architecture: "VISION TRANSFORMER(VIT)",
    training: "Transfer learning with fine-tuning, focal loss, Adam optimizer",
    metrics: "Accuracy: 92.4%, Precision: 91.7%, Recall: 90.3%, F1-Score: 91.0%",
    preprocessing: "Contrast enhancement, normalization, and balanced sampling"
  }
};

function HomePage() {
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
      setFileName(e.target.files[0].name);
      setImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(URL.createObjectURL(e.dataTransfer.files[0]));
      setFileName(e.dataTransfer.files[0].name);
      setImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (image && imageFile) {
      setIsLoading(true);
      
      // Create a FileReader to read the image as base64
      const reader = new FileReader();
      reader.onloadend = () => {
        // Send the image to the Flask API
        fetch('http://localhost:5000/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: reader.result
          }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Navigate to analysis page with the prediction results and image
            navigate('/analysis', { 
              state: { 
                image,
                predictedClass: data.predicted_class,
                confidence: data.confidence,
                fromApi: true
              } 
            });
          } else {
            alert('Error analyzing image: ' + data.error);
            setIsLoading(false);
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Error connecting to the server. Please try again.');
          setIsLoading(false);
        });
      };
      
      // Read the image file as a data URL (base64)
      reader.readAsDataURL(imageFile);
    } else {
      alert('Please upload an image first');
    }
  };

  return (
    <>
      <div className="row mb-4">
        <div className="col-12">
          <div className="p-4 rounded-4 text-white text-center" 
               style={{ background: 'linear-gradient(135deg, #000851 0%, #1cb5e0 100%)' }}>
            <h1 className="display-5 fw-bold mb-3">
              <span className="border-bottom border-warning border-3 pb-1">{modelInfo.title}</span>
            </h1>
            <p className="lead mb-0">
              {modelInfo.introduction}
            </p>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
            <div className="card-body p-4">
              <div 
                className={`text-center mb-3 border-2 border-dashed rounded-4 p-4 transition-all ${
                  isDragging 
                    ? 'border-warning bg-light shadow-sm' 
                    : 'border-secondary'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {image ? (
                  <div className="position-relative">
                    <img 
                      src={image} 
                      alt="Retina Preview" 
                      className="img-fluid rounded-4 shadow-sm mb-2" 
                      style={{ maxHeight: '250px' }} 
                    />
                    <div className="position-absolute top-0 end-0 m-2">
                      <button 
                        className="btn btn-sm btn-outline-light rounded-circle" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setImage(null);
                          setFileName('');
                        }}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4">
                    <i className="bi bi-cloud-upload text-warning" style={{ fontSize: '3.5rem' }}></i>
                    <h4 className="mt-2">Drag & Drop Your Retina Image Here</h4>
                    <p className="text-muted">or click to browse files</p>
                    <div className="mt-3 d-flex justify-content-center gap-2">
                      <span className="badge bg-light text-dark">
                        <i className="bi bi-file-earmark-image me-1"></i> JPG
                      </span>
                      <span className="badge bg-light text-dark">
                        <i className="bi bi-file-earmark-image me-1"></i> PNG
                      </span>
                      <span className="badge bg-light text-dark">
                        <i className="bi bi-file-earmark-image me-1"></i> TIFF
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-3">
                <div className="input-group">
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="form-control" 
                    id="inputGroupFile" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button" 
                    onClick={() => fileInputRef.current.click()}
                  >
                    <i className="bi bi-folder2-open me-2"></i>
                    Browse Files
                  </button>
                  <span className="input-group-text">
                    {fileName || 'No file chosen'}
                  </span>
                </div>
              </div>
              
              <div className="d-grid gap-2">
                <button 
                  onClick={handleAnalyze} 
                  className="btn btn-lg text-white"
                  disabled={!image || isLoading}
                  style={{ background: 'linear-gradient(90deg, #1cb5e0 0%, #000851 100%)' }}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-2"></i>
                      Analyze Image
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="row mt-4 g-3">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 hover-card">
                <div className="card-body text-center p-4">
                  <div className="icon-circle bg-light-blue mb-3">
                    <i className="bi bi-upload text-primary"></i>
                  </div>
                  <h5 className="card-title">Upload</h5>
                  <p className="card-text text-muted">Upload a high-quality retinal image for best results.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 hover-card">
                <div className="card-body text-center p-4">
                  <div className="icon-circle bg-light-blue mb-3">
                    <i className="bi bi-cpu text-primary"></i>
                  </div>
                  <h5 className="card-title">Analyze</h5>
                  <p className="card-text text-muted">Our AI model processes the image to detect signs of retinopathy.</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 hover-card">
                <div className="card-body text-center p-4">
                  <div className="icon-circle bg-light-blue mb-3">
                    <i className="bi bi-file-earmark-medical text-primary"></i>
                  </div>
                  <h5 className="card-title">Results</h5>
                  <p className="card-text text-muted">Get detailed analysis and severity classification.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-light rounded-4 shadow-sm">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h4 className="mb-2">Why Early Detection Matters</h4>
                <p className="mb-0">Diabetic retinopathy is the leading cause of blindness in working-age adults. Early detection and treatment can reduce the risk of blindness by 95%.</p>
              </div>
              <div className="col-md-4 text-md-end mt-3 mt-md-0">
                <i className="bi bi-shield-check text-success" style={{ fontSize: '3rem' }}></i>
              </div>
            </div>
          </div>
          
          {/* Model Information Accordion */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">About Our AI Model</h4>
              <button 
                className="btn btn-sm btn-outline-primary" 
                onClick={() => setShowModelInfo(!showModelInfo)}
              >
                {showModelInfo ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {showModelInfo && (
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="card-body p-4">
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <h5 className="border-bottom pb-2 mb-3">Objectives</h5>
                      <ul className="list-group list-group-flush">
                        {modelInfo.objectives.map((objective, index) => (
                          <li key={index} className="list-group-item bg-transparent px-0">
                            <i className="bi bi-check-circle-fill text-success me-2"></i>
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="col-md-6 mb-4">
                      <h5 className="border-bottom pb-2 mb-3">Methodology</h5>
                      <div className="mb-2">
                        <span className="fw-bold">Architecture:</span> {modelInfo.methodology.architecture}
                      </div>
                      <div className="mb-2">
                        <span className="fw-bold">Training:</span> {modelInfo.methodology.training}
                      </div>
                      <div className="mb-2">
                        <span className="fw-bold">Metrics:</span> {modelInfo.methodology.metrics}
                      </div>
                      <div>
                        <span className="fw-bold">Preprocessing:</span> {modelInfo.methodology.preprocessing}
                      </div>
                    </div>
                    
                    <div className="col-12">
                      <h5 className="border-bottom pb-2 mb-3">Dataset Information</h5>
                      <div className="mb-3">
                        <span className="fw-bold">Source:</span> {modelInfo.dataset.source}
                        <br />
                        <span className="fw-bold">Description:</span> {modelInfo.dataset.description}
                      </div>
                      
                      <h6>Class Distribution</h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>Severity Class</th>
                              <th>Count</th>
                              <th>Percentage</th>
                              <th>Distribution</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modelInfo.dataset.distribution.map((item, index) => (
                              <tr key={index}>
                                <td>{item.class}</td>
                                <td>{item.count.toLocaleString()}</td>
                                <td>{item.percentage}%</td>
                                <td>
                                  <div className="progress" style={{ height: '10px' }}>
                                    <div 
                                      className="progress-bar" 
                                      role="progressbar" 
                                      style={{ 
                                        width: `${item.percentage}%`,
                                        background: index === 0 ? '#28a745' : 
                                                  index === 1 ? '#17a2b8' : 
                                                  index === 2 ? '#ffc107' : 
                                                  index === 3 ? '#fd7e14' : '#dc3545'
                                      }} 
                                      aria-valuenow={item.percentage} 
                                      aria-valuemin="0" 
                                      aria-valuemax="100"
                                    ></div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


const styles = `
  .transition-all {
    transition: all 0.3s ease;
  }
  
  .hover-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .hover-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
  }
  
  .icon-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  
  .icon-circle i {
    font-size: 1.75rem;
  }
  
  .bg-light-blue {
    background-color: rgba(28, 181, 224, 0.1);
  }
`;


const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default HomePage; 