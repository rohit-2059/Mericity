import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faCalendarAlt, faFilter } from '@fortawesome/free-solid-svg-icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function Graph({ complaints }) {
  const [timeRange, setTimeRange] = useState("30"); // days
  const [chartType, setChartType] = useState("line"); // line or bar

  // Process complaints data for chart
  const chartData = useMemo(() => {
    if (!complaints || complaints.length === 0) return null;

    const days = parseInt(timeRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Filter complaints within the time range
    const filteredComplaints = complaints.filter(complaint => {
      const complaintDate = new Date(complaint.createdAt);
      return complaintDate >= startDate && complaintDate <= endDate;
    });

    // Create date labels for the last N days
    const dateLabels = [];
    const complaintCounts = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      dateLabels.push(date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }));

      // Count complaints for this date
      const count = filteredComplaints.filter(complaint => {
        const complaintDate = new Date(complaint.createdAt);
        return complaintDate.toISOString().split('T')[0] === dateString;
      }).length;

      complaintCounts.push(count);
    }

    return {
      labels: dateLabels,
      datasets: [
        {
          label: 'Daily Complaints',
          data: complaintCounts,
          borderColor: '#3b82f6',
          backgroundColor: chartType === 'bar' ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: chartType === 'line',
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [complaints, timeRange, chartType]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#4a5568',
          font: {
            size: 12,
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          }
        }
      },
      title: {
        display: true,
        text: `Complaints Over Last ${timeRange} Days`,
        color: '#04a5568',
        font: {
          size: 14,
          weight: 'bold',
          family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        },
        padding: {
          bottom: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return `Date: ${context[0].label}`;
          },
          label: function(context) {
            return `Complaints: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#4a5568',
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#4a5568',
          stepSize: 1,
          font: {
            size: 11
          },
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        },
        title: {
          display: true,
          text: 'Number of Complaints',
          color: '#4a5568',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  // Calculate total complaints in selected range
  const totalInRange = chartData ? chartData.datasets[0].data.reduce((sum, count) => sum + count, 0) : 0;
  const averagePerDay = totalInRange > 0 ? (totalInRange / parseInt(timeRange)).toFixed(1) : 0;
  const maxInDay = chartData ? Math.max(...chartData.datasets[0].data) : 0;

  if (!chartData) {
    return (
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "30px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        textAlign: "center",
        color: "#666"
      }}>
        <FontAwesomeIcon icon={faChartLine} size="3x" style={{ marginBottom: "20px", color: "#ddd" }} />
        <h3 style={{ margin: "0", color: "#999" }}>No Data Available</h3>
        <p style={{ margin: "10px 0 0 0" }}>No complaints data to display in the chart.</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "18px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      marginBottom: "0",
      border: "1px solid #e2e8f0",
      height: "410px",
      overflow: "hidden"
    }}>
      {/* Header with controls */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "12px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <h3 style={{ 
          margin: "0", 
          color: "#2d3748", 
          fontSize: "18px",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <FontAwesomeIcon icon={faChartLine} style={{ color: "#3b82f6" }} />
          Complaints Analytics
        </h3>
        
        <div style={{ 
          display: "flex", 
          gap: "15px", 
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          {/* Chart Type Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FontAwesomeIcon icon={faFilter} style={{ color: "#718096", fontSize: "14px" }} />
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              style={{
                padding: "6px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "white",
                color: "#2d3748",
                cursor: "pointer"
              }}
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>

          {/* Time Range Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FontAwesomeIcon icon={faCalendarAlt} style={{ color: "#718096", fontSize: "14px" }} />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                padding: "6px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "white",
                color: "#2d3748",
                cursor: "pointer"
              }}
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 2 Weeks</option>
              <option value="30">Last 30 Days</option>
              <option value="60">Last 2 Months</option>
              <option value="90">Last 3 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "12px",
        marginBottom: "15px"
      }}>
        <div style={{
          backgroundColor: "#f7fafc",
          padding: "12px",
          borderRadius: "6px",
          textAlign: "center",
          border: "1px solid #e2e8f0"
        }}>
          <h4 style={{ margin: "0", fontSize: "18px", color: "#3b82f6" }}>{totalInRange}</h4>
          <p style={{ margin: "3px 0 0 0", fontSize: "11px", color: "#718096" }}>Total Complaints</p>
        </div>
        <div style={{
          backgroundColor: "#f7fafc",
          padding: "12px",
          borderRadius: "6px",
          textAlign: "center",
          border: "1px solid #e2e8f0"
        }}>
          <h4 style={{ margin: "0", fontSize: "18px", color: "#28a745" }}>{averagePerDay}</h4>
          <p style={{ margin: "3px 0 0 0", fontSize: "11px", color: "#718096" }}>Avg. Per Day</p>
        </div>
        <div style={{
          backgroundColor: "#f7fafc",
          padding: "12px",
          borderRadius: "6px",
          textAlign: "center",
          border: "1px solid #e2e8f0"
        }}>
          <h4 style={{ margin: "0", fontSize: "18px", color: "#ffc107" }}>{maxInDay}</h4>
          <p style={{ margin: "3px 0 0 0", fontSize: "11px", color: "#718096" }}>Peak Day</p>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ 
        height: "270px", 
        position: "relative",
        backgroundColor: "#fafbfc",
        borderRadius: "8px",
        padding: "15px"
      }}>
        {chartType === 'line' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>

      {/* Additional Info */}
      <div style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#f8f9fa",
        borderRadius: "6px",
        border: "1px solid #e9ecef"
      }}>
        <p style={{
          margin: "0",
          fontSize: "13px",
          color: "#666",
          textAlign: "center"
        }}>
          📊 Chart shows complaint submissions over time • 
          Data is synchronized with your local timezone • 
          Switch between line and bar charts for different views
        </p>
      </div>
    </div>
  );
}

export default Graph;