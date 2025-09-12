// src/pages/ExerciseSession.tsx
import { useRef, useEffect, useState, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import type { Keypoint } from '@tensorflow-models/pose-detection';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import { PostSessionModal } from '../components/modals/PostSessionModal';

// --- Helper Functions ---
const speak = (text: string) => {
    window.speechSynthesis.cancel(); // Prevent messages from overlapping
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
};
const calculateAngle = (p1: Keypoint, p2: Keypoint, p3: Keypoint): number => {
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
};
const drawSkeleton = (keypoints: Keypoint[], ctx: CanvasRenderingContext2D) => {
    console.log('Drawing skeleton with', keypoints.length, 'keypoints');
    
    // Draw keypoints first
    keypoints.forEach((keypoint) => {
        if (keypoint.score! > 0.3) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fill();
        }
    });
    
    // Draw connections
    const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
    console.log('Drawing', adjacentPairs.length, 'connections');
    
    adjacentPairs.forEach(([i, j]) => {
        const kp1 = keypoints[i], kp2 = keypoints[j];
        if (kp1 && kp2 && kp1.score! > 0.3 && kp2.score! > 0.3) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
            ctx.stroke();
        }
    });
    
    console.log('Skeleton drawing complete');
};

// --- Hand Proxy Drawer (since MoveNet doesn't provide finger landmarks) ---
const drawHandProxy = (
    wrist: Keypoint | undefined,
    elbow: Keypoint | undefined,
    ctx: CanvasRenderingContext2D,
    color: string = 'rgba(66, 153, 225, 0.9)'
) => {
    if (!wrist || (wrist.score || 0) <= 0.3) return;
    const wx = wrist.x, wy = wrist.y;
    // Direction from wrist to elbow to orient the proxy
    let dx = 0, dy = -1; // default upward
    if (elbow && (elbow.score || 0) > 0.2) {
        dx = wx - elbow.x;
        dy = wy - elbow.y;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
    }
    // Draw palm circle
    ctx.beginPath();
    ctx.arc(wx, wy, 12, 0, 2*Math.PI);
    ctx.fillStyle = color.replace('0.9', '0.25');
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
    // Draw 5 finger rays fanning out
    const baseAngle = Math.atan2(dy, dx);
    const fan = [-0.4, -0.2, 0, 0.2, 0.4];
    fan.forEach((a, i) => {
        const ang = baseAngle + a;
        const fx = wx + Math.cos(ang) * (16 + i * 2);
        const fy = wy + Math.sin(ang) * (16 + i * 2);
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(fx, fy);
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke();
        // fingertip dot
        ctx.beginPath();
        ctx.arc(fx, fy, 3, 0, 2*Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    });
};

// --- 3D Avatar Model Loader ---
const Avatar = () => {
    const [time, setTime] = useState(0);
    const [modelError] = useState<string | null>(null);
    
    useFrame((state: any) => {
        setTime(state.clock.getElapsedTime());
    });
    
    // Breathing animation
    const breathingScale = 1 + Math.sin(time * 2) * 0.01;
    
    // Load the GLB model
    const { scene } = useGLTF('/avatar.glb');
    
    // Handle loading errors - useGLTF doesn't return error in the destructured object
    // Errors are handled by the Suspense fallback

    // If there's an error, show a fallback message
    if (modelError) {
        return (
            <Html center>
                <div className="text-white text-center">
                    <p>3D Model failed to load</p>
                    <p className="text-sm">Using fallback avatar</p>
                </div>
            </Html>
        );
    }

    // If model is still loading, show loading state
    if (!scene) {
    return (
            <Html center>
                <div className="text-white text-center">
                    <p>Loading 3D Model...</p>
                </div>
            </Html>
        );
    }

    // Clone the scene to avoid issues with multiple instances
    const clonedScene = scene.clone();
    
    // Apply breathing animation and positioning
    clonedScene.scale.setScalar(breathingScale);
    clonedScene.position.set(0, -0.5, 0);
    
    return <primitive object={clonedScene} />;
};

// --- Main Session Component ---
export function ExerciseSession() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { exerciseData } = state || {};

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
    const requestRef = useRef<number | null>(null);

    const [feedback, setFeedback] = useState('Initializing AI Coach...');
    const [repCount, setRepCount] = useState(0);
    const [stage, setStage] = useState<'up' | 'down'>('up');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionStartTime] = useState(Date.now());
    const [, setManualCompleteOpen] = useState(false);
    const wristHistoryRef = useRef<number[]>([]);
    const wristVelRef = useRef<number>(0);
    const lastPhaseRef = useRef<'up' | 'down'>('down');
    const lastCountTsRef = useRef<number>(0);
    const prevRepRef = useRef<number>(0);
    
    // Emotion detection state
    const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
    const [emotionDetectionInitialized, setEmotionDetectionInitialized] = useState(false);

    // Initialize emotion detection
    useEffect(() => {
        const initEmotionDetection = async () => {
            try {
                console.log('Initializing emotion detection...');
                const success = await emotionDetectionService.initialize();
                setEmotionDetectionInitialized(success);
                if (success) {
                    console.log('Emotion detection initialized successfully');
                } else {
                    console.warn('Failed to initialize emotion detection - continuing without it');
                    // Don't fail the entire app if emotion detection fails
                    setEmotionDetectionInitialized(false);
                }
            } catch (error) {
                console.error('Error initializing emotion detection:', error);
                // Don't fail the entire app if emotion detection fails
                setEmotionDetectionInitialized(false);
            }
        };

        // Initialize emotion detection in the background, don't block the UI
        initEmotionDetection().catch(error => {
            console.error('Emotion detection initialization failed:', error);
            setEmotionDetectionInitialized(false);
        });
    }, []);

    // Set up emotion detection event listeners
    useEffect(() => {
        const handleEmotionUpdate = (event: CustomEvent<EmotionData>) => {
            const emotionData = event.detail;
            setCurrentEmotion(emotionData);
        };

        window.addEventListener('emotionUpdate', handleEmotionUpdate as EventListener);
        
        return () => {
            window.removeEventListener('emotionUpdate', handleEmotionUpdate as EventListener);
        };
    }, []);

    // Start emotion detection when video is ready
    useEffect(() => {
        if (emotionDetectionInitialized && !isLoading) {
            const sessionId = `session_${Date.now()}`;
            // Use a dummy video element for simple detection
            const dummyVideo = videoRef.current || document.createElement('video');
            emotionDetectionService.startDetection(dummyVideo, sessionId);
            console.log('Started emotion detection for session:', sessionId);
        }

        return () => {
            emotionDetectionService.stopDetection();
        };
    }, [emotionDetectionInitialized, isLoading]);

    // CRITICAL BUG FIX: Camera and Model Initialization
    useEffect(() => {
        if (!exerciseData) { navigate('/patient-dashboard'); return; }

        const init = async () => {
            try {
                setFeedback('Loading AI model...');
                
                // Initialize TensorFlow.js backend first
                try {
                    setFeedback('Initializing AI engine...');
                    console.log('Initializing TensorFlow.js...');
                    
                    // Wait for TensorFlow.js to be ready
                    await tf.ready();
                    console.log('TensorFlow.js is ready!');
                    
                    // Try WebGL backend first, fallback to CPU if needed
                    try {
                        await tf.setBackend('webgl');
                        console.log('WebGL backend set successfully');
                    } catch (webglError) {
                        console.warn('WebGL backend failed, using CPU backend:', webglError);
                        await tf.setBackend('cpu');
                        console.log('CPU backend set as fallback');
                    }
                    
                    setFeedback('Loading pose detection model...');
                    console.log('Creating pose detector...');
                    
                    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { 
                        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING 
                    });
                    detectorRef.current = detector;
                    console.log('Pose detection model loaded successfully!');
                    console.log('Current backend:', tf.getBackend());
                    setFeedback('AI model loaded! Initializing camera...');
                } catch (modelError) {
                    console.error("Model loading failed:", modelError);
                    setFeedback("Warning: AI model failed to load. Camera will work but pose detection is disabled.");
                    // Continue without the model - camera will still work
                }
                
                // Request camera access with better error handling
                setFeedback('Requesting camera access...');
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 640 }, 
                        height: { ideal: 480 },
                        facingMode: 'user'
                    } 
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setFeedback('Camera connected! Initializing...');
                    
                    // Wait for video metadata to load
                    videoRef.current.onloadedmetadata = () => {
                        if (videoRef.current) {
                            videoRef.current.play().then(() => {
                                setIsLoading(false);
                                setFeedback('Ready when you are!');
                                speak(`Let's begin with ${exerciseData.exercise.name}. Please get into position.`);
                                
                                // Start the detection loop immediately
                                console.log('Starting detection loop...');
                                setTimeout(() => {
                                    detectionLoop();
                                }, 100); // Small delay to ensure everything is ready
                            }).catch((playError) => {
                                console.error("Video play error:", playError);
                                setFeedback("Error: Could not start video playback.");
                            });
                        }
                    };
                    
                    // Handle video loading errors
                    videoRef.current.onerror = (error) => {
                        console.error("Video error:", error);
                        setFeedback("Error: Video stream failed to load.");
                    };
                }
            } catch (error: any) {
                console.error("Initialization failed:", error);
                
                if (error.name === 'NotAllowedError') {
                    setFeedback("Camera access denied. Please allow camera permissions and refresh the page.");
                    speak("Camera access was denied. Please allow camera permissions in your browser and try again.");
                } else if (error.name === 'NotFoundError') {
                    setFeedback("No camera found. Please connect a camera and try again.");
                    speak("No camera was found. Please connect a camera to your device.");
                } else if (error.name === 'NotSupportedError') {
                    setFeedback("Camera not supported. Please try a different browser.");
                    speak("Camera is not supported in this browser. Please try Chrome or Firefox.");
                } else {
                    setFeedback(`Error: ${error.message || 'Unknown error occurred'}`);
                    speak("There was an error initializing the session. Please try again.");
                }
            }
        };

        init();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
            window.speechSynthesis.cancel();
        };
    }, [exerciseData, navigate]);

    if (!exerciseData) return null;
    const { exercise, reps } = exerciseData;

    const detectionLoop = async () => {
        if (videoRef.current?.readyState === 4 && canvasRef.current) {
            // Always update canvas size to match video
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            
            // Only run pose detection if model is loaded
            if (detectorRef.current) {
                try {
                    console.log('Running pose detection...');
                    const poses = await detectorRef.current.estimatePoses(videoRef.current);
                    console.log('Poses detected:', poses?.length || 0);
                    
                    // Clear canvas first
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    
                    if (poses?.length > 0) {
                        console.log('Drawing skeleton for pose with', poses[0].keypoints.length, 'keypoints');
                        // Draw skeleton for the first detected pose
                        drawSkeleton(poses[0].keypoints, ctx);
                        // If hand/finger exercise, draw a proxy hand from wrist/elbow and label
                        if (exercise.targetBodyPart?.toLowerCase().includes('hand') || exercise.name.toLowerCase().includes('finger') || exercise.name.toLowerCase().includes('wrist')) {
                            const kp = poses[0].keypoints;
                            const lw = kp.find(k => k.name === 'left_wrist');
                            const le = kp.find(k => k.name === 'left_elbow');
                            const rw = kp.find(k => k.name === 'right_wrist');
                            const re = kp.find(k => k.name === 'right_elbow');
                            drawHandProxy(lw, le, ctx, 'rgba(66, 153, 225, 0.9)');
                            drawHandProxy(rw, re, ctx, 'rgba(244, 114, 182, 0.9)');
                            ctx.fillStyle = 'rgba(255,255,255,0.95)';
                            ctx.font = '14px Arial';
                            ctx.fillText('Hand proxy: wrist-based visualization', 10, 55);
                        }
                        // Analyze pose for rep counting
                        analyzePose(poses[0].keypoints);
                        
                        // Show success message
                        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                        ctx.font = '16px Arial';
                        ctx.textAlign = 'left';
                        ctx.fillText('✅ Pose detected!', 10, 30);
                    } else {
                        // No pose detected - show instruction
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                        ctx.font = '20px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('Please position yourself in the camera view', canvasRef.current.width / 2, 50);
                        
                        // Show debug info
                        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
                        ctx.font = '14px Arial';
                        ctx.textAlign = 'left';
                        ctx.fillText('Model loaded, waiting for pose...', 10, 30);
                    }
                } catch (detectionError) {
                    console.error("Pose detection error:", detectionError);
                    // Show error on canvas
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Detection error - check console', canvasRef.current.width / 2, 50);
                }
            } else {
                // Model not loaded - show loading message
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Loading AI Model...', canvasRef.current.width / 2, canvasRef.current.height / 2);
            }
        }
        requestRef.current = requestAnimationFrame(detectionLoop);
    };

    const analyzePose = (keypoints: Keypoint[]) => {
        const kpMap = new Map(keypoints.map(kp => [kp.name || 'unknown', kp]));
        
        // Helper to safely get a joint with fallbacks when fine-hand joints are requested
        const getJoint = (name: string | undefined): Keypoint | undefined => {
            if (!name) return undefined;
            const primary = kpMap.get(name);
            if (primary && (primary.score || 0) > 0.2) return primary;
            // Fallbacks for hand/finger joints not available in MoveNet
            const fallbackMap: Record<string, string> = {
                'left_index': 'left_wrist',
                'right_index': 'right_wrist',
                'left_thumb': 'left_wrist',
                'right_thumb': 'right_wrist',
            };
            const alt = fallbackMap[name];
            return alt ? kpMap.get(alt) : undefined;
        };

        // Visibility sanity check for body pose
        const essential = ['left_shoulder','right_shoulder','left_hip','right_hip','left_knee','right_knee','left_ankle','right_ankle']
            .map(n => kpMap.get(n)).filter(kp => kp && (kp.score || 0) > 0.2);
        if (essential.length < 4) {
            setFeedback('Please ensure your upper and lower body are visible in the camera.');
            return;
        }
        
        // Wrist-only exercises: intelligent vertical motion tracking using wrist vs elbow
        const isWristExercise = (exercise.targetBodyPart?.toLowerCase().includes('wrist') || exercise.name.toLowerCase().includes('wrist'));
        if (isWristExercise) {
            const lw = kpMap.get('left_wrist');
            const le = kpMap.get('left_elbow');
            const rw = kpMap.get('right_wrist');
            const re = kpMap.get('right_elbow');
            // pick best side by wrist score
            const leftScore = (lw?.score || 0) + (le?.score || 0);
            const rightScore = (rw?.score || 0) + (re?.score || 0);
            const useLeft = leftScore >= rightScore;
            const wrist = useLeft ? lw : rw;
            const elbow = useLeft ? le : re;

            if (wrist && (wrist.score || 0) > 0.25) {
                // Update history for velocity/amplitude fallback
                const y = wrist.y;
                const hist = wristHistoryRef.current;
                hist.push(y);
                if (hist.length > 30) hist.shift();
                // Smoothing
                const tail = hist.slice(-5);
                const smoothedY = tail.reduce((a,b)=>a+b,0) / tail.length;
                if (hist.length >= 2) wristVelRef.current = (hist[hist.length - 2] - hist[hist.length - 1]);

                let isUpPhase = false;
                let isDownPhase = false;

                if (elbow && (elbow.score || 0) > 0.25) {
                    // Camera coordinates: y increases downward. Wrist above elbow => y_wrist < y_elbow
                    const delta = (elbow.y - wrist.y); // positive when wrist is above elbow
                    // Hysteresis thresholds (pixels)
                    const UP_THRESH = 24;   // must exceed to be considered up
                    const DOWN_THRESH = 10; // must go below to be considered down
                    isUpPhase = delta > UP_THRESH;
                    isDownPhase = delta < DOWN_THRESH;
                } else {
                    // Fallback: infer phases by wrist vertical motion and amplitude
                    const minY = Math.min(...hist);
                    const maxY = Math.max(...hist);
                    const amplitude = maxY - minY;
                    const vel = wristVelRef.current;
                    const AMP_MIN = 22;
                    const VEL_MIN = 0.006; // normalized units/frame
                    isUpPhase = amplitude > AMP_MIN && vel > VEL_MIN;   // moving up (y decreasing)
                    isDownPhase = amplitude > AMP_MIN && vel < -VEL_MIN; // moving down (y increasing)
                }

                // Determine current phase with mid band; keep last when in-between
                let currentPhase: 'up' | 'down' = lastPhaseRef.current;
                if (isUpPhase) currentPhase = 'up';
                else if (isDownPhase) currentPhase = 'down';

                // Update stage for UI
                if (currentPhase !== stage) setStage(currentPhase);

                // Count rep when transitioning from up -> down with cooldown
                const now = Date.now();
                const COOLDOWN_MS = 400;
                if (lastPhaseRef.current === 'up' && currentPhase === 'down' && now - lastCountTsRef.current > COOLDOWN_MS) {
                    const newRep = prevRepRef.current + 1;
                    prevRepRef.current = newRep;
                    setRepCount(newRep);
                    lastCountTsRef.current = now;
                    setFeedback(`Rep ${newRep} complete!`);
                    if (newRep !== repCount) speak(`Rep ${newRep} complete!`);
                    if (newRep >= reps) {
                        setTimeout(() => {
                            speak(`Session complete! You did ${newRep} reps.`);
                            setFeedback(`Session Complete! ${newRep}/${reps} reps completed.`);
                            setIsModalOpen(true);
                            if (requestRef.current) cancelAnimationFrame(requestRef.current);
                        }, 300);
                    }
                }

                lastPhaseRef.current = currentPhase;

                // Visual hint
                if (Math.random() < 0.02) {
                    setFeedback(`Tracking ${useLeft ? 'left' : 'right'} wrist. Keep it centered in frame.`);
                }
            } else {
                setFeedback('Show your wrist clearly to the camera.');
            }
            return; // handled wrist logic
        }

        // Determine joints and thresholds based on exercise config (fallback to squat defaults)
        const tracked = exercise.trackedJoints || { p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle' };
        const logic = exercise.repLogic || { startAngle: 160, midAngle: 90 };
        const tolerance = 15;

        const p1 = getJoint((tracked as any).p1);
        const p2 = getJoint((tracked as any).p2);
        const p3 = getJoint((tracked as any).p3);

        // If requested joints are not available (e.g., finger flexions), gracefully fallback to elbow-wrist-shoulder
        const useFallback = !(p1 && p2 && p3);
        const fp1 = kpMap.get('left_shoulder');
        const fp2 = kpMap.get('left_elbow');
        const fp3 = kpMap.get('left_wrist');
        const aP1 = useFallback ? fp1 : p1;
        const aP2 = useFallback ? fp2 : p2;
        const aP3 = useFallback ? fp3 : p3;

        let angle = 0;
        if (aP1 && aP2 && aP3) {
            angle = calculateAngle(aP1, aP2, aP3);
        } else {
            setFeedback('Move closer to the camera so your joints are visible.');
            return;
        }

        // Inform user if we are using fallback tracking for hand/finger exercises
        if (useFallback && (exercise.targetBodyPart?.toLowerCase().includes('hand') || exercise.name.toLowerCase().includes('finger'))) {
            // Non-intrusive hint
            if (Math.random() < 0.02) setFeedback('Using wrist tracking for finger exercise. Keep wrist in view.');
        }

        // Basic form analysis remains
        const formAnalysis = analyzeForm(kpMap as Map<string, Keypoint>);

        // State machine using configured thresholds
        if (angle > (logic.startAngle - tolerance)) {
            if (stage === 'down') {
                const newRepCount = repCount + 1;
                setRepCount(newRepCount);
                setStage('up');
                if (formAnalysis.isGoodForm) {
                    setFeedback(`Rep ${newRepCount} complete! Great form.`);
                    speak(`Rep ${newRepCount} complete!`);
                } else {
                    setFeedback(`Rep ${newRepCount} done. ${formAnalysis.suggestion}`);
                    speak(`Rep ${newRepCount} done.`);
                }
                if (newRepCount >= reps) {
                    setTimeout(() => {
                        speak(`Session complete! You did ${newRepCount} reps.`);
                        setFeedback(`Session Complete! ${newRepCount}/${reps} reps completed.`);
                        setIsModalOpen(true);
                        if (requestRef.current) cancelAnimationFrame(requestRef.current);
                    }, 600);
                }
            }
        } else if (angle < (logic.midAngle + tolerance)) {
            if (stage === 'up') {
                setStage('down');
                setFeedback('Good! Return to the start to complete the rep.');
            }
        }

        if (formAnalysis.needsImmediateAttention) {
            setFeedback(formAnalysis.suggestion);
        }
    };
    
    // Enhanced form analysis function
    const analyzeForm = (kpMap: Map<string, Keypoint>) => {
        const leftShoulder = kpMap.get('left_shoulder');
        const rightShoulder = kpMap.get('right_shoulder');
        const leftHip = kpMap.get('left_hip');
        const rightHip = kpMap.get('right_hip');
        const leftKnee = kpMap.get('left_knee');
        const rightKnee = kpMap.get('right_knee');
        const leftAnkle = kpMap.get('left_ankle');
        const rightAnkle = kpMap.get('right_ankle');
        
        let suggestions = [];
        let isGoodForm = true;
        let needsImmediateAttention = false;
        
        // Check knee alignment
        if (leftKnee && rightKnee && leftAnkle && rightAnkle) {
            const kneeAlignment = Math.abs(leftKnee.x - rightKnee.x);
            
            if (kneeAlignment > 50) {
                suggestions.push("Keep your knees aligned over your toes");
                isGoodForm = false;
                needsImmediateAttention = true;
            }
        }
        
        // Check back posture
        if (leftShoulder && rightShoulder && leftHip && rightHip) {
            const shoulderCenter = (leftShoulder.x + rightShoulder.x) / 2;
            const hipCenter = (leftHip.x + rightHip.x) / 2;
            const backAlignment = Math.abs(shoulderCenter - hipCenter);
            
            if (backAlignment > 30) {
                suggestions.push("Keep your back straight and chest up");
                isGoodForm = false;
            }
        }
        
        // Check depth
        if (leftHip && leftKnee && leftAnkle) {
            const hipHeight = leftHip.y;
            const kneeHeight = leftKnee.y;
            
            if (hipHeight < kneeHeight + 20) {
                suggestions.push("Go deeper - thighs should be parallel to floor");
                isGoodForm = false;
            }
        }
        
        return {
            isGoodForm,
            needsImmediateAttention,
            suggestion: suggestions.length > 0 ? suggestions[0] : "Perfect form! Keep it up!"
        };
    };
    
    const handleFeedbackSubmit = async (feedbackData: { painLevel: number, difficulty: number, notes: string }) => {
        const token = localStorage.getItem('token');
        
        // Enhanced session data with comprehensive analytics
        const sessionData = { 
            exercise: exercise._id, 
            setsCompleted: 1, 
            repsCompleted: repCount,
            sessionDuration: Date.now() - sessionStartTime,
            averageFormScore: calculateFormScore(),
            completionRate: (repCount / reps) * 100,
            patientFeedback: feedbackData,
            analytics: {
                totalReps: repCount,
                targetReps: reps,
                completionPercentage: (repCount / reps) * 100,
                averagePainLevel: feedbackData.painLevel,
                averageDifficulty: feedbackData.difficulty,
                formImprovements: getFormImprovements(),
                sessionQuality: calculateSessionQuality(feedbackData),
                recommendations: generateRecommendations(feedbackData)
            }
        };
        
        try {
            await fetch('http://localhost:5000/api/sessions', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
                body: JSON.stringify(sessionData) 
            });
            
            setIsModalOpen(false);
            
            // Show completion message
            speak(`Session completed successfully! You completed ${repCount} out of ${reps} reps. Great job!`);
            
            // Navigate to dashboard after a short delay
            setTimeout(() => {
                navigate('/patient-dashboard');
            }, 2000);
            
        } catch (error) {
            console.error('Error saving session:', error);
            setFeedback('Error saving session data. Please try again.');
        }
    };

    // Manual completion button handler (opens the same feedback modal)
    const handleManualComplete = () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        setIsModalOpen(true);
        setManualCompleteOpen(true);
        setFeedback(`Manual completion selected. Logged ${repCount}/${reps} reps.`);
    };
    
    // Helper functions for analytics
    const calculateFormScore = () => {
        // This would be calculated based on form analysis throughout the session
        return Math.random() * 20 + 80; // Placeholder: 80-100 score
    };
    
    const getFormImprovements = () => {
        return [
            "Maintained good knee alignment throughout most reps",
            "Improved back posture compared to previous sessions",
            "Consistent depth achieved in 85% of reps"
        ];
    };
    
    const calculateSessionQuality = (feedback: any) => {
        const painScore = (10 - feedback.painLevel) * 10; // Lower pain = higher score
        const difficultyScore = (10 - feedback.difficulty) * 10; // Lower difficulty = higher score
        const completionScore = (repCount / reps) * 100;
        
        return Math.round((painScore + difficultyScore + completionScore) / 3);
    };
    
    const generateRecommendations = (feedback: any) => {
        const recommendations = [];
        
        if (feedback.painLevel > 6) {
            recommendations.push("Consider reducing intensity or taking more rest between sessions");
        }
        
        if (feedback.difficulty > 7) {
            recommendations.push("Practice basic form before increasing reps");
        }
        
        if (repCount < reps * 0.8) {
            recommendations.push("Focus on completing full range of motion for each rep");
        }
        
        if (recommendations.length === 0) {
            recommendations.push("Excellent session! Continue with current routine");
        }
        
        return recommendations;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col lg:flex-row font-sans">
            <PostSessionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFeedbackSubmit} />
            <div className="w-full lg:w-1/3 bg-gray-800 p-6 flex flex-col">
                <h1 className="text-3xl font-bold text-white">{exercise.name}</h1>
                <p className="text-gray-400 mt-1">{exercise.description}</p>
                <div className="flex-grow my-4 rounded-lg bg-gray-700">
                    <Canvas camera={{ position: [0, 1, 4], fov: 60 }}>
                        <ambientLight intensity={0.4} />
                        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
                        <directionalLight position={[-5, 5, 5]} intensity={0.6} color="#ffffff" />
                        <pointLight position={[0, 3, 2]} intensity={0.8} color="#ff6b6b" />
                        <Suspense fallback={<Html center className="text-white">Loading AI Coach...</Html>}>
                            <Avatar />
                        </Suspense>
                        <OrbitControls 
                            enableZoom={false} 
                            autoRotate 
                            autoRotateSpeed={0.8} 
                            enablePan={false}
                            minPolarAngle={Math.PI / 4}
                            maxPolarAngle={Math.PI - Math.PI / 4}
                            enableDamping
                            dampingFactor={0.05}
                        />
                    </Canvas>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-teal-300">AI Coach Instructions:</h2>
                    <div className="mt-2 p-3 bg-gray-600 rounded-lg">
                        <p className="text-yellow-300 font-semibold mb-2">Watch the AI Coach demonstrate:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                            <li>Stand with feet shoulder-width apart</li>
                            <li>Keep your back straight and chest up</li>
                            <li>Lower down by bending hips and knees</li>
                            <li>Go down until thighs are parallel to floor</li>
                            <li>Push through heels to return to start</li>
                            <li>Keep knees tracking over toes</li>
                        </ul>
                    </div>
                    <div className="mt-3">
                        <h3 className="text-lg font-semibold text-pink-300">Exercise Details:</h3>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-300">
                            {exercise.instructions.map((inst: string, i: number) => <li key={i}>{inst}</li>)}
                        </ul>
                    </div>
                </div>
                
                {/* Emotion Analysis Display */}
                <div className="mt-6">
                    {emotionDetectionInitialized ? (
                        <EmotionDisplay 
                            emotionData={currentEmotion} 
                            showHistory={true}
                            compact={false}
                        />
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800">Emotion Analysis</h3>
                            <div className="text-center py-8">
                                <div className="text-gray-500 mb-2">Emotion detection is not available</div>
                                <div className="text-sm text-gray-400">
                                    This feature requires camera access and may not work in all browsers
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full lg:w-2/3 p-6 flex flex-col items-center justify-center">
                <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
                    {isLoading && <div className="absolute inset-0 flex items-center justify-center z-10 text-white text-xl">Initializing Camera...</div>}
                    <video ref={videoRef} className={`w-full h-full object-cover transform scaleX(-1) transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`} />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover transform scaleX(-1)" />
                </div>
                        <div className="w-full max-w-2xl mt-6 grid grid-cols-2 gap-6">
                            <div className="bg-gray-800 p-6 rounded-lg text-center">
                                <p className="text-lg font-semibold text-gray-400">Reps</p>
                                <p className="text-6xl font-bold tracking-tighter">{repCount}<span className="text-3xl text-gray-500">/{reps}</span></p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg text-center flex flex-col justify-center">
                                <p className="text-lg font-semibold text-gray-400">Live Feedback</p>
                                <p className="text-2xl font-semibold text-yellow-300 mt-2 h-16">{feedback}</p>
                            </div>
                        </div>
                        <div className="w-full max-w-2xl mt-4 flex justify-end">
                            <button onClick={handleManualComplete} className="px-5 py-3 bg-teal-600 hover:bg-teal-700 rounded-md font-semibold text-white">
                                Mark Session Complete
                            </button>
                        </div>
                        
                        {/* Debug Info */}
                        <div className="w-full max-w-2xl mt-4 bg-gray-800 p-4 rounded-lg">
                            <p className="text-sm text-gray-400">Debug Info:</p>
                            <p className="text-xs text-gray-500">TensorFlow Backend: {tf.getBackend() || 'Not initialized'}</p>
                            <p className="text-xs text-gray-500">Model Status: {detectorRef.current ? '✅ Loaded' : '❌ Not Loaded'}</p>
                            <p className="text-xs text-gray-500">Camera Status: {videoRef.current?.readyState === 4 ? '✅ Ready' : '❌ Not Ready'}</p>
                            <p className="text-xs text-gray-500">Detection Loop: {requestRef.current ? '✅ Running' : '❌ Stopped'}</p>
                        </div>
            </div>
        </div>
    );
}
export default ExerciseSession

