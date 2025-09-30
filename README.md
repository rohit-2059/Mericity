# 🏛️ MeriCity - Civic Sense Crowdsourced Issue Reporting# 🏛️ Municipal Complaint Management System



**Live Application:** [www.mericity.app](https://www.mericity.app)A comprehensive web application for citizens to submit municipal complaints with location tracking, file uploads, and admin management capabilities. Features Google OAuth authentication, real-time location services, and a robust admin dashboard for complaint management.



MeriCity is a comprehensive municipal complaint management system that empowers citizens to report civic issues while providing government departments with intelligent tools for efficient resolution. Built for Smart India Hackathon (SIH), this platform bridges the gap between citizens and municipal authorities through technology.![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

![Google Maps](https://img.shields.io/badge/Google_Maps-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)## 📋 Table of Contents

![AI](https://img.shields.io/badge/Google_Vision_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

- [Features](#-features)

## ✨ Core Features- [Tech Stack](#-tech-stack)

- [Project Structure](#-project-structure)

### 🔐 Smart Authentication System- [Installation](#-installation)

- **Google OAuth 2.0 Integration** - Seamless login with Google accounts- [Configuration](#-configuration)

- **Phone Verification System** - OTP-based verification for enhanced security- [Usage](#-usage)

- **Multi-level Access Control** - Citizen, Admin, and Department dashboards- [API Endpoints](#-api-endpoints)

- **Profile Management** - Complete user profiles with verification status- [File Structure Explained](#-file-structure-explained)

- [Contributing](#-contributing)

### 📸 Advanced Complaint Submission- [License](#-license)

- **Photo Upload with Automatic GPS Tagging** - Location-embedded image uploads

- **AI-Powered Description Generation** - Google Vision AI analyzes images and suggests professional descriptions## ✨ Features

- **Multi-Modal Input System** - Support for text, voice, and image complaints

- **Smart Location System** - Users can verify and manually adjust locations for accuracy### 🔐 User Authentication

- **Priority Classification** - Intelligent priority system based on urgency and volume

- **Google OAuth 2.0 Integration** - Secure login with Google accounts

### 🗺️ Comprehensive Community Mapping- **Manual Registration/Login** - Traditional email/password authentication

- **Live Interactive Map** - Real-time visualization of all reported issues- **Profile Management** - Complete user profiles with personal information

- **National Scope Coverage** - City-agnostic platform with advanced filtering- **JWT Token Authentication** - Secure API access with JSON Web Tokens

- **Heat Map Analytics** - Visual representation of complaint density

- **Location-Based Filtering** - Filter complaints by area, ward, or custom boundaries### 📝 Complaint Management



### 🎯 Intelligent Department Routing- **Location-Based Complaints** - GPS coordinates with Google Maps integration

- **Smart Department Assignment** - AI-powered routing to correct departments- **File Upload System** - Support for images and audio recordings

- **State-Specific Customization** - Complete department database for each state- **Priority Levels** - High/Medium/Low priority classification

- **Automated Workflow** - Seamless complaint escalation and tracking- **Real-time Status Updates** - Track complaint progress (Pending → In Progress → Resolved)

- **Performance Metrics** - Department efficiency monitoring- **Interactive Maps** - Drag-and-drop location selection



### 💬 Advanced Communication System### 👨‍💼 Admin Dashboard

- **Real-time Chat Interface** - Direct communication between citizens and departments

- **Multi-participant Conversations** - Citizens, admins, and departments in single thread- **City-Based Assignment** - Admins manage complaints in their assigned cities

- **File Sharing** - Share additional evidence and updates- **Status Management** - Update complaint status and add responses

- **Notification System** - Real-time updates via web notifications- **Analytics Dashboard** - Visual charts and statistics

- **Filter & Search** - Filter by date, priority, status, and location

### 🏆 Gamified Engagement System- **Bulk Operations** - Manage multiple complaints efficiently

- **Points & Rewards Program** - Citizens earn points for reporting genuine issues

- **Leaderboards** - Community engagement through friendly competition### 🗺️ Location Services

- **Badge System** - Recognition for active civic participation

- **Redemption Store** - Exchange points for rewards and benefits- **Reverse Geocoding** - Convert coordinates to detailed addresses

- **Interactive Maps** - Google Maps integration with draggable markers

### 📊 Three-Tier Dashboard System- **Address Enhancement** - Detailed location information including street, city, state

- **Citizen Dashboard** - Personal complaint tracking and community engagement- **Location Validation** - Automatic city/state assignment for admin routing

- **Admin Control Center** - City-wide oversight with performance analytics

- **Department Dashboard** - Specialized tools for issue resolution and workflow management## 🛠️ Tech Stack



### 🔍 Advanced Admin Features### Backend

- **Performance Oversight** - Real-time monitoring of department efficiency

- **Inter-department Communication** - Seamless coordination between departments- **Node.js** - JavaScript runtime environment

- **Analytics & Reporting** - Comprehensive insights and data visualization- **Express.js** - Web application framework

- **Bulk Operations** - Efficient management of multiple complaints- **MongoDB** - NoSQL database with Mongoose ODM

- **Warning System** - Automated alerts for delayed responses- **JWT** - JSON Web Tokens for authentication

- **Bcrypt.js** - Password hashing and encryption

### 🚨 Smart Issue Management- **Multer** - File upload middleware

- **Automatic Priority Detection** - AI analyzes complaint content for urgency- **Google Auth Library** - OAuth 2.0 implementation

- **Duplicate Detection** - Prevents spam and identifies recurring issues- **Google Maps API** - Geocoding and reverse geocoding services

- **Status Tracking** - Real-time updates from submission to resolution

- **Escalation Protocols** - Automated escalation for overdue complaints### Frontend



## 🛠️ Tech Stack- **React 19** - Modern JavaScript library for building user interfaces

- **React Router DOM** - Client-side routing

### Backend- **Vite** - Fast build tool and development server

- **Node.js** - JavaScript runtime environment- **TailwindCSS** - Utility-first CSS framework

- **Express.js** - Web application framework- **FontAwesome** - Icon library

- **MongoDB** - NoSQL database with Mongoose ODM- **Chart.js** - Interactive charts and graphs

- **JWT** - JSON Web Tokens for authentication- **Axios** - HTTP client for API requests

- **Bcrypt.js** - Password hashing and encryption- **Google OAuth React** - Google authentication component

- **Multer** - File upload middleware

- **Google Vision AI** - Image analysis and OCR## 🏗️ Project Structure

- **Google Maps API** - Geocoding and location services

- **Twilio** - SMS and phone verification```

- **Socket.io** - Real-time communicationGoogleAuth+Mongo/

├── 📁 backend/                     # Node.js/Express server

### Frontend│   ├── 📁 middleware/

- **React 19** - Modern JavaScript library│   │   └── auth.js                 # JWT authentication middleware

- **React Router DOM** - Client-side routing│   ├── 📁 models/                  # MongoDB schemas

- **Vite** - Fast build tool and development server│   │   ├── Admin.js                # Admin user model

- **TailwindCSS** - Utility-first CSS framework│   │   ├── Complaint.js            # Complaint data model

- **Chart.js** - Interactive charts and analytics│   │   └── User.js                 # User account model

- **Axios** - HTTP client for API requests│   ├── 📁 routes/                  # API route handlers

- **Google OAuth React** - Authentication component│   │   ├── admin.js                # Admin management endpoints

- **Socket.io Client** - Real-time features│   │   ├── auth.js                 # Authentication endpoints

│   │   ├── complaints.js           # Complaint CRUD operations

### AI & External Services│   │   └── user.js                 # User profile endpoints

- **Google Vision API** - Image analysis and text extraction│   ├── 📁 services/

- **Google Geocoding API** - Address resolution and location services│   │   └── geocodingService.js     # Google Maps geocoding service

- **Twilio API** - SMS notifications and phone verification│   ├── 📁 uploads/                 # File storage directory

- **Google OAuth 2.0** - Secure authentication│   ├── .env                        # Environment variables

│   ├── package.json                # Node.js dependencies

## 📡 API Endpoints│   └── server.js                   # Express server entry point

│

### Authentication├── 📁 frontend/                    # React application

```│   ├── 📁 public/                  # Static assets

POST /auth/google              # Google OAuth login│   ├── 📁 src/

POST /auth/register           # Manual registration│   │   ├── 📁 assets/              # Images and static files

POST /auth/login             # Email/password login│   │   ├── 📁 components/          # Reusable React components

POST /auth/verify-phone      # Phone number verification│   │   │   ├── AdminMapView.jsx    # Admin map interface

POST /auth/verify-otp        # OTP verification│   │   │   ├── ComplaintForm.jsx   # Complaint submission form

```│   │   │   ├── ExploreComplaints.jsx # Public complaint viewer

│   │   │   ├── FilterControls.jsx  # Filter and search controls

### User Management│   │   │   ├── GoogleMap.jsx       # Google Maps component

```│   │   │   ├── Graph.jsx           # Chart visualizations

GET  /user/me                # Get user profile│   │   │   └── useComplaintFilters.js # Custom filtering hook

PUT  /user/me                # Update profile│   │   ├── 📁 pages/               # Application pages

POST /user/complete          # Complete profile setup│   │   │   ├── AdminDashboard.jsx  # Admin control panel

GET  /user/points           # Get user reward points│   │   │   ├── AdminLogin.jsx      # Admin authentication

```│   │   │   ├── CompleteProfile.jsx # User profile completion

│   │   │   ├── Dashboard.jsx       # User dashboard

### Complaints│   │   │   └── Login.jsx           # User authentication

```│   │   ├── App.jsx                 # Main application component

GET  /complaints             # Get user complaints│   │   ├── index.css               # Global styles

POST /complaints             # Submit new complaint│   │   └── main.jsx                # React app entry point

GET  /complaints/:id         # Get specific complaint│   ├── eslint.config.js            # ESLint configuration

PUT  /complaints/:id         # Update complaint│   ├── package.json                # React dependencies

POST /complaints/:id/messages # Add message to complaint│   ├── postcss.config.js           # PostCSS configuration

GET  /complaints/community   # Get public complaints│   ├── tailwind.config.js          # TailwindCSS configuration

POST /complaints/vision-ocr  # AI image analysis│   └── vite.config.js              # Vite build configuration

```│

└── README.md                       # Project documentation

### Chat System```

```

GET  /chat/:complaintId      # Get chat messages## 🚀 Installation

POST /chat/:complaintId      # Send message

PUT  /chat/:complaintId/status # Update chat status### Prerequisites

```

- **Node.js** (v16 or higher)

### Admin Dashboard- **MongoDB** (local installation or MongoDB Atlas)

```- **Google Cloud Console** account for Maps API and OAuth

POST /admin/login            # Admin authentication- **Git** for version control

GET  /admin/complaints       # Get assigned complaints

PUT  /admin/complaints/:id/status # Update status### 1. Clone the Repository

POST /admin/complaints/:id/respond # Add response

GET  /admin/analytics        # Dashboard statistics```bash

POST /admin/warning          # Issue warningsgit clone https://github.com/yourusername/municipal-complaint-system.git

```cd municipal-complaint-system

```

### Department Management

```### 2. Backend Setup

POST /department/login       # Department authentication

GET  /department/complaints  # Get department complaints```bash

PUT  /department/accept      # Accept complaintcd backend

PUT  /department/reject      # Reject complaint

GET  /department/analytics   # Performance metrics# Install dependencies

```npm install



### Rewards & Notifications# Install additional development dependencies

```npm install --save-dev nodemon

GET  /rewards               # Get available rewards```

POST /rewards/redeem        # Redeem points

GET  /notifications         # Get user notifications### 3. Frontend Setup

PUT  /notifications/:id/read # Mark as read

``````bash

cd ../frontend

## 🚀 Installation & Setup

# Install dependencies

### Prerequisitesnpm install

- **Node.js** (v16 or higher)```

- **MongoDB** (local or MongoDB Atlas)

- **Google Cloud Console** account## ⚙️ Configuration

- **Twilio Account** for SMS services

### 1. Environment Variables

### 1. Clone Repository

```bashCreate a `.env` file in the `backend` directory:

git clone https://github.com/rohit-2059/Civic-Sense-Crowdsourced-Issue-Reporting.git

cd Civic-Sense-Crowdsourced-Issue-Reporting```env

```# Database Configuration

MONGODB_URI=mongodb://localhost:27017/complaint-system

### 2. Backend Setup# OR for MongoDB Atlas:

```bash# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/complaint-system

cd backend

npm install# JWT Secret (generate a strong random string)

```JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random



Create `.env` file:# Google OAuth Configuration

```envGOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Database

MONGODB_URI=mongodb://localhost:27017/mericity# Google Maps API Key

# OR MongoDB Atlas:GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mericity

# Server Configuration

# JWTPORT=5000

JWT_SECRET=your_super_secret_jwt_key_hereNODE_ENV=development

```

# Google Services

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com### 2. Google Cloud Console Setup

GOOGLE_MAPS_API_KEY=your_google_maps_api_key

GOOGLE_VISION_API_KEY=your_google_vision_api_key#### Google OAuth 2.0:



# Twilio1. Go to [Google Cloud Console](https://console.cloud.google.com/)

TWILIO_ACCOUNT_SID=your_twilio_account_sid2. Create a new project or select existing one

TWILIO_AUTH_TOKEN=your_twilio_auth_token3. Enable **Google+ API** and **Google OAuth2 API**

TWILIO_PHONE_NUMBER=your_twilio_phone_number4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**

5. Set **Application Type** to "Web application"

# Server6. Add **Authorized Origins**: `http://localhost:5173`, `http://localhost:5174`

PORT=50007. Add **Authorized Redirect URIs**: `http://localhost:5173`, `http://localhost:5174`

NODE_ENV=development8. Copy the **Client ID** to your `.env` file

```

#### Google Maps API:

### 3. Frontend Setup

```bash1. In the same Google Cloud Console project

cd ../frontend2. Enable **Maps JavaScript API**, **Geocoding API**, and **Places API**

npm install3. Go to **Credentials** → **Create Credentials** → **API Key**

```4. Restrict the API key to your specific APIs for security

5. Copy the **API Key** to your `.env` file

Create `.env` file:

```env### 3. Frontend Environment Setup

VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_keyCreate a `.env` file in the `frontend` directory:

VITE_API_BASE_URL=http://localhost:5000

``````env

VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

### 4. Google Cloud Console SetupVITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

VITE_API_BASE_URL=http://localhost:5000

#### Enable APIs:```

- Google Maps JavaScript API

- Google Geocoding API### 4. Database Setup

- Google Vision AI API

- Google OAuth 2.0 API#### Option A: Local MongoDB



#### OAuth 2.0 Setup:1. Install MongoDB locally

1. Create OAuth 2.0 Client ID2. Start MongoDB service:

2. Add authorized origins: `http://localhost:5173`

3. Add redirect URIs: `http://localhost:5173`   ```bash

   # Windows

### 5. Database Initialization   net start MongoDB

```bash

cd backend   # macOS/Linux

node seedDepartments.js  # Initialize departments   sudo systemctl start mongod

node seedRewards.js      # Initialize reward system   ```

```

3. Use connection string: `mongodb://localhost:27017/complaint-system`

### 6. Run Application

#### Option B: MongoDB Atlas (Recommended)

**Backend Server:**

```bash1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)

cd backend2. Create a new cluster

npm run dev3. Create database user with read/write permissions

# Server: http://localhost:50004. Whitelist your IP address (or use 0.0.0.0/0 for development)

```5. Get connection string and update `.env` file



**Frontend Development:**### 5. Create Admin Users

```bash

cd frontendRun this script in MongoDB Compass or MongoDB shell to create admin users:

npm run dev

# Application: http://localhost:5173```javascript

```// Create admin users for different cities

db.admins.insertMany([

### 7. Access Points  {

    adminId: "ADMIN001",

- **Citizens:** `http://localhost:5173`    name: "Delhi Admin",

- **Admin Panel:** `http://localhost:5173/admin`    password: "$2a$10$8xQxK5ZxZnA3zQzL7Nz8UeVc3nG5QjJ4X7yD6WqS8FvPzB9tR5mNy", // hashed "admin123"

- **Department Dashboard:** `http://localhost:5173/department`    assignedCity: "Delhi",

    assignedState: "Delhi",

## 🔧 Production Deployment    role: "admin",

    isActive: true,

### Frontend (Netlify/Vercel)    createdAt: new Date(),

```bash  },

cd frontend  {

npm run build    adminId: "ADMIN002",

# Deploy 'dist' folder    name: "Mumbai Admin",

```    password: "$2a$10$8xQxK5ZxZnA3zQzL7Nz8UeVc3nG5QjJ4X7yD6WqS8FvPzB9tR5mNy", // hashed "admin123"

    assignedCity: "Mumbai",

### Backend (Railway/Heroku/DigitalOcean)    assignedState: "Maharashtra",

```bash    role: "admin",

# Set production environment variables    isActive: true,

# Deploy backend service    createdAt: new Date(),

```  },

]);

### Environment Variables for Production```

- Update OAuth origins to production domain

- Use production MongoDB URI**Default Admin Credentials:**

- Configure production API keys

- Set secure JWT secrets- **Admin ID**: ADMIN001, ADMIN002, etc.

- **Password**: admin123

## 📱 Mobile Responsiveness

## 🎯 Usage

MeriCity is fully responsive and optimized for:

- **Desktop** - Full-featured admin dashboards### 1. Start the Application

- **Tablet** - Optimized layouts for mid-screen devices

- **Mobile** - Touch-friendly complaint submission and tracking#### Terminal 1 - Backend Server:



## 🔒 Security Features```bash

cd backend

- **JWT Authentication** with secure token managementnpm run dev

- **Phone Verification** via OTP for account security# OR

- **Rate Limiting** to prevent API abusenode server.js

- **Input Validation** and sanitization```

- **File Upload Security** with type and size restrictions

- **CORS Configuration** for cross-origin securityServer will run on: `http://localhost:5000`



## 🌟 Key Differentiators#### Terminal 2 - Frontend Development:



- **AI-Powered Descriptions** - Automatic complaint analysis```bash

- **National Scope** - Not limited to specific citiescd frontend

- **Gamification** - Engaging reward systemnpm run dev

- **Multi-tier Dashboards** - Specialized interfaces for each user type```

- **Real-time Communication** - Instant updates and notifications

- **Smart Department Routing** - Intelligent complaint assignmentFrontend will run on: `http://localhost:5173`



---### 2. Application Access



**Developed by:** Rohit Khandelwal  #### For Citizens:

**For:** Smart India Hackathon (SIH)  

**Live at:** [www.mericity.app](https://www.mericity.app)1. Open `http://localhost:5173`

2. Click "Login with Google" or create manual account

**Built with ❤️ for better civic governance and citizen engagement**3. Complete your profile (name, phone, address)
4. Submit complaints with location, photos, and details

#### For Administrators:

1. Go to `http://localhost:5173/admin`
2. Login with Admin ID and password
3. View and manage complaints assigned to your city
4. Update complaint status and add responses

### 3. Key Features Usage

#### Submitting a Complaint:

1. **Location**: Allow browser location access or drag map to select location
2. **Description**: Provide detailed complaint description
3. **Photo**: Upload image or take photo with camera
4. **Audio**: Record voice message or upload audio file (optional)
5. **Priority**: Select High/Medium/Low priority level
6. **Contact**: Phone number (auto-filled from profile)

#### Admin Management:

1. **Dashboard**: View statistics and complaint overview
2. **Filter**: Filter by status, date range, priority, location
3. **Update Status**: Change from Pending → In Progress → Resolved
4. **Communication**: Add messages and responses to complaints
5. **Map View**: Visualize complaints on interactive map

## 📡 API Endpoints

### Authentication Routes (`/auth`)

```
POST /auth/google          # Google OAuth login
POST /auth/register        # Manual user registration
POST /auth/login          # Manual user login
```

### User Routes (`/user`)

```
GET  /user/me             # Get current user profile
PUT  /user/me             # Update user profile
POST /user/complete       # Complete user profile
```

### Complaint Routes (`/complaints`)

```
GET  /complaints          # Get user's complaints
POST /complaints          # Submit new complaint
GET  /complaints/:id      # Get specific complaint
PUT  /complaints/:id      # Update complaint
POST /complaints/:id/messages  # Add message to complaint
```

### Admin Routes (`/admin`)

```
POST /admin/login         # Admin authentication
GET  /admin/complaints    # Get assigned complaints
PUT  /admin/complaints/:id/status  # Update complaint status
POST /admin/complaints/:id/respond # Add admin response
GET  /admin/stats         # Get dashboard statistics
```

## 📂 File Structure Explained

### Backend Components

#### **Models** (`/models/`)

- **`User.js`** - User account schema with Google OAuth integration
- **`Admin.js`** - Admin user schema with city assignments
- **`Complaint.js`** - Complaint schema with location, attachments, and messaging

#### **Routes** (`/routes/`)

- **`auth.js`** - Handles user authentication (Google OAuth + manual)
- **`user.js`** - User profile management and updates
- **`complaints.js`** - Complaint CRUD operations with file uploads
- **`admin.js`** - Admin dashboard functionality and complaint management

#### **Services** (`/services/`)

- **`geocodingService.js`** - Google Maps geocoding integration for address resolution

#### **Middleware** (`/middleware/`)

- **`auth.js`** - JWT token validation and user authentication

### Frontend Components

#### **Pages** (`/src/pages/`)

- **`Login.jsx`** - User authentication with Google OAuth and manual login
- **`Dashboard.jsx`** - User dashboard for viewing and managing complaints
- **`CompleteProfile.jsx`** - Profile completion form for new users
- **`AdminLogin.jsx`** - Admin authentication interface
- **`AdminDashboard.jsx`** - Admin control panel with complaint management

#### **Components** (`/src/components/`)

- **`ComplaintForm.jsx`** - Interactive form for submitting complaints
- **`GoogleMap.jsx`** - Google Maps integration with location selection
- **`ExploreComplaints.jsx`** - Public complaint viewing interface
- **`AdminMapView.jsx`** - Admin map visualization of complaints
- **`FilterControls.jsx`** - Search and filter functionality
- **`Graph.jsx`** - Chart visualizations using Chart.js
- **`useComplaintFilters.js`** - Custom React hook for filtering logic

## 🔧 Configuration Files

### Backend Configuration

- **`server.js`** - Express server setup with middleware and routes
- **`package.json`** - Node.js dependencies and scripts

### Frontend Configuration

- **`vite.config.js`** - Vite build tool configuration
- **`tailwind.config.js`** - TailwindCSS styling configuration
- **`eslint.config.js`** - Code linting rules and standards

## 🚀 Deployment

### Frontend Deployment (Netlify/Vercel)

```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Backend Deployment (Heroku/Railway/DigitalOcean)

```bash
# Add production environment variables
# Deploy backend with your preferred service
```

### Environment Variables for Production

Update your production environment with:

- Production MongoDB URI
- Production Google OAuth credentials
- Production domain in OAuth settings
- Secure JWT secret
- CORS origins updated for production domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/municipal-complaint-system/issues) page
2. Create a new issue with detailed description
3. Include error messages, screenshots, and system information

## 🙏 Acknowledgments

- **Google Maps API** for location services
- **MongoDB Atlas** for cloud database hosting
- **React Community** for excellent documentation
- **Express.js** for robust backend framework
- **TailwindCSS** for modern styling utilities

---

**Built with ❤️ for better municipal governance and citizen engagement**
