import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function CompleteProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: "",
    city: "",
    state: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  // Validation function
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone)) newErrors.phone = "Enter valid 10-digit phone number";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.pincode.trim()) newErrors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(form.pincode)) newErrors.pincode = "Enter valid 6-digit pincode";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.state.trim()) newErrors.state = "State is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    setForm({ ...form, [name]: value });
    
    // Auto-fetch city & state for valid pincode
    if (name === "pincode" && /^\d{6}$/.test(value)) {
      fetchPincodeData(value);
    } else if (name === "pincode") {
      // Clear city and state if pincode is invalid
      setForm(prev => ({ ...prev, city: "", state: "" }));
    }
  };

  const fetchPincodeData = async (pincode) => {
    setPincodeLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      if (data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        setForm(prev => ({
          ...prev,
          city: data[0].PostOffice[0].District || "",
          state: data[0].PostOffice[0].State || ""
        }));
        setMessage("Location details fetched successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setForm(prev => ({ ...prev, city: "", state: "" }));
        setErrors(prev => ({ ...prev, pincode: "Invalid pincode" }));
      }
    } catch (error) {
      console.error("Error fetching pincode data:", error);
      setForm(prev => ({ ...prev, city: "", state: "" }));
      setErrors(prev => ({ ...prev, pincode: "Failed to fetch location data" }));
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setMessage("Please fix the errors below");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch("http://localhost:5000/user/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save profile");
      }

      setMessage("Profile saved successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
      
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage(error.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: "8px",
    margin: "5px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    width: "200px"
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: "#ff0000"
  };

  const buttonStyle = {
    padding: "10px 20px",
    margin: "10px",
    border: "1px solid #007bff",
    borderRadius: "4px",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer"
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#ccc",
    borderColor: "#ccc",
    cursor: "not-allowed"
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Complete Your Profile</h2>
      
      {message && (
        <div style={{ 
          color: message.includes('success') ? 'green' : 'red',
          margin: "10px 0"
        }}>
          {message}
        </div>
      )}

      <input
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        style={errors.name ? errorInputStyle : inputStyle}
      />
      {errors.name && <div style={{ color: "red", fontSize: "12px" }}>{errors.name}</div>}
      <br />

      <input
        name="phone"
        placeholder="Phone"
        value={form.phone}
        onChange={handleChange}
        maxLength="10"
        style={errors.phone ? errorInputStyle : inputStyle}
      />
      {errors.phone && <div style={{ color: "red", fontSize: "12px" }}>{errors.phone}</div>}
      <br />

      <input
        name="address"
        placeholder="Address"
        value={form.address}
        onChange={handleChange}
        style={errors.address ? errorInputStyle : inputStyle}
      />
      {errors.address && <div style={{ color: "red", fontSize: "12px" }}>{errors.address}</div>}
      <br />

      <input
        name="pincode"
        placeholder="Pincode"
        value={form.pincode}
        onChange={handleChange}
        maxLength="6"
        style={errors.pincode ? errorInputStyle : inputStyle}
      />
      {pincodeLoading && <span style={{ color: "blue" }}> Loading...</span>}
      {errors.pincode && <div style={{ color: "red", fontSize: "12px" }}>{errors.pincode}</div>}
      <br />

      <input
        name="city"
        placeholder="City"
        value={form.city}
        readOnly
        style={{...inputStyle, backgroundColor: "#f5f5f5"}}
      />
      {errors.city && <div style={{ color: "red", fontSize: "12px" }}>{errors.city}</div>}
      <br />

      <input
        name="state"
        placeholder="State"
        value={form.state}
        readOnly
        style={{...inputStyle, backgroundColor: "#f5f5f5"}}
      />
      {errors.state && <div style={{ color: "red", fontSize: "12px" }}>{errors.state}</div>}
      <br />

      <button 
        onClick={handleSubmit}
        disabled={loading || pincodeLoading}
        style={loading || pincodeLoading ? disabledButtonStyle : buttonStyle}
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}

export default CompleteProfile;