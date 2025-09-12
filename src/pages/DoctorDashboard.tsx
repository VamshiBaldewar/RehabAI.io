import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface Patient { 
    _id: string; 
    firstName: string; 
    lastName: string; 
    condition: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    lastSession?: string;
    totalSessions: number;
    averageFormScore: number;
    averagePainLevel: number;
}

interface Exercise {
    _id: string;
    name: string;
    description: string;
    targetBodyPart: string;
    difficulty: string;
    sets: number;
    reps: number;
}

export default function DoctorDashboard() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            navigate('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== 'doctor') {
                navigate('/patient-dashboard');
                return;
            }
        } catch (err) {
            console.error('Error parsing user data:', err);
            navigate('/login');
            return;
        }

        fetchPatients();
        fetchExercises();
    }, [navigate]);

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/patients', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch patients');
            }

            const data = await response.json();
            setPatients(data);
        } catch (err) {
            console.error('Error fetching patients:', err);
            setError('Failed to load patients');
        }
    };

    const fetchExercises = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/exercises', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch exercises');
            }

            const data = await response.json();
            setExercises(data);
        } catch (err) {
            console.error('Error fetching exercises:', err);
            setError('Failed to load exercises');
        } finally {
            setLoading(false);
        }
    };

    const getTotalPatients = () => patients.length;
    const getTotalExercises = () => exercises.length;
    const getActivePatients = () => patients.filter(p => p.lastSession && new Date(p.lastSession) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                    <p className="text-gray-600 mt-2">
                        Monitor your patients' progress and manage exercises
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                                <p className="text-2xl font-semibold text-gray-900">{getTotalPatients()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                                <p className="text-2xl font-semibold text-gray-900">{getActivePatients()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Available Exercises</p>
                                <p className="text-2xl font-semibold text-gray-900">{getTotalExercises()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Patients List */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Patients</h2>
                        </div>
                        <div className="p-6">
                            {patients.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No patients found</p>
                            ) : (
                                <div className="space-y-4">
                                    {patients.map((patient) => (
                                        <div key={patient._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {patient.firstName} {patient.lastName}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1">{patient.condition}</p>
                                                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                                                        <span>{patient.totalSessions} sessions</span>
                                                        <span>Form: {patient.averageFormScore}%</span>
                                                        <span>Pain: {patient.averagePainLevel}/10</span>
                        </div>
                                                    {patient.lastSession && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            Last session: {new Date(patient.lastSession).toLocaleDateString()}
                                                        </p>
                                                    )}
                                        </div>
                                                <Link
                                                    to={`/patient/${patient._id}`}
                                                    className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                                                >
                                                    View Details
                                                </Link>
                                        </div>
                                        </div>
                                    ))}
                                                </div>
                            )}
                                                        </div>
                                                    </div>

                    {/* Exercise Management */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Exercise Library</h2>
                                                        </div>
                        <div className="p-6">
                            {exercises.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No exercises available</p>
                            ) : (
                                <div className="space-y-4">
                                    {exercises.map((exercise) => (
                                        <div key={exercise._id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-medium text-gray-900">{exercise.name}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                                                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                                                        <span className="capitalize">{exercise.difficulty}</span>
                                                        <span>{exercise.targetBodyPart}</span>
                                                        <span>{exercise.sets} sets × {exercise.reps} reps</span>
                                                    </div>
                                                </div>
                                            </div>
                                    </div>
                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                </div>
            </div>
        </div>
    );
}