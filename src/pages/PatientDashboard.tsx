import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Define interfaces for our data structures
interface User {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
}

interface Exercise {
    _id: string;
    name: string;
    description: string;
    instructions: string[];
    targetBodyPart: string;
    repLogic: any; 
}

interface PrescribedExercise {
    exercise: Exercise;
    sets: number;
    reps: number;
}

interface Prescription {
    clinician: { firstName: string; lastName: string };
    exercises: PrescribedExercise[];
}

interface SessionAnalytics {
    _id: string;
    createdAt: string;
    exercise: { name: string };
    repsCompleted: number;
    sessionDuration: number;
    averageFormScore: number;
    completionRate: number;
    patientFeedback: {
        painLevel: number;
        difficulty: number;
        notes: string;
    };
    analytics: {
        totalReps: number;
        targetReps: number;
        completionPercentage: number;
        averagePainLevel: number;
        averageDifficulty: number;
        formImprovements: string[];
        sessionQuality: number;
        recommendations: string[];
    };
}

interface AppointmentSlot {
    _id: string;
    start: string;
    end: string;
    clinician: { firstName: string; lastName: string } | string;
    status: 'available' | 'booked' | 'cancelled';
}

interface Appointment extends AppointmentSlot {
    patient?: { firstName: string; lastName: string } | string;
}

// The export is now correctly placed with the function definition.
export default function PatientDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [prescription, setPrescription] = useState<Prescription | null>(null);
    const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [availability, setAvailability] = useState<AppointmentSlot[]>([]);
    const [bookingStatus, setBookingStatus] = useState('');
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    // Mock emotion data for demonstration
    const [currentEmotion, setCurrentEmotion] = useState({
        emotion: 'neutral',
        confidence: 0.85,
        timestamp: Date.now(),
        painLevel: 15,
        distressLevel: 20,
        calmnessLevel: 75
    });

    // Mock emotion history data
    const [emotionHistory, setEmotionHistory] = useState(() => {
        const history = [];
        const emotions = ['happy', 'neutral', 'sad', 'angry', 'fearful'];
        const now = Date.now();

        for (let i = 0; i < 30; i++) {
            const emotion = emotions[Math.floor(Math.random() * emotions.length)];
            history.push({
                emotion,
                confidence: Math.random() * 0.4 + 0.6,
                timestamp: now - (i * 60000), // 1 minute intervals
                painLevel: Math.floor(Math.random() * 80),
                distressLevel: Math.floor(Math.random() * 70),
                calmnessLevel: Math.floor(Math.random() * 60) + 40
            });
        }
        return history.sort((a, b) => b.timestamp - a.timestamp);
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            navigate('/login');
            return;
        }
        
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        const fetchData = async () => {
            try {
                // Fetch prescription
                const prescriptionResponse = await fetch('http://localhost:5000/api/patient/prescription', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!prescriptionResponse.ok) {
                    const errData = await prescriptionResponse.json();
                    throw new Error(errData.message || 'Could not fetch prescription.');
                }

                const prescriptionData: Prescription = await prescriptionResponse.json();
                setPrescription(prescriptionData);

                // Fetch session analytics
                const analyticsResponse = await fetch('http://localhost:5000/api/patient/sessions', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (analyticsResponse.ok) {
                    const analyticsData: SessionAnalytics[] = await analyticsResponse.json();
                    setSessionAnalytics(analyticsData);
                }

                // Fetch availability for booking
                const availRes = await fetch('http://localhost:5000/api/appointments/availability', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (availRes.ok) {
                    const slots: AppointmentSlot[] = await availRes.json();
                    setAvailability(slots);
                }

                // Fetch patient's existing appointments
                const apptRes = await fetch('http://localhost:5000/api/appointments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (apptRes.ok) {
                    const appts: Appointment[] = await apptRes.json();
                    setAppointments(appts);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleStartExercise = (exerciseData: PrescribedExercise) => {
        navigate('/session', { state: { exerciseData } });
    };

    const handleBook = async (slotId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setBookingStatus('');
        const res = await fetch('http://localhost:5000/api/appointments/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ slotId })
        });
        if (res.ok) {
            const booked: Appointment = await res.json();
            setBookingStatus('Appointment booked successfully');
            setAvailability(prev => prev.filter(s => s._id !== slotId));
            setAppointments(prev => [booked, ...prev]);
        } else {
            const data = await res.json().catch(() => ({}));
            setBookingStatus(data.message || 'Failed to book slot');
        }
    };

    if (loading) {
        return <div className="p-8">Loading your dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <header>
                    <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 text-white p-6 sm:p-8 shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold leading-tight">Welcome, {user?.firstName}!</h1>
                    {prescription && (
                                    <p className="mt-1 text-indigo-100">Plan from Dr. {prescription.clinician.firstName} {prescription.clinician.lastName} is ready.</p>
                                )}
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-sm text-indigo-100">Last 7 days</div>
                                    <div className="text-2xl font-extrabold">{sessionAnalytics.slice(-7).length}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-indigo-100">Avg Quality</div>
                                    <div className="text-2xl font-extrabold">{sessionAnalytics.length > 0 ? Math.round(sessionAnalytics.reduce((acc, s) => acc + s.analytics.sessionQuality, 0) / sessionAnalytics.length) : 0}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="mt-8">
                    {/* Emotion Analysis Dashboard */}
                    <div className="mb-8 bg-white rounded-2xl shadow ring-1 ring-gray-100 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Emotion Analysis</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Emotional State</h3>
                                <EmotionDisplay
                                    emotionData={currentEmotion}
                                    showHistory={false}
                                    compact={false}
                                />
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Emotion Insights</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Overall Well-being:</span>
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                                            currentEmotion.calmnessLevel >= 70 ? 'bg-green-100 text-green-700' :
                                            currentEmotion.calmnessLevel >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {currentEmotion.calmnessLevel >= 70 ? 'Good' :
                                                currentEmotion.calmnessLevel >= 40 ? 'Moderate' : 'Needs Attention'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Pain Level:</span>
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                                            currentEmotion.painLevel < 30 ? 'bg-green-100 text-green-700' :
                                            currentEmotion.painLevel < 60 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {currentEmotion.painLevel < 30 ? 'Low' :
                                                currentEmotion.painLevel < 60 ? 'Moderate' : 'High'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Stress Level:</span>
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                                            currentEmotion.distressLevel < 30 ? 'bg-green-100 text-green-700' :
                                            currentEmotion.distressLevel < 60 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {currentEmotion.distressLevel < 30 ? 'Low' :
                                                currentEmotion.distressLevel < 60 ? 'Moderate' : 'High'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Emotion History */}
                    <div className="mb-8">
                        <EmotionHistory
                            emotionHistory={emotionHistory}
                            title="Recent Emotion Analysis"
                            maxItems={20}
                        />
                    </div>

                    {/* Appointment Booking (always visible) */}
                    <div id="booking-panel" className="mb-8 bg-white rounded-2xl shadow ring-1 ring-gray-100 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-2xl font-bold text-gray-900">Book an Appointment</h2>
                            {bookingStatus && <div className="text-sm text-emerald-700">{bookingStatus}</div>}
                        </div>
                        {availability.length === 0 ? (
                            <div className="text-sm text-gray-600">No available times from your clinician yet. Please check back later.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {availability.slice(0, 6).map(slot => (
                                    <div key={slot._id} className="bg-gray-50 p-4 rounded border flex items-center justify-between">
                                        <div>
                                            <div className="text-sm text-gray-700">{new Date(slot.start).toLocaleDateString()} • {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="text-xs text-gray-500">{Math.round((new Date(slot.end).getTime() - new Date(slot.start).getTime()) / 60000)} min</div>
                                        </div>
                                        <button onClick={() => handleBook(slot._id)} className="px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700">Book</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Patient's Appointments list */}
                    <div className="mb-8 bg-white rounded-2xl shadow ring-1 ring-gray-100 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Appointments</h2>
                        {appointments.length === 0 ? (
                            <div className="text-sm text-gray-600">No appointments yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {appointments
                                    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                                    .map(appt => (
                                        <div key={appt._id} className="bg-gray-50 p-4 rounded border flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-gray-800">{new Date(appt.start).toLocaleDateString()} • {new Date(appt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                <div className="text-xs text-gray-500">With Dr. {typeof appt.clinician === 'string' ? '' : `${appt.clinician.firstName} ${appt.clinician.lastName}`}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${appt.status === 'booked' ? 'bg-emerald-100 text-emerald-700' : appt.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>{appt.status}</span>
                                        </div>
                                ))}
                            </div>
                        )}
                    </div>
                   
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
                    
                    {!prescription && !error && (
                         <div className="bg-white shadow sm:rounded-lg p-6 text-center">
                            <h3 className="text-lg font-medium text-gray-900">No exercises assigned yet.</h3>
                            <p className="mt-1 text-sm text-gray-500">Your clinician has not assigned a rehabilitation plan. Please check back later.</p>
                        </div>
                    )}

                    {/* Analytics Dashboard */}
                    {sessionAnalytics.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Progress</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                {/* Completion Mini-bar Chart */}
                                <div className="bg-white p-6 rounded-2xl shadow ring-1 ring-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Completion (last 7)</h3>
                                    <div className="h-40 flex items-end justify-between gap-2">
                                        {sessionAnalytics.slice(-7).map((session) => (
                                            <div key={session._id} className="flex flex-col items-center group">
                                                <div
                                                    className="rounded-t w-6 md:w-7 bg-gradient-to-t from-indigo-500 to-indigo-400 group-hover:to-indigo-300 transition-all duration-300"
                                                    style={{ height: `calc(${Math.max(0, Math.min(100, session.analytics.completionPercentage))}% + 6px)` }}
                                                />
                                                <span className="mt-2 text-[10px] text-gray-500">{new Date(session.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Pain Mini-bar Chart */}
                                <div className="bg-white p-6 rounded-2xl shadow ring-1 ring-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Pain (last 7)</h3>
                                    <div className="h-40 flex items-end justify-between gap-2">
                                        {sessionAnalytics.slice(-7).map((session) => (
                                            <div key={session._id} className="flex flex-col items-center group">
                                                <div
                                                    className="rounded-t w-6 md:w-7 bg-gradient-to-t from-rose-500 to-rose-400 group-hover:to-rose-300 transition-all duration-300"
                                                    style={{ height: `calc(${Math.max(0, Math.min(10, session.patientFeedback.painLevel)) * 10}% + 6px)` }}
                                                />
                                                <span className="mt-2 text-[10px] text-gray-500">{new Date(session.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Donut Progress */}
                                <div className="bg-white p-6 rounded-2xl shadow ring-1 ring-gray-100 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="relative inline-flex items-center justify-center">
                                            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" className="stroke-gray-200" strokeWidth="12" fill="none" />
                                                <circle cx="50" cy="50" r="40" className="stroke-indigo-500" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={`${251.2 - (251.2 * (sessionAnalytics.length > 0 ? Math.round(sessionAnalytics.reduce((acc, s) => acc + s.analytics.completionPercentage, 0) / sessionAnalytics.length) : 0) / 100)}`} />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div>
                                                    <div className="text-2xl font-extrabold text-gray-900">{sessionAnalytics.length > 0 ? Math.round(sessionAnalytics.reduce((acc, s) => acc + s.analytics.completionPercentage, 0) / sessionAnalytics.length) : 0}%</div>
                                                    <div className="text-xs text-gray-500">Avg completion</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                                            <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">Quality {sessionAnalytics.length > 0 ? Math.round(sessionAnalytics.reduce((acc, s) => acc + s.analytics.sessionQuality, 0) / sessionAnalytics.length) : 0}%</div>
                                            <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">Form {sessionAnalytics.length > 0 ? Math.round(sessionAnalytics.reduce((acc, s) => acc + s.averageFormScore, 0) / sessionAnalytics.length) : 0}</div>
                                            <div className="bg-rose-50 text-rose-700 px-2 py-1 rounded">Pain {sessionAnalytics.length > 0 ? Math.round(sessionAnalytics.reduce((acc, s) => acc + s.patientFeedback.painLevel, 0) / sessionAnalytics.length) : 0}/10</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Session Quality Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-lg shadow text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {sessionAnalytics.length > 0 ? Math.round(sessionAnalytics.reduce((acc, s) => acc + s.analytics.sessionQuality, 0) / sessionAnalytics.length) : 0}
                                    </div>
                                    <div className="text-sm text-gray-600">Avg Session Quality</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {sessionAnalytics.length > 0 ? Math.round(sessionAnalytics.reduce((acc, s) => acc + s.analytics.completionPercentage, 0) / sessionAnalytics.length) : 0}%
                                    </div>
                                    <div className="text-sm text-gray-600">Avg Completion</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {sessionAnalytics.length > 0 ? Math.round(sessionAnalytics.reduce((acc, s) => acc + s.averageFormScore, 0) / sessionAnalytics.length) : 0}
                                    </div>
                                    <div className="text-sm text-gray-600">Avg Form Score</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {sessionAnalytics.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Total Sessions</div>
                                </div>
                            </div>

                            {/* Recent Sessions */}
                            <div className="bg-white rounded-2xl shadow ring-1 ring-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800">Recent Sessions</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reps</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pain</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {sessionAnalytics.slice(0, 7).map((session) => (
                                                <tr key={session._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(session.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                                        {session.exercise.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                        {session.repsCompleted}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            session.analytics.sessionQuality >= 80 ? 'bg-green-100 text-green-800' :
                                                            session.analytics.sessionQuality >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {session.analytics.sessionQuality}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            session.patientFeedback.painLevel <= 3 ? 'bg-green-100 text-green-800' :
                                                            session.patientFeedback.painLevel <= 6 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {session.patientFeedback.painLevel}/10
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {prescription && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Exercises</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {prescription.exercises.map(({ exercise, sets, reps }) => (
                                    <div key={exercise._id} className="bg-white overflow-hidden shadow rounded-2xl ring-1 ring-gray-100 flex flex-col">
                                        <div className="p-5 flex-grow">
                                            <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {exercise.targetBodyPart || 'Full Body'}
                                            </div>
                                            <h3 className="mt-2 text-lg font-semibold text-gray-900">{exercise.name}</h3>
                                            <p className="mt-2 text-sm text-gray-500">{exercise.description}</p>
                                            <ul className="mt-3 text-sm text-gray-600 list-disc list-inside space-y-1">
                                                {exercise.instructions.slice(0, 3).map((inst: string, idx: number) => <li key={idx}>{inst}</li>)}
                                            </ul>
                                        </div>
                                        <div className="px-5 py-3 bg-gray-50 flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">{sets} Sets / {reps} Reps</span>
                                            <button 
                                                onClick={() => handleStartExercise({ exercise, sets, reps })}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                Start
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
