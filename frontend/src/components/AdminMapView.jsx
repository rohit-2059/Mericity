import React, { useCallback, useEffect } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const render = (status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div style={{
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f9fa"
        }}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: "10px" }} />
          Loading map...
        </div>
      );
    case Status.FAILURE:
      return (
        <div style={{
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffebee",
          color: "#c62828",
          flexDirection: "column"
        }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginBottom: "10px", fontSize: "24px" }} />
          Error loading Google Maps
        </div>
      );
    case Status.SUCCESS:
      return null;
  }
};

const AdminMapComponent = ({ complaints }) => {
  const mapRef = useCallback((node) => {
    if (node) {
      // Filter complaints with valid coordinates
      const validComplaints = complaints.filter(c => 
        c.location && 
        c.location.lat && 
        c.location.lng && 
        !isNaN(c.location.lat) && 
        !isNaN(c.location.lng)
      );
      
      // Default center (you can change this to your admin's city center)
      let mapCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi as default
      let mapZoom = 10;
      
      // If there are valid complaints, center the map on them
      if (validComplaints.length > 0) {
        const avgLat = validComplaints.reduce((sum, c) => sum + c.location.lat, 0) / validComplaints.length;
        const avgLng = validComplaints.reduce((sum, c) => sum + c.location.lng, 0) / validComplaints.length;
        mapCenter = { lat: avgLat, lng: avgLng };
        mapZoom = validComplaints.length === 1 ? 15 : 12;
      }

      const map = new window.google.maps.Map(node, {
        center: mapCenter,
        zoom: mapZoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }]
          }
        ]
      });

      // Create markers for each complaint (only if there are valid complaints)
      if (validComplaints.length > 0) {
        validComplaints.forEach((complaint, index) => {
        // Determine marker color based on status and priority
        let markerColor = "#6c757d"; // default gray
        
        switch (complaint.status) {
          case "pending":
            markerColor = complaint.priority === "High" ? "#dc3545" : 
                         complaint.priority === "Medium" ? "#fd7e14" : 
                         complaint.priority === "Low" ? "#ffc107" : "#ffc107";
            break;
          case "in_progress":
            markerColor = "#17a2b8";
            break;
          case "resolved":
            markerColor = "#28a745";
            break;
        }
        
        const marker = new window.google.maps.Marker({
          position: { lat: complaint.location.lat, lng: complaint.location.lng },
          map,
          title: `${complaint.status.toUpperCase()}: ${complaint.description.substring(0, 50)}...`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: markerColor,
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          label: {
            text: complaint.status === "pending" ? "!" : 
                  complaint.status === "in_progress" ? "⏳" : 
                  complaint.status === "resolved" ? "✓" : "?",
            color: "white",
            fontSize: "12px",
            fontWeight: "bold"
          },
          animation: window.google.maps.Animation.DROP
        });

        // Create info window content
        const infoWindowContent = `
          <div style="max-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
              <h4 style="margin: 0; color: #333; font-size: 14px;">
                Complaint #${index + 1}
              </h4>
              <span style="
                display: inline-block; 
                padding: 2px 8px; 
                border-radius: 12px; 
                font-size: 10px; 
                font-weight: bold; 
                color: white; 
                background-color: ${markerColor};
                margin-top: 4px;
              ">
                ${complaint.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <div style="font-size: 12px; line-height: 1.4;">
              <p style="margin: 0 0 6px 0;"><strong>Description:</strong><br/>${complaint.description.substring(0, 80)}${complaint.description.length > 80 ? '...' : ''}</p>
              
              <p style="margin: 0 0 6px 0;"><strong>📍 Location:</strong><br/>${complaint.location?.detailedAddress || complaint.location?.address || `${complaint.location?.city}, ${complaint.location?.state}`}</p>
              
              <p style="margin: 0 0 6px 0;"><strong>📞 Phone:</strong> ${complaint.phone}</p>
              
              ${complaint.priority ? `<p style="margin: 0 0 6px 0;"><strong>⚡ Priority:</strong> ${complaint.priority}</p>` : ''}
              
              <p style="margin: 0 0 8px 0; color: #666;"><strong>📅 Created:</strong> ${new Date(complaint.createdAt).toLocaleDateString()}</p>
              
              <button 
                onclick="window.adminSelectComplaint('${complaint._id}')" 
                style="
                  width: 100%; 
                  padding: 6px 12px; 
                  background: #007bff; 
                  color: white; 
                  border: none; 
                  border-radius: 4px; 
                  cursor: pointer; 
                  font-size: 11px;
                  font-weight: bold;
                "
              >
                View Full Details
              </button>
            </div>
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoWindowContent
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
        });

        // Add bounds to fit all markers
        if (validComplaints.length > 1) {
          const bounds = new window.google.maps.LatLngBounds();
          validComplaints.forEach(complaint => {
            bounds.extend(new window.google.maps.LatLng(complaint.location.lat, complaint.location.lng));
          });
          map.fitBounds(bounds);
          
          // Ensure minimum zoom level
          const listener = window.google.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom() > 15) map.setZoom(15);
            window.google.maps.event.removeListener(listener);
          });
        }
      }
    }
  }, [complaints]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: "400px", 
        width: "100%", 
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid #e0e0e0",
        background: "#f5f5f5"
      }} 
    />
  );
};

const AdminMapView = ({ complaints, onComplaintSelect }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Filter to show only pending and in-progress complaints
  const filteredComplaints = complaints.filter(c => 
    c.status === "pending" || c.status === "in_progress"
  );
  
  // Make complaint selection available globally for info window
  useEffect(() => {
    window.adminSelectComplaint = (complaintId) => {
      const complaint = filteredComplaints.find(c => c._id === complaintId);
      if (complaint && onComplaintSelect) {
        onComplaintSelect(complaint);
      }
    };

    return () => {
      delete window.adminSelectComplaint;
    };
  }, [filteredComplaints, onComplaintSelect]);


  
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <div style={{ 
        height: "400px",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        backgroundColor: "#f8f9fa",
        border: "1px solid #ddd",
        borderRadius: "8px",
        flexDirection: "column",
        gap: "10px"
      }}>
        <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: "24px", color: "#dc3545" }} />
        <h4 style={{ margin: 0, color: "#333" }}>Map Unavailable</h4>
        <p style={{ margin: 0, color: "#666", textAlign: "center", fontSize: "14px" }}>
          Please add your Google Maps API key to .env file<br/>
          to view complaints on the map
        </p>
      </div>
    );
  }



  return (
    <div>
      {/* Map Header */}
      <div style={{ 
        padding: "15px", 
        backgroundColor: "#f8f9fa", 
        borderBottom: "1px solid #ddd",
        borderRadius: "8px 8px 0 0"
      }}>
        <h4 style={{ margin: "0", color: "#333", display: "flex", alignItems: "center" }}>
          <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: "8px", color: "#007bff" }} />
          Active Complaints Map
        </h4>
        {filteredComplaints.length === 0 && (
          <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: "#dc3545", fontWeight: "500" }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: "5px" }} />
            No active complaints found in your district
          </p>
        )}
      </div>
      
      {/* Map */}
      <Wrapper apiKey={apiKey} render={render}>
        <AdminMapComponent 
          complaints={filteredComplaints}
        />
      </Wrapper>

      {/* Map Legend */}
      <div style={{ 
        padding: "12px 15px", 
        backgroundColor: "#f8f9fa", 
        borderTop: "1px solid #ddd",
        borderRadius: "0 0 8px 8px",
        fontSize: "11px"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          <div>
            <strong style={{ display: "block", marginBottom: "5px", color: "#333" }}>Active Status Markers:</strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ 
                  width: "12px", height: "12px", backgroundColor: "#ffc107", 
                  borderRadius: "50%", border: "1px solid white"
                }}></div>
                <span>Pending (!)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ 
                  width: "12px", height: "12px", backgroundColor: "#17a2b8", 
                  borderRadius: "50%", border: "1px solid white"
                }}></div>
                <span>In Progress (⏳)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ 
                  width: "12px", height: "12px", backgroundColor: "#dc3545", 
                  borderRadius: "50%", border: "1px solid white"
                }}></div>
                <span>High Priority (!)</span>
              </div>
            </div>
          </div>
          <div style={{ color: "#666", alignSelf: "end" }}>
            <strong>Instructions:</strong> Click markers to view details • High priority pending complaints shown in red • Only active complaints displayed
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMapView;
