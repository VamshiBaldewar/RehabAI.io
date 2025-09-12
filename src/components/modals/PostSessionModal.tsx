import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: { painLevel: number; difficulty: number; notes: string }) => void;
}

export function PostSessionModal({ isOpen, onClose, onSubmit }: Props) {
    const [painLevel, setPainLevel] = useState(1);
    const [difficulty, setDifficulty] = useState(1);
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        onSubmit({ painLevel, difficulty, notes });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Feedback</h2>
                        <p className="text-gray-600 mb-6">Your feedback helps us tailor your recovery plan.</p>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pain Level During Exercise: <span className="font-bold text-indigo-600">{painLevel}</span></label>
                                <input type="range" min="1" max="10" value={painLevel} onChange={(e) => setPainLevel(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level: <span className="font-bold text-indigo-600">{difficulty}</span></label>
                                <input type="range" min="1" max="10" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., 'Felt a pinch in my left shoulder during the last set.'"></textarea>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end space-x-4">
                            <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">Cancel</button>
                            <button onClick={handleSubmit} className="px-6 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md">Submit Feedback</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

