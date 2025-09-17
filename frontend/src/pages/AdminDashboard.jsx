import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FilterControls from '../components/FilterControls';
import { useComplaintFilters } from '../components/useComplaintFilters';
import Graph from '../components/Graph';
import AdminMapView from '../components/AdminMapView';
import { 
  faBuilding, 
  faSignOutAlt, 
  faChartBar, 
  faClock, 
  faSpinner, 
  faCheckCircle, 
  faMapMarkerAlt, 
  faPhone, 
  faBolt, 
  faCalendarAlt, 
  faEye, 
  faMicrophone, 
  faFileText, 
  faHome, 
  faCity, 
  faMailBulk, 
  faTimes,
  faExclamationTriangle,
  faQuestionCircle,
  faImage
} from '@fortawesome/free-solid-svg-icons';

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, resolved: 0, total: 0 });
  
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  // Use the custom filtering hook
  const {
    dateFilter,
    setDateFilter,
    priorityFilter,
    setPriorityFilter,
    getFilteredAndSortedComplaints
  } = useComplaintFilters(complaints);

  const fetchComplaints = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/complaints/admin/my-city", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setComplaints(data.complaints || []);
        setAdminInfo(prev => ({ ...prev, ...data.admin }));
        
        // Calculate stats
        const newStats = {
          pending: data.complaints.filter(c => c.status === "pending").length,
          in_progress: data.complaints.filter(c => c.status === "in_progress").length,
          resolved: data.complaints.filter(c => c.status === "resolved").length,
          total: data.complaints.length
        };
        setStats(newStats);
      } else {
        setError(data.error || "Failed to fetch complaints");
      }
    } catch (error) {
      console.error("Fetch complaints error:", error);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }

    const storedAdminInfo = localStorage.getItem("adminInfo");
    if (storedAdminInfo) {
      setAdminInfo(JSON.parse(storedAdminInfo));
    }

    fetchComplaints();
  }, [token, navigate, fetchComplaints]);

  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/complaints/admin/${complaintId}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update local state
        setComplaints(prev => 
          prev.map(complaint => 
            complaint._id === complaintId 
              ? { ...complaint, status: newStatus }
              : complaint
          )
        );
        
        // Refresh stats
        fetchComplaints();
        
        alert("Complaint status updated successfully!");
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Update status error:", error);
      alert("Network error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin");
  };





  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#ffc107";
      case "in_progress": return "#17a2b8";
      case "resolved": return "#28a745";
      default: return "#6c757d";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <FontAwesomeIcon icon={faClock} />;
      case "in_progress": return <FontAwesomeIcon icon={faSpinner} />;
      case "resolved": return <FontAwesomeIcon icon={faCheckCircle} />;
      default: return <FontAwesomeIcon icon={faQuestionCircle} />;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontSize: "18px"
      }}>
        <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: "10px" }} />Loading admin dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        flexDirection: "column",
        gap: "20px"
      }}>
        <p style={{ color: "red", fontSize: "18px" }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: "10px" }} />{error}
        </p>
        <button onClick={() => window.location.reload()}>
          <FontAwesomeIcon icon={faSpinner} style={{ marginRight: "5px" }} />Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div>
            <h1 style={{ margin: "0", color: "#333", fontSize: "24px" }}>
              <FontAwesomeIcon icon={faBuilding} style={{ marginRight: "10px" }} /> Admin Dashboard
            </h1>
            {adminInfo && (
              <p style={{ margin: "5px 0 0 0", color: "#666" }}>
                Welcome {adminInfo.name} - {adminInfo.city}, {adminInfo.state} Administrator
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: "5px" }} /> Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: "3px solid #007bff"
          }}>
            <h2 style={{ margin: "0", color: "#007bff", fontSize: "32px" }}>{stats.total}</h2>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}><FontAwesomeIcon icon={faChartBar} style={{ marginRight: "5px" }} />Total Complaints</p>
          </div>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: "3px solid #ffc107"
          }}>
            <h2 style={{ margin: "0", color: "#ffc107", fontSize: "32px" }}>{stats.pending}</h2>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}><FontAwesomeIcon icon={faClock} style={{ marginRight: "5px" }} />Pending</p>
          </div>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: "3px solid #17a2b8"
          }}>
            <h2 style={{ margin: "0", color: "#17a2b8", fontSize: "32px" }}>{stats.in_progress}</h2>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}><FontAwesomeIcon icon={faSpinner} style={{ marginRight: "5px" }} />In Progress</p>
          </div>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: "3px solid #28a745"
          }}>
            <h2 style={{ margin: "0", color: "#28a745", fontSize: "32px" }}>{stats.resolved}</h2>
            <p style={{ margin: "5px 0 0 0", color: "#666" }}><FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: "5px" }} />Resolved</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
          marginBottom: "40px"
        }}>
          {/* Complaints Analytics Graph */}
          <Graph complaints={complaints} />
          
          {/* District Complaints Map */}
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            maxHeight: "420px",
            overflow: "hidden"
          }}>
            <AdminMapView 
              complaints={complaints} 
              onComplaintSelect={setSelectedComplaint}
            />
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px 8px 0 0",
          padding: "0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", borderBottom: "1px solid #ddd" }}>
            {["pending", "in_progress", "resolved"].map(status => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                style={{
                  padding: "15px 25px",
                  border: "none",
                  backgroundColor: activeTab === status ? "#007bff" : "transparent",
                  color: activeTab === status ? "white" : "#666",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: activeTab === status ? "bold" : "normal",
                  borderRadius: activeTab === status ? "8px 8px 0 0" : "0",
                  transition: "all 0.3s"
                }}
              >
                {getStatusIcon(status)} {status.replace("_", " ").toUpperCase()} ({
                  status === "pending" ? stats.pending :
                  status === "in_progress" ? stats.in_progress :
                  stats.resolved
                })
              </button>
            ))}
          </div>

          {/* Filter Controls */}
          <FilterControls
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            filteredCount={getFilteredAndSortedComplaints(activeTab).length}
          />

          {/* Complaints List */}
          <div style={{ padding: "20px" }}>
            {getFilteredAndSortedComplaints(activeTab).length > 0 ? (
              <div style={{ display: "grid", gap: "15px" }}>
                {getFilteredAndSortedComplaints(activeTab).map(complaint => (
                  <div
                    key={complaint._id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      padding: "20px",
                      backgroundColor: "#f9f9f9",
                      borderLeft: `5px solid ${getStatusColor(complaint.status)}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                          <FontAwesomeIcon icon={faFileText} style={{ marginRight: "8px" }} />{complaint.description.substring(0, 80)}...
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "10px", fontSize: "14px", color: "#666" }}>
                          <p style={{ margin: 0 }}>
                            <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: "5px" }} />
                            {complaint.location?.detailedAddress || complaint.location?.address || `${complaint.location?.city}, ${complaint.location?.state}`}
                          </p>
                          <p style={{ margin: 0 }}>
                            <FontAwesomeIcon icon={faPhone} style={{ marginRight: "5px" }} />
                            {complaint.phone}
                          </p>
                          {complaint.priority && 
                            <p style={{ margin: 0 }}>
                              <FontAwesomeIcon icon={faBolt} style={{ marginRight: "5px" }} />
                              Priority: {complaint.priority}
                            </p>
                          }
                          <p style={{ margin: 0 }}>
                            <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: "5px" }} />
                            {new Date(complaint.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} style={{ marginRight: "5px" }} />View Details
                        </button>
                        
                        {complaint.status !== "resolved" && (
                          <select
                            value={complaint.status}
                            onChange={(e) => updateComplaintStatus(complaint._id, e.target.value)}
                            style={{
                              padding: "8px",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                              fontSize: "12px"
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Quick preview of media */}
                    <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                      {complaint.imageUrl && (
                        <img
                          src={complaint.imageUrl}
                          alt="Complaint"
                          onClick={() => window.open(complaint.imageUrl, '_blank')}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = "scale(1.1)";
                            e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = "scale(1)";
                            e.target.style.boxShadow = "none";
                          }}
                          title="Click to view full size"
                        />
                      )}
                      {complaint.audioUrl && (
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          <FontAwesomeIcon icon={faMicrophone} style={{ marginRight: "5px" }} />Audio message available
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "50px",
                color: "#666",
                fontSize: "18px"
              }}>
                {getStatusIcon(activeTab)} <span style={{ marginLeft: "10px" }}>
                  {priorityFilter !== "all" ? 
                    `No ${activeTab.replace("_", " ")} complaints found with ${priorityFilter} priority` :
                    `No ${activeTab.replace("_", " ")} complaints found`
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px",
          boxSizing: "border-box"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "30px",
            maxWidth: "700px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            position: "relative"
          }}>
            <button
              onClick={() => setSelectedComplaint(null)}
              style={{
                position: "absolute",
                top: "15px",
                right: "20px",
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: "#666"
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <h2 style={{ marginTop: 0, color: "#333" }}>
              <FontAwesomeIcon icon={faFileText} style={{ marginRight: "10px" }} />Complaint Details
            </h2>
            
            <div style={{ marginBottom: "20px" }}>
              <strong>Description:</strong>
              <p style={{ margin: "5px 0", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                {selectedComplaint.description}
              </p>
            </div>

            {selectedComplaint.imageUrl && (
              <div style={{ marginBottom: "20px" }}>
                <strong><FontAwesomeIcon icon={faImage} style={{ marginRight: "8px" }} />Image:</strong>
                <span style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}>
                  (Click to view full size)
                </span>
                <br />
                <img
                  src={selectedComplaint.imageUrl}
                  alt="Complaint"
                  onClick={() => window.open(selectedComplaint.imageUrl, '_blank')}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    objectFit: "contain",
                    marginTop: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "scale(1.02)";
                    e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "scale(1)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            )}

            {selectedComplaint.audioUrl && (
              <div style={{ marginBottom: "20px" }}>
                <strong><FontAwesomeIcon icon={faMicrophone} style={{ marginRight: "8px" }} />Audio Message:</strong><br />
                <audio controls style={{ width: "100%", marginTop: "10px" }}>
                  <source src={selectedComplaint.audioUrl} type="audio/wav" />
                  <source src={selectedComplaint.audioUrl} type="audio/mp3" />
                </audio>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <div style={{ marginBottom: "15px" }}>
                <strong><FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: "8px" }} />Full Address:</strong>
                <p style={{ margin: "5px 0", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px", fontSize: "14px" }}>
                  {selectedComplaint.location?.detailedAddress || selectedComplaint.location?.address || `${selectedComplaint.location?.city}, ${selectedComplaint.location?.state}`}
                </p>
                {selectedComplaint.location?.streetAddress && (
                  <p style={{ margin: "5px 0", fontSize: "12px", color: "#666" }}>
                    <FontAwesomeIcon icon={faHome} style={{ marginRight: "5px" }} />Street: {selectedComplaint.location.streetAddress}
                  </p>
                )}
                {selectedComplaint.location?.sublocality && (
                  <p style={{ margin: "5px 0", fontSize: "12px", color: "#666" }}>
                    <FontAwesomeIcon icon={faCity} style={{ marginRight: "5px" }} />Area: {selectedComplaint.location.sublocality}
                  </p>
                )}
                {selectedComplaint.location?.postalCode && (
                  <p style={{ margin: "5px 0", fontSize: "12px", color: "#666" }}>
                    <FontAwesomeIcon icon={faMailBulk} style={{ marginRight: "5px" }} />Postal Code: {selectedComplaint.location.postalCode}
                  </p>
                )}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
                <div><strong><FontAwesomeIcon icon={faPhone} style={{ marginRight: "5px" }} />Phone:</strong> {selectedComplaint.phone}</div>
                {selectedComplaint.priority && <div><strong><FontAwesomeIcon icon={faBolt} style={{ marginRight: "5px" }} />Priority:</strong> {selectedComplaint.priority}</div>}
                {selectedComplaint.reason && <div><strong><FontAwesomeIcon icon={faQuestionCircle} style={{ marginRight: "5px" }} />Reason:</strong> {selectedComplaint.reason}</div>}
                <div><strong><FontAwesomeIcon icon={faChartBar} style={{ marginRight: "5px" }} />Status:</strong> <span style={{ color: getStatusColor(selectedComplaint.status) }}>{selectedComplaint.status}</span></div>
                <div><strong><FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: "5px" }} />Created:</strong> {new Date(selectedComplaint.createdAt).toLocaleString()}</div>
              </div>
            </div>

            {selectedComplaint.status !== "resolved" && (
              <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
                <strong>Update Status:</strong>
                <div style={{ marginTop: "10px" }}>
                  {["pending", "in_progress", "resolved"].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        updateComplaintStatus(selectedComplaint._id, status);
                        setSelectedComplaint({ ...selectedComplaint, status });
                      }}
                      style={{
                        padding: "8px 16px",
                        margin: "5px",
                        backgroundColor: selectedComplaint.status === status ? getStatusColor(status) : "#fff",
                        color: selectedComplaint.status === status ? "white" : "#333",
                        border: `2px solid ${getStatusColor(status)}`,
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      {getStatusIcon(status)} {status.replace("_", " ").toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;