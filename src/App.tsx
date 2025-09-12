import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import ExerciseSession from './pages/ExerciseSession'
import PatientDetailsPage from './pages/PatientDetailsPage'
import TestPage from './pages/TestPage'

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/session" element={<ExerciseSession />} />
        <Route path="/patient/:id" element={<PatientDetailsPage />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </>
  )
}

export default App


