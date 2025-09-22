import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FilterControls from '../components/FilterControls';
import { useComplaintFilters } from '../components/useComplaintFilters';
import Graph from '../components/Graph';
import AdminMapView from '../components/AdminMapView';
import AdminDeptChatModal from '../components/AdminDeptChatModal';
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
  faImage,
  faComments,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, resolved: 0, total: 0 });
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({}); // Object to track unread messages per department
  const [isUnreadMessagesInitialized, setIsUnreadMessagesInitialized] = useState(false);
  
  // Calculate total unread messages
  const getTotalUnreadCount = useCallback(() => {
    return Object.values(unreadMessages).reduce((total, count) => total + count, 0);
  }, [unreadMessages]);

  // Function to clear unread messages for a specific department
  const markDepartmentAsRead = useCallback((departmentId) => {
    setUnreadMessages(prev => ({
      ...prev,
      [departmentId]: 0
    }));
  }, []);

  // Function to manually refresh unread counts (for testing/debugging)
  const refreshUnreadCounts = useCallback(async () => {
    // In a real app, this would fetch from API
    console.log('Current unread messages:', unreadMessages);
    console.log('Total unread count:', getTotalUnreadCount());
  }, [unreadMessages, getTotalUnreadCount]);

  // Add debug function to window for development (remove in production)
  useEffect(() => {
    // Only add debug functions in development
    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (isDev) {
      window.debugAdminDashboard = {
        refreshUnreadCounts,
        unreadMessages,
        getTotalUnreadCount
      };
    }
    return () => {
      if (isDev && window.debugAdminDashboard) {
        delete window.debugAdminDashboard;
      }
    };
  }, [unreadMessages, refreshUnreadCounts, getTotalUnreadCount]);

  // Initialize unread messages only once when departments are loaded
  useEffect(() => {
    if (departments.length > 0 && !isUnreadMessagesInitialized) {
      // Use consistent mock data based on department ID for predictable results
      const mockUnreadMessages = {};
      departments.forEach((dept, index) => {
        // Use department ID hash to generate consistent unread count
        const hash = dept._id.slice(-1); // Use last character of ID
        const hashNum = parseInt(hash, 16) || 0; // Convert to number
        
        if (index < 2) { // Only first 2 departments have unread messages for demo
          mockUnreadMessages[dept._id] = (hashNum % 4) + 1; // 1-4 messages consistently
        } else {
          mockUnreadMessages[dept._id] = 0;
        }
      });
      setUnreadMessages(mockUnreadMessages);
      setIsUnreadMessagesInitialized(true);
    }
  }, [departments, isUnreadMessagesInitialized]);

  // Simulate periodic message updates (separate effect to avoid interference)
  useEffect(() => {
    if (!isUnreadMessagesInitialized || departments.length === 0) {
      return;
    }
    
    const interval = setInterval(() => {
      if (Math.random() < 0.2) { // 20% chance of new message (reduced frequency)
        const randomDept = departments[Math.floor(Math.random() * departments.length)];
        setUnreadMessages(prev => ({
          ...prev,
          [randomDept._id]: (prev[randomDept._id] || 0) + 1
        }));
      }
    }, 15000); // Check every 15 seconds (less frequent)
    
    return () => clearInterval(interval);
  }, [departments, isUnreadMessagesInitialized]);
  
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
        
        // Calculate stats with additional breakdown
        const allComplaints = data.complaints || [];
        const adminManaged = allComplaints.filter(c => c.canManage);
        const departmentAssigned = allComplaints.filter(c => c.assignmentType === 'department');
        const unassigned = allComplaints.filter(c => c.assignmentType === 'unassigned');
        
        const newStats = {
          pending: allComplaints.filter(c => c.status === "pending").length,
          in_progress: allComplaints.filter(c => c.status === "in_progress").length,
          resolved: allComplaints.filter(c => c.status === "resolved").length,
          total: allComplaints.length,
          adminManaged: adminManaged.length,
          departmentAssigned: departmentAssigned.length,
          unassigned: unassigned.length
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

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/department/all", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setDepartments(data.departments || []);
      } else {
        console.error("Failed to fetch departments:", data.error);
      }
    } catch (error) {
      console.error("Fetch departments error:", error);
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
    fetchDepartments();
  }, [token, navigate, fetchComplaints, fetchDepartments]);

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
          
          {/* Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            {/* Chat Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowChatDropdown(!showChatDropdown)}
                style={{
                  padding: "12px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  transition: "all 0.3s ease",
                  width: "48px",
                  height: "48px"
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#0056b3";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(0,123,255,0.3)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#007bff";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
                title={`Chat with Departments${getTotalUnreadCount() > 0 ? ` (${getTotalUnreadCount()} unread messages)` : ''}`}
              >
                <FontAwesomeIcon icon={faComments} />
                {getTotalUnreadCount() > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    borderRadius: "50%",
                    minWidth: "20px",
                    height: "20px",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    border: "2px solid white",
                    padding: "0 4px",
                    lineHeight: "1"
                  }}>
                    {getTotalUnreadCount()}
                  </span>
                )}
              </button>
              
              {/* Dropdown Menu */}
              {showChatDropdown && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  marginTop: "8px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                  border: "1px solid #e2e8f0",
                  zIndex: 1000,
                  minWidth: "350px",
                  maxHeight: "400px",
                  overflowY: "auto"
                }}>
                  <div style={{
                    padding: "15px 20px",
                    borderBottom: "1px solid #e2e8f0",
                    backgroundColor: "#f8f9fa"
                  }}>
                    <h4 style={{
                      margin: "0",
                      color: "#333",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <FontAwesomeIcon icon={faBuilding} style={{ color: "#007bff" }} />
                      City Departments
                      <span style={{ 
                        fontSize: "12px", 
                        color: "#666", 
                        fontWeight: "normal" 
                      }}>
                        ({departments.length} available)
                      </span>
                    </h4>
                  </div>
                  
                  {departments.length > 0 ? (
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      {departments.map(department => (
                        <div
                          key={department._id}
                          onClick={() => {
                            setSelectedDepartment(department);
                            setShowChatModal(true);
                            setShowChatDropdown(false);
                            // Clear unread count for this department when opening chat
                            markDepartmentAsRead(department._id);
                          }}
                          style={{
                            padding: "15px 20px",
                            borderBottom: "1px solid #f0f0f0",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            position: "relative"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#007bff",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "bold"
                          }}>
                            {department.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h5 style={{ 
                              margin: "0 0 4px 0", 
                              color: "#333", 
                              fontSize: "14px",
                              fontWeight: "600"
                            }}>
                              {department.name}
                              {unreadMessages[department._id] > 0 && (
                                <span style={{
                                  marginLeft: "8px",
                                  backgroundColor: "#dc3545",
                                  color: "white",
                                  borderRadius: "12px",
                                  padding: "2px 6px",
                                  fontSize: "10px",
                                  fontWeight: "bold"
                                }}>
                                  {unreadMessages[department._id]} new
                                </span>
                              )}
                            </h5>
                            <p style={{ 
                              margin: "0", 
                              color: "#666", 
                              fontSize: "12px" 
                            }}>
                              {department.departmentType}
                            </p>
                            {department.contactNumber && (
                              <p style={{ 
                                margin: "2px 0 0 0", 
                                color: "#888", 
                                fontSize: "11px" 
                              }}>
                                <FontAwesomeIcon icon={faPhone} style={{ marginRight: "4px" }} />
                                {department.contactNumber}
                              </p>
                            )}
                          </div>
                          <FontAwesomeIcon 
                            icon={faComments} 
                            style={{ 
                              color: unreadMessages[department._id] > 0 ? "#dc3545" : "#007bff", 
                              fontSize: "16px" 
                            }} 
                          />
                          {unreadMessages[department._id] > 0 && (
                            <div style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              width: "8px",
                              height: "8px",
                              backgroundColor: "#dc3545",
                              borderRadius: "50%",
                              border: "2px solid white"
                            }} />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "#666"
                    }}>
                      <FontAwesomeIcon 
                        icon={faUsers} 
                        style={{ fontSize: "30px", marginBottom: "10px", color: "#ccc" }} 
                      />
                      <p style={{ margin: "0", fontSize: "14px" }}>
                        No departments found in your city
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Click outside handler */}
              {showChatDropdown && (
                <div 
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 999
                  }}
                  onClick={() => setShowChatDropdown(false)}
                />
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
                fontWeight: "bold",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "#c82333";
                e.target.style.transform = "translateY(-1px)";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "#dc3545";
                e.target.style.transform = "translateY(0)";
              }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: "5px" }} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginBottom: "20px"
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
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              <FontAwesomeIcon icon={faChartBar} style={{ marginRight: "5px" }} />Total City Complaints
            </p>
          </div>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: "3px solid #6f42c1"
          }}>
            <h2 style={{ margin: "0", color: "#6f42c1", fontSize: "32px" }}>{stats.unassigned || 0}</h2>
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              <FontAwesomeIcon icon={faQuestionCircle} style={{ marginRight: "5px" }} />Unassigned
            </p>
          </div>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: "3px solid #fd7e14"
          }}>
            <h2 style={{ margin: "0", color: "#fd7e14", fontSize: "32px" }}>{stats.departmentAssigned || 0}</h2>
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              🏢 Department Assigned
            </p>
          </div>
        </div>
        
        {/* Status Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginBottom: "30px"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: "3px solid #ffc107"
          }}>
            <h2 style={{ margin: "0", color: "#ffc107", fontSize: "32px" }}>{stats.pending}</h2>
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              <FontAwesomeIcon icon={faClock} style={{ marginRight: "5px" }} />Pending
            </p>
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
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              <FontAwesomeIcon icon={faSpinner} style={{ marginRight: "5px" }} />In Progress
            </p>
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
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: "5px" }} />Resolved
            </p>
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

        {/* Admin City Overview Notice */}
        <div style={{
          backgroundColor: "#e3f2fd",
          padding: "15px 20px",
          marginBottom: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          border: "2px solid #007bff"
        }}>
          <p style={{ margin: 0, color: "#333", fontSize: "14px" }}>
            <FontAwesomeIcon icon={faBuilding} style={{ marginRight: "8px", color: "#007bff" }} />
            <strong>City Admin Overview:</strong> You can VIEW all {stats.total} complaints from {adminInfo?.city} 
            but can only MANAGE status of {stats.unassigned || 0} unassigned complaints. 
            Department-assigned complaints ({stats.departmentAssigned || 0}) are managed by respective departments.
          </p>
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
                      backgroundColor: complaint.canManage ? "#f9f9f9" : "#f8f9fa",
                      borderLeft: `5px solid ${getStatusColor(complaint.status)}`,
                      opacity: complaint.canManage ? 1 : 0.85,
                      position: "relative"
                    }}
                  >
                    {/* Assignment Type Indicator */}
                    <div style={{
                      position: "absolute",
                      top: "10px",
                      right: "15px",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      backgroundColor: complaint.assignmentType === 'unassigned' ? '#f3e5f5' : '#fff3e0',
                      color: complaint.assignmentType === 'unassigned' ? '#7b1fa2' : '#f57c00',
                      border: `1px solid ${complaint.assignmentType === 'unassigned' ? '#7b1fa2' : '#f57c00'}`
                    }}>
                      {complaint.assignmentType === 'department' ? 
                        `🏢 ${complaint.assignedDepartment?.name || 'Assigned'}` : 
                        '❓ Unassigned'}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px", marginRight: "100px" }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                          <FontAwesomeIcon icon={faFileText} style={{ marginRight: "8px" }} />
                          {complaint.description.substring(0, 80)}...
                          {!complaint.canManage && (
                            <span style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}>
                              (View Only)
                            </span>
                          )}
                        </h4>
                        
                        {/* Department Assignment Info */}
                        {complaint.assignmentType === 'department' && complaint.assignedDepartment && (
                          <div style={{ 
                            margin: "8px 0", 
                            padding: "6px 10px", 
                            backgroundColor: "#fff3e0", 
                            borderRadius: "4px",
                            border: "1px solid #ffcc02",
                            fontSize: "13px"
                          }}>
                            <FontAwesomeIcon icon={faBuilding} style={{ marginRight: "5px", color: "#f57c00" }} />
                            <strong>Assigned to:</strong> {complaint.assignedDepartment.name || 'Department'}
                          </div>
                        )}
                        
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
                            <div style={{ margin: "4px 0", padding: "4px 8px", borderRadius: "4px", backgroundColor: complaint.priority === 'High' ? '#fee2e2' : complaint.priority === 'Medium' ? '#fef3c7' : '#dcfce7' }}>
                              <FontAwesomeIcon icon={faBolt} style={{ marginRight: "5px", color: complaint.priority === 'High' ? '#dc2626' : complaint.priority === 'Medium' ? '#f59e0b' : '#10b981' }} />
                              <strong>Priority:</strong> {complaint.priority === 'High' ? '🚨' : complaint.priority === 'Medium' ? '⚠️' : '📝'} {complaint.priority}
                              {complaint.priorityReason && (
                                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                                  {complaint.priorityReason}
                                </div>
                              )}
                            </div>
                          }
                          <p style={{ margin: 0 }}>
                            <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: "5px" }} />
                            {new Date(complaint.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "30px" }}>
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
                        
                        {complaint.status !== "resolved" && complaint.canManage && (
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
                
                {selectedComplaint.priority && (
                  <div style={{ 
                    gridColumn: "1 / -1",
                    padding: "10px 12px", 
                    borderRadius: "8px", 
                    backgroundColor: selectedComplaint.priority === 'High' ? '#fee2e2' : selectedComplaint.priority === 'Medium' ? '#fef3c7' : '#dcfce7',
                    border: `1px solid ${selectedComplaint.priority === 'High' ? '#fca5a5' : selectedComplaint.priority === 'Medium' ? '#fde68a' : '#bbf7d0'}`
                  }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "6px" }}>
                      <FontAwesomeIcon 
                        icon={faBolt} 
                        style={{ 
                          marginRight: "8px", 
                          color: selectedComplaint.priority === 'High' ? '#dc2626' : selectedComplaint.priority === 'Medium' ? '#f59e0b' : '#10b981' 
                        }} 
                      />
                      <strong>Priority: {selectedComplaint.priority === 'High' ? '🚨' : selectedComplaint.priority === 'Medium' ? '⚠️' : '📝'} {selectedComplaint.priority}</strong>
                    </div>
                    {selectedComplaint.priorityReason && (
                      <div style={{ fontSize: "14px", color: "#374151", marginBottom: "4px" }}>
                        <strong>Reason:</strong> {selectedComplaint.priorityReason}
                      </div>
                    )}
                    {selectedComplaint.areaName && (
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        <strong>Area:</strong> {selectedComplaint.areaName}
                      </div>
                    )}
                    {selectedComplaint.highPriorityPlace && (
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>
                        <strong>Near:</strong> {selectedComplaint.highPriorityPlace}
                      </div>
                    )}
                  </div>
                )}
                
                <div><strong><FontAwesomeIcon icon={faChartBar} style={{ marginRight: "5px" }} />Status:</strong> <span style={{ color: getStatusColor(selectedComplaint.status) }}>{selectedComplaint.status}</span></div>
                <div><strong><FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: "5px" }} />Created:</strong> {new Date(selectedComplaint.createdAt).toLocaleString()}</div>
              </div>
            </div>

            {/* Assignment Information */}
            <div style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
              <strong>Assignment Information:</strong>
              <div style={{ marginTop: "8px", fontSize: "14px" }}>
                {selectedComplaint.assignmentType === 'department' ? (
                  <span style={{ color: "#f57c00" }}>
                    🏢 <strong>Department Assigned:</strong> This complaint is managed by {selectedComplaint.assignedDepartment?.name || 'a department'}. You can view details but cannot change status.
                  </span>
                ) : (
                  <span style={{ color: "#7b1fa2" }}>
                    ❓ <strong>Unassigned:</strong> This complaint hasn't been assigned to any department yet. You can update its status.
                  </span>
                )}
              </div>
            </div>

            {selectedComplaint.status !== "resolved" && selectedComplaint.canManage && (
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
            
            {selectedComplaint.status !== "resolved" && !selectedComplaint.canManage && (
              <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3cd", borderRadius: "6px", border: "1px solid #ffeeba" }}>
                <span style={{ color: "#856404" }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: "8px" }} />
                  <strong>Note:</strong> This complaint is managed by a department. Only they can update its status.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin-Department Chat Modal */}
      {showChatModal && selectedDepartment && (
        <AdminDeptChatModal
          isOpen={showChatModal}
          department={selectedDepartment}
          onClose={() => {
            setShowChatModal(false);
            setSelectedDepartment(null);
          }}
        />
      )}
    </div>
  );
}

export default AdminDashboard;