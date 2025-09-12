import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Patient { firstName: string; lastName: string; email: string; condition: string; }
interface Exercise { name: string; }
interface PrescribedExercise { exercise: Exercise; sets: number; reps: number; }
interface Prescription { exercises: PrescribedExercise[]; }
interface Session { 
    _id: string; 
    createdAt: string; 
    exercise: Exercise; 
    repsCompleted: number; 
    sessionDuration: number;
    averageFormScore: number;
    completionRate: number;
    patientFeedback: { painLevel: number; difficulty: number; notes: string; }; 
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

// AI Clinical Insights Generator
const generateClinicalInsights = (sessions: Session[]): string[] => {
    const insights = [];
    
    if (sessions.length === 0) return ["No session data available for analysis."];
    
    // Calculate averages
    const avgPain = sessions.reduce((acc, s) => acc + s.patientFeedback.painLevel, 0) / sessions.length;
    const avgQuality = sessions.reduce((acc, s) => acc + s.analytics.sessionQuality, 0) / sessions.length;
    const avgForm = sessions.reduce((acc, s) => acc + s.averageFormScore, 0) / sessions.length;
    const avgCompletion = sessions.reduce((acc, s) => acc + s.analytics.completionPercentage, 0) / sessions.length;
    
    // Pain level insights
    if (avgPain > 7) {
        insights.push("⚠️ High pain levels detected - consider reducing exercise intensity or frequency");
    } else if (avgPain < 3) {
        insights.push("✅ Excellent pain management - patient is responding well to treatment");
    } else {
        insights.push("📊 Moderate pain levels - monitor for improvement trends");
    }
    
    // Quality insights
    if (avgQuality > 85) {
        insights.push("🎯 Outstanding session quality - patient is highly engaged and motivated");
    } else if (avgQuality < 60) {
        insights.push("📉 Session quality below target - consider additional support or motivation strategies");
    }
    
    // Form insights
    if (avgForm > 90) {
        insights.push("🏆 Excellent form consistency - technique is well-established");
    } else if (avgForm < 70) {
        insights.push("🔧 Form needs improvement - consider additional coaching or modified exercises");
    }
    
    // Completion insights
    if (avgCompletion > 90) {
        insights.push("💪 High adherence rate - patient is committed to rehabilitation program");
    } else if (avgCompletion < 70) {
        insights.push("📅 Adherence below target - consider discussing barriers to completion");
    }
    
    // Trend analysis
    const recentSessions = sessions.slice(-3);
    if (recentSessions.length >= 3) {
        const recentPain = recentSessions.reduce((acc, s) => acc + s.patientFeedback.painLevel, 0) / recentSessions.length;
        const olderSessions = sessions.slice(0, -3);
        if (olderSessions.length > 0) {
            const olderPain = olderSessions.reduce((acc, s) => acc + s.patientFeedback.painLevel, 0) / olderSessions.length;
            if (recentPain < olderPain - 1) {
                insights.push("📈 Positive trend: Pain levels are decreasing over time");
            } else if (recentPain > olderPain + 1) {
                insights.push("📉 Concerning trend: Pain levels are increasing - review treatment plan");
            }
        }
    }
    
    // Recommendations
    if (avgPain > 6 && avgCompletion < 80) {
        insights.push("💡 Recommendation: Consider pain management strategies before increasing exercise intensity");
    }
    
    if (avgForm < 75 && avgQuality > 80) {
        insights.push("💡 Recommendation: Patient is motivated but needs form correction - schedule technique review");
    }
    
    if (insights.length === 0) {
        insights.push("📊 Patient is progressing well with current treatment plan");
    }
    
    return insights;
};

export function PatientDetailsPage() {
    const { id } = useParams();
    const [patientData, setPatientData] = useState<{ patient: Patient; prescription: Prescription; sessions: Session[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const fetchDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/clinician/patient/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) throw new Error('Failed to fetch patient details.');
                const data = await response.json();
                setPatientData(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchDetails();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-lg">Loading patient details...</div>;
    if (!patientData) return <div className="p-8 text-center text-lg text-red-500">Could not load data for this patient.</div>;
    
    const { patient, prescription, sessions } = patientData;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <Link to="/doctor-dashboard" className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block">&larr; Back to Roster</Link>
                <div className="bg-white shadow-xl rounded-lg p-6 mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
                    <p className="mt-2 text-md text-gray-600"><strong>Condition:</strong> {patient.condition}</p>
                    <p className="text-sm text-gray-500">{patient.email}</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white shadow-xl rounded-lg p-6 h-full">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Current Prescription</h2>
                            <ul className="space-y-3">
                                {prescription?.exercises.map(({ exercise, sets, reps }, index) => (
                                    <li key={index} className="p-3 bg-gray-50 rounded-md">
                                        <p className="font-semibold text-gray-700">{exercise.name}</p>
                                        <p className="text-sm text-gray-500">{sets} sets of {reps} reps</p>
                                    </li>
                                )) || <li>No prescription assigned.</li>}
                            </ul>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        {/* AI-Powered Analytics for Doctor */}
                        {sessions.length > 0 && (
                            <div className="mb-6">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-blue-900 mb-4">🤖 AI Clinical Analysis</h3>
                                    {/* KPI Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-extrabold text-blue-600">
                                                {Math.round(sessions.reduce((acc, s) => acc + s.analytics.sessionQuality, 0) / sessions.length)}%
                                            </div>
                                            <div className="text-sm text-blue-700">Overall Progress</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-extrabold text-green-600">
                                                {Math.round(sessions.reduce((acc, s) => acc + s.analytics.completionPercentage, 0) / sessions.length)}%
                                            </div>
                                            <div className="text-sm text-green-700">Adherence Rate</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-extrabold text-purple-600">
                                                {Math.round(sessions.reduce((acc, s) => acc + s.averageFormScore, 0) / sessions.length)}
                                            </div>
                                            <div className="text-sm text-purple-700">Form Quality</div>
                                        </div>
                                    </div>

                                    {/* Visualization Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                                        {/* Completion Mini-bar Chart */}
                                        <div className="bg-white rounded-xl p-4 ring-1 ring-blue-100">
                                            <div className="text-sm font-semibold text-gray-700 mb-2">Completion (last 7)</div>
                                            <div className="h-32 flex items-end justify-between gap-2">
                                                {sessions.slice(-7).map((session) => (
                                                    <div key={session._id} className="flex flex-col items-center group">
                                                        <div className="w-5 md:w-6 rounded-t bg-gradient-to-t from-indigo-500 to-indigo-400 group-hover:to-indigo-300 transition-all duration-300" style={{ height: `calc(${Math.max(0, Math.min(100, session.analytics.completionPercentage))}% + 6px)` }} />
                                                        <span className="mt-1 text-[10px] text-gray-500">{new Date(session.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Pain Mini-bar Chart */}
                                        <div className="bg-white rounded-xl p-4 ring-1 ring-blue-100">
                                            <div className="text-sm font-semibold text-gray-700 mb-2">Pain (last 7)</div>
                                            <div className="h-32 flex items-end justify-between gap-2">
                                                {sessions.slice(-7).map((session) => (
                                                    <div key={session._id} className="flex flex-col items-center group">
                                                        <div className="w-5 md:w-6 rounded-t bg-gradient-to-t from-rose-500 to-rose-400 group-hover:to-rose-300 transition-all duration-300" style={{ height: `calc(${Math.max(0, Math.min(10, session.patientFeedback.painLevel)) * 10}% + 6px)` }} />
                                                        <span className="mt-1 text-[10px] text-gray-500">{new Date(session.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Quality Donut */}
                                        <div className="bg-white rounded-xl p-4 ring-1 ring-blue-100 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="relative inline-flex items-center justify-center">
                                                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                                        <circle cx="50" cy="50" r="40" className="stroke-gray-200" strokeWidth="12" fill="none" />
                                                        <circle cx="50" cy="50" r="40" className="stroke-indigo-500" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={`${251.2 - (251.2 * (Math.round(sessions.reduce((acc, s) => acc + s.analytics.sessionQuality, 0) / sessions.length)) / 100)}`} />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div>
                                                            <div className="text-xl font-extrabold text-gray-900">{Math.round(sessions.reduce((acc, s) => acc + s.analytics.sessionQuality, 0) / sessions.length)}%</div>
                                                            <div className="text-[11px] text-gray-500">Avg quality</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                                                    <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded">Comp {Math.round(sessions.reduce((acc, s) => acc + s.analytics.completionPercentage, 0) / sessions.length)}%</div>
                                                    <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">Form {Math.round(sessions.reduce((acc, s) => acc + s.averageFormScore, 0) / sessions.length)}</div>
                                                    <div className="bg-rose-50 text-rose-700 px-2 py-1 rounded">Pain {Math.round(sessions.reduce((acc, s) => acc + s.patientFeedback.painLevel, 0) / sessions.length)}/10</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Recommendations */}
                                    <div className="bg-white rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-800 mb-2">📊 Clinical Insights & Recommendations:</h4>
                                        <ul className="space-y-2 text-sm text-gray-700">
                                            {generateClinicalInsights(sessions).map((insight, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="text-blue-500 mr-2">•</span>
                                                    {insight}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Enhanced Session History */}
                        <div className="bg-white shadow-xl rounded-2xl ring-1 ring-gray-100 p-6">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Detailed Session History</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reps</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Pain</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {sessions.length > 0 ? sessions.map(session => (
                                            <tr key={session._id} className="hover:bg-gray-50">
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
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        session.averageFormScore >= 85 ? 'bg-green-100 text-green-800' :
                                                        session.averageFormScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {session.averageFormScore}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No sessions completed yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PatientDetailsPage


