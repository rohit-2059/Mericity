import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faSortAmountDown, faSortAmountUp } from '@fortawesome/free-solid-svg-icons';

const FilterControls = ({ 
  dateFilter, 
  setDateFilter, 
  priorityFilter, 
  setPriorityFilter, 
  filteredCount 
}) => {
  return (
    <div style={{ 
      padding: "15px 20px", 
      borderBottom: "1px solid #eee", 
      backgroundColor: "#f8f9fa",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      flexWrap: "wrap"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <FontAwesomeIcon icon={faFilter} style={{ color: "#666" }} />
        <span style={{ fontWeight: "500", color: "#333" }}>Filters:</span>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label style={{ fontSize: "14px", color: "#666" }}>Date:</label>
        <FontAwesomeIcon 
          icon={dateFilter === "latest" ? faSortAmountDown : faSortAmountUp} 
          style={{ color: "#666", fontSize: "12px" }} 
        />
        <select 
          value={dateFilter} 
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            padding: "5px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          <option value="latest">Latest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <label style={{ fontSize: "14px", color: "#666" }}>Priority:</label>
        <select 
          value={priorityFilter} 
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{
            padding: "5px 10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          <option value="all">All Priorities</option>
          <option value="high">🔴 High Priority</option>
          <option value="medium">🟡 Medium Priority</option>
          <option value="low">🟢 Low Priority</option>
        </select>
      </div>
      
      <div style={{ 
        fontSize: "12px", 
        color: "#666", 
        marginLeft: "auto",
        padding: "5px 10px",
        backgroundColor: "#e9ecef",
        borderRadius: "4px",
        border: "1px solid #ced4da"
      }}>
        Showing: <strong>{filteredCount}</strong> complaint(s)
      </div>
      
      {(priorityFilter !== "all" || dateFilter !== "latest") && (
        <button
          onClick={() => {
            setDateFilter("latest");
            setPriorityFilter("all");
          }}
          style={{
            padding: "5px 10px",
            fontSize: "12px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default FilterControls;