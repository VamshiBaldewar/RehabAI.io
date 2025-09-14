# RehabAI+ 🏥🤖

**AI-Powered Telerehabilitation Platform with Real-Time Form Coaching**

RehabAI+ is an innovative web application that combines computer vision, machine learning, and 3D visualization to provide personalized rehabilitation exercises with real-time form feedback. The platform serves both patients and clinicians, enabling remote monitoring and guided exercise sessions.

## 🌟 Key Features

### For Patients
- **Real-time Pose Detection**: Uses TensorFlow.js and MediaPipe for accurate body pose tracking
- **AI Form Coaching**: Instant feedback on exercise form and technique
- **3D Avatar Guidance**: Interactive 3D coach demonstrating proper exercise techniques
- **Emotion Analysis**: Facial expression analysis to monitor patient well-being during sessions
- **Progress Tracking**: Comprehensive analytics and session history
- **Appointment Booking**: Easy scheduling with assigned clinicians
- **Voice Guidance**: Audio cues and instructions during exercises

### For Clinicians
- **Patient Management**: View and manage assigned patients
- **Exercise Library**: Comprehensive database of rehabilitation exercises
- **Prescription System**: Assign customized exercise plans to patients
- **AI-Powered Analytics**: Clinical insights and recommendations based on patient data
- **Progress Monitoring**: Detailed session analytics and trend analysis
- **Appointment Management**: Set availability and manage patient appointments


## 🎥DEMO

-**LINK** : https://drive.google.com/file/d/1o78-fkagSYAkYzGMdBE4foXlBZbjUfdl/view?usp=sharing

## 🛠️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Three.js** with React Three Fiber for 3D graphics

### AI & Computer Vision
- **TensorFlow.js** for machine learning
- **MediaPipe** for pose detection
- **Face-api.js** for emotion detection
- **MoveNet** model for pose estimation

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** for cross-origin requests

### Development Tools
- **TypeScript** for type safety
- **ESLint** for code linting
- **PostCSS** with Autoprefixer
- **Vite** for development server

## 📁 Project Structure

```
rehab-ai/
├── backend/                 # Node.js/Express backend
│   ├── server.js           # Main server file with API routes
│   ├── package.json        # Backend dependencies
│   └── node_modules/       # Backend dependencies
├── src/                    # React frontend source
│   ├── components/         # Reusable React components
│   │   ├── modals/        # Modal components
│   │   └── Navbar.tsx     # Navigation component
│   ├── pages/             # Main application pages
│   │   ├── HomePage.tsx   # Landing page
│   │   ├── LoginPage.tsx  # User authentication
│   │   ├── SignupPage.tsx # User registration
│   │   ├── PatientDashboard.tsx    # Patient interface
│   │   ├── DoctorDashboard.tsx     # Clinician interface
│   │   ├── ExerciseSession.tsx     # AI-powered exercise session
│   │   └── PatientDetailsPage.tsx  # Detailed patient view
│   ├── utils/             # Utility functions
│   │   └── calculateAngle.ts  # Pose analysis utilities
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── public/                # Static assets
│   ├── avatar.glb         # 3D avatar model
│   └── models/            # AI model files
├── images/                # Image assets
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn** package manager
- **Modern web browser** with camera support (Chrome, Firefox, Safari)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rehab-ai
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up MongoDB**
   - Install MongoDB on your system
   - Start MongoDB service
   - The application will connect to `mongodb://localhost:27017/rehab-ai`

5. **Start the backend server**
   ```bash
   cd backend
   node server.js
   ```
   The backend will run on `http://localhost:5000`

6. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

7. **Seed the database** (Optional)
   ```bash
   curl -X POST http://localhost:5000/api/seed
   ```
   This creates demo accounts and sample data for testing.

### Demo Accounts

After seeding the database, you can use these demo accounts:

**Clinician Account:**
- Email: `demo.doc@rehab.ai`
- Password: `DemoDoc!123`

**Patient Account:**
- Email: `demo.patient@rehab.ai`
- Password: `DemoPatient!123`

**Other Test Accounts:**
- Alex Ray: `alex.r@example.com` / `password123`
- Sam Jones: `sam.j@example.com` / `password123`
- Dr. Evelyn Reed: `e.reed@rehab.ai` / `password123`

## 🎯 How It Works

### 1. User Registration & Authentication
- Users can register as either patients or clinicians
- JWT-based authentication system
- Role-based access control

### 2. Patient Workflow
1. **Login** to patient dashboard
2. **View assigned exercises** from their clinician
3. **Start exercise session** with camera access
4. **AI analyzes form** in real-time using pose detection
5. **Receive feedback** on technique and form
6. **Complete session** and provide feedback
7. **View progress** and analytics

### 3. Clinician Workflow
1. **Login** to clinician dashboard
2. **View patient roster** and their progress
3. **Assign exercises** and create prescriptions
4. **Monitor patient sessions** and analytics
5. **Set appointment availability**
6. **Review AI-generated insights** and recommendations

### 4. AI-Powered Exercise Analysis
- **Pose Detection**: Uses MoveNet model to track body keypoints
- **Form Analysis**: Calculates joint angles and movement patterns
- **Rep Counting**: Intelligent counting based on exercise-specific logic
- **Real-time Feedback**: Provides instant coaching cues
- **Emotion Detection**: Monitors patient facial expressions for well-being

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
JWT_SECRET=your_jwt_secret_key_here
MONGODB_URI=mongodb://localhost:27017/rehab-ai
PORT=5000
```

### Camera Permissions
The application requires camera access for pose detection. Ensure your browser has camera permissions enabled.

### Browser Compatibility
- **Chrome** (recommended for best performance)
- **Firefox** (good support)
- **Safari** (basic support)
- **Edge** (good support)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Patient Endpoints
- `GET /api/patient/prescription` - Get assigned exercises
- `GET /api/patient/sessions` - Get session history
- `POST /api/sessions` - Save completed session

### Clinician Endpoints
- `GET /api/clinician/patients` - Get patient list
- `GET /api/clinician/patient/:id` - Get patient details
- `POST /api/clinician/prescribe` - Assign exercises
- `POST /api/clinician/add-patient` - Add new patient

### Exercise Management
- `GET /api/exercises` - Get exercise library

### Appointments
- `GET /api/appointments` - Get appointments
- `GET /api/appointments/availability` - Get available slots
- `POST /api/appointments/book` - Book appointment
- `POST /api/clinician/availability` - Set availability

## 🎨 Customization

### Adding New Exercises
1. Add exercise to the database via the seed script
2. Define joint tracking configuration
3. Set rep counting logic parameters
4. Add exercise instructions and descriptions

### Modifying AI Models
- Replace MoveNet with other pose detection models
- Adjust form analysis algorithms
- Customize emotion detection parameters

### UI Customization
- Modify Tailwind CSS classes for styling
- Update component designs in React components
- Customize 3D avatar and animations

## 🚨 Troubleshooting

### Common Issues

1. **Camera not working**
   - Check browser permissions
   - Ensure HTTPS in production
   - Try different browsers

2. **Pose detection not working**
   - Check TensorFlow.js backend
   - Verify camera resolution
   - Ensure good lighting

3. **Database connection issues**
   - Verify MongoDB is running
   - Check connection string
   - Ensure database exists

4. **Build errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Performance Optimization

- Use WebGL backend for TensorFlow.js
- Optimize 3D models for web
- Implement lazy loading for components
- Use CDN for static assets

## 🔒 Security Considerations

- JWT tokens expire after 8 hours
- Passwords are hashed with bcrypt
- CORS is configured for security
- Input validation on all API endpoints
- Camera data is processed locally (no server storage)

## 📈 Future Enhancements

- **Mobile App**: React Native version
- **Advanced Analytics**: Machine learning insights
- **Video Recording**: Session playback for review
- **Multi-language Support**: Internationalization
- **Integration**: EMR/EHR system integration
- **Wearable Support**: Integration with fitness trackers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🙏 Acknowledgments

- TensorFlow.js team for pose detection capabilities
- MediaPipe for computer vision tools
- Three.js community for 3D graphics
- React team for the excellent framework
- All contributors and testers

---

**RehabAI+** - Revolutionizing rehabilitation through AI-powered technology 🚀
