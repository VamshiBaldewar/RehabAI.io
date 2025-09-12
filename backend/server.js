const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_jwt_secret_key_which_should_be_long_and_random';

app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect("mongodb://localhost:27017/rehab-ai")
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas ---
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['patient', 'clinician'] },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    condition: { type: String }, // Patient specific
    assignedClinician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Patient specific
    patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Clinician specific
}, { timestamps: true });
const User = mongoose.model('User', UserSchema);

const ExerciseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    instructions: [String],
    targetBodyPart: { type: String },
    trackedJoints: { // Joints used for angle calculation
        p1: { type: String, required: true }, // e.g., 'left_shoulder'
        p2: { type: String, required: true }, // e.g., 'left_elbow'
        p3: { type: String, required: true }, // e.g., 'left_wrist'
    },
    repLogic: {
        startAngle: { type: Number, required: true },
        midAngle: { type: Number, required: true },
    }
});
const Exercise = mongoose.model('Exercise', ExerciseSchema);

const PrescriptionSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clinician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exercises: [{
        exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
        sets: { type: Number },
        reps: { type: Number },
    }],
}, { timestamps: true });
const Prescription = mongoose.model('Prescription', PrescriptionSchema);

const SessionSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    setsCompleted: { type: Number },
    repsCompleted: { type: Number },
    averageFormScore: { type: Number },
    completionRate: { type: Number },
    patientFeedback: {
        painLevel: { type: Number }, // 1-10
        difficulty: { type: Number }, // 1-10
        notes: { type: String }
    },
    analytics: {
        totalReps: Number,
        targetReps: Number,
        completionPercentage: Number,
        averagePainLevel: Number,
        averageDifficulty: Number,
        formImprovements: [String],
        sessionQuality: Number,
        recommendations: [String]
    }
}, { timestamps: true });
const Session = mongoose.model('Session', SessionSchema);

// NEW: Appointments
const AppointmentSchema = new mongoose.Schema({
    clinician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: { type: String, enum: ['available', 'booked', 'cancelled'], default: 'available' },
    notes: { type: String }
}, { timestamps: true });
const Appointment = mongoose.model('Appointment', AppointmentSchema);

// --- Auth Routes (Unchanged) ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, role, firstName, lastName } = req.body;
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ email, password: hashedPassword, role, firstName, lastName });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully.' });
    } catch (error) { res.status(500).json({ message: 'Server error during signup.' }); }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });
        const token = jwt.sign({ userId: user._id, role: user.role, firstName: user.firstName }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } });
    } catch (error) { res.status(500).json({ message: 'Server error during login.' }); }
});

// --- Middleware ---
const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (e) { res.status(401).json({ message: 'Authentication failed.' }); }
};

// --- API Routes ---
app.get('/api/patient/prescription', auth, async (req, res) => {
    const prescription = await Prescription.findOne({ patient: req.user.userId }).populate('exercises.exercise').populate('clinician', 'firstName lastName');
    res.json(prescription);
});
// NEW: Get sessions for logged-in patient
app.get('/api/patient/sessions', auth, async (req, res) => {
    try {
        const sessions = await Session.find({ patient: req.user.userId }).populate('exercise').sort({ createdAt: -1 });
        res.json(sessions);
    } catch (e) { res.status(500).json({ message: 'Error fetching sessions' }); }
});
app.get('/api/clinician/patients', auth, async (req, res) => {
    const clinician = await User.findById(req.user.userId).populate('patients', 'firstName lastName condition');
    res.json(clinician.patients);
});

// NEW: Appointments APIs
app.get('/api/appointments', auth, async (req, res) => {
    try {
        const filter = req.user.role === 'patient' ? { patient: req.user.userId } : { clinician: req.user.userId };
        const appts = await Appointment.find(filter)
            .populate('clinician', 'firstName lastName')
            .populate('patient', 'firstName lastName')
            .sort({ start: 1 });
        res.json(appts);
    } catch (e) { res.status(500).json({ message: 'Error fetching appointments' }); }
});

app.get('/api/appointments/availability', auth, async (req, res) => {
    if (req.user.role !== 'patient') return res.status(403).send('Forbidden');
    try {
        const me = await User.findById(req.user.userId);
        if (!me.assignedClinician) return res.json([]);
        const slots = await Appointment.find({ clinician: me.assignedClinician, status: 'available', start: { $gte: new Date() } })
            .sort({ start: 1 })
            .limit(50);
        res.json(slots);
    } catch (e) { res.status(500).json({ message: 'Error fetching availability' }); }
});

app.post('/api/appointments/book', auth, async (req, res) => {
    if (req.user.role !== 'patient') return res.status(403).send('Forbidden');
    try {
        const { slotId } = req.body;
        const updated = await Appointment.findOneAndUpdate(
            { _id: slotId, status: 'available' },
            { status: 'booked', patient: req.user.userId },
            { new: true }
        );
        if (!updated) return res.status(400).json({ message: 'Slot no longer available' });
        res.json(updated);
    } catch (e) { res.status(500).json({ message: 'Error booking appointment' }); }
});

// Clinician: add availability slot(s)
app.post('/api/clinician/availability', auth, async (req, res) => {
    if (req.user.role !== 'clinician') return res.status(403).send('Forbidden');
    try {
        const { slots } = req.body; // [{ start, end }]
        if (!Array.isArray(slots) || slots.length === 0) return res.status(400).json({ message: 'No slots provided' });
        const docs = slots.map(s => ({ clinician: req.user.userId, start: new Date(s.start), end: new Date(s.end), status: 'available' }));
        const created = await Appointment.insertMany(docs);
        res.status(201).json(created);
    } catch (e) { res.status(500).json({ message: 'Error adding availability' }); }
});

// Clinician: view their availability (future)
app.get('/api/clinician/availability', auth, async (req, res) => {
    if (req.user.role !== 'clinician') return res.status(403).send('Forbidden');
    try {
        const slots = await Appointment.find({ clinician: req.user.userId, start: { $gte: new Date() } }).sort({ start: 1 });
        res.json(slots);
    } catch (e) { res.status(500).json({ message: 'Error fetching availability' }); }
});

// NEW: Get detailed info for a single patient
app.get('/api/clinician/patient/:id', auth, async (req, res) => {
    if (req.user.role !== 'clinician') return res.status(403).send('Forbidden');
    try {
        const patient = await User.findById(req.params.id).select('-password');
        const prescription = await Prescription.findOne({ patient: req.params.id }).populate('exercises.exercise');
        const sessions = await Session.find({ patient: req.params.id }).populate('exercise').sort({ createdAt: -1 });
        res.json({ patient, prescription, sessions });
    } catch (e) { res.status(500).json({ message: 'Error fetching patient details' }); }
});

// NEW: Save a completed session
app.post('/api/sessions', auth, async (req, res) => {
    if (req.user.role !== 'patient') return res.status(403).send('Forbidden');
    try {
        const session = new Session({ ...req.body, patient: req.user.userId });
        await session.save();
        res.status(201).json(session);
    } catch (e) { res.status(500).json({ message: 'Error saving session' }); }
});

// NEW: List all exercises
app.get('/api/exercises', auth, async (req, res) => {
    try {
        const exercises = await Exercise.find({}).sort({ name: 1 });
        res.json(exercises);
    } catch (e) { res.status(500).json({ message: 'Error fetching exercises' }); }
});

// NEW: Clinician adds a new patient
app.post('/api/clinician/add-patient', auth, async (req, res) => {
    if (req.user.role !== 'clinician') return res.status(403).send('Forbidden');
    try {
        const { email, password, firstName, lastName, condition } = req.body;
        const hashed = await bcrypt.hash(password, 12);
        const patient = await new User({ email, password: hashed, role: 'patient', firstName, lastName, condition, assignedClinician: req.user.userId }).save();
        const clinician = await User.findById(req.user.userId);
        clinician.patients.push(patient._id);
        await clinician.save();
        res.status(201).json({ patientId: patient._id });
    } catch (e) { res.status(500).json({ message: 'Error adding patient' }); }
});

// NEW: Clinician assigns or updates a prescription for a patient
app.post('/api/clinician/prescribe', auth, async (req, res) => {
    if (req.user.role !== 'clinician') return res.status(403).send('Forbidden');
    try {
        const { patientId, exercises } = req.body; // exercises: [{ exerciseId, sets, reps }]
        let prescription = await Prescription.findOne({ patient: patientId });
        const formatted = exercises.map(e => ({ exercise: e.exerciseId, sets: e.sets, reps: e.reps }));
        if (!prescription) {
            prescription = await Prescription.create({ patient: patientId, clinician: req.user.userId, exercises: formatted });
        } else {
            prescription.exercises = formatted;
            await prescription.save();
        }
        const populated = await Prescription.findById(prescription._id).populate('exercises.exercise');
        res.json(populated);
    } catch (e) { res.status(500).json({ message: 'Error saving prescription' }); }
});

// --- Database Seeding ---
app.post('/api/seed', async (req, res) => {
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped.');

    // Create Exercises (pre-existing list)
    const exercises = await Exercise.create([
        { name: 'Wrist Curls', description: 'Strengthen forearm flexors.', instructions: ['Hold light weight.', 'Curl wrist up and down.'], targetBodyPart: 'Wrist', trackedJoints: { p1: 'left_elbow', p2: 'left_wrist', p3: 'left_index' }, repLogic: { startAngle: 170, midAngle: 90 } },
        { name: 'Wrist Fixation', description: 'Isometric wrist stabilization in neutral position.', instructions: ['Keep forearm supported.', 'Hold wrist steady against gentle resistance.'], targetBodyPart: 'Wrist', trackedJoints: { p1: 'left_elbow', p2: 'left_wrist', p3: 'left_index' }, repLogic: { startAngle: 170, midAngle: 150 } },
        { name: 'Wrist Rotations', description: 'Improve wrist mobility with rotational movement.', instructions: ['Keep elbow still.', 'Rotate wrist clockwise and counter-clockwise.'], targetBodyPart: 'Wrist', trackedJoints: { p1: 'left_elbow', p2: 'left_wrist', p3: 'left_index' }, repLogic: { startAngle: 160, midAngle: 100 } },
        { name: 'Jumping Jacks', description: 'Full-body cardio warmup.', instructions: ['Jump feet apart and raise arms.', 'Return to start, repeat.'], targetBodyPart: 'Full Body', trackedJoints: { p1: 'left_hip', p2: 'left_shoulder', p3: 'left_wrist' }, repLogic: { startAngle: 160, midAngle: 60 } },
        { name: 'Finger Flexions', description: 'Improve finger mobility.', instructions: ['Open and close fist.', 'Squeeze gently.'], targetBodyPart: 'Hand', trackedJoints: { p1: 'left_wrist', p2: 'left_index', p3: 'left_thumb' }, repLogic: { startAngle: 150, midAngle: 70 } },
        { name: 'Neck Rotations', description: 'Gentle neck mobility.', instructions: ['Rotate head left and right.', 'Keep shoulders relaxed.'], targetBodyPart: 'Neck', trackedJoints: { p1: 'left_shoulder', p2: 'nose', p3: 'right_shoulder' }, repLogic: { startAngle: 160, midAngle: 80 } },
        { name: 'Squats', description: 'Lower body strength.', instructions: ['Feet shoulder-width.', 'Lower hips back and down.'], targetBodyPart: 'Lower Body', trackedJoints: { p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle' }, repLogic: { startAngle: 170, midAngle: 90 } },
        { name: 'Hand Raises', description: 'Shoulder mobility and strength.', instructions: ['Raise arms overhead.', 'Lower slowly.'], targetBodyPart: 'Shoulder', trackedJoints: { p1: 'left_hip', p2: 'left_shoulder', p3: 'left_wrist' }, repLogic: { startAngle: 60, midAngle: 150 } },
        { name: 'Pendulum Swings', description: 'Gentle shoulder mobility.', instructions: ['Lean over, let your arm hang.', 'Swing it gently in circles.'], targetBodyPart: 'Shoulder', trackedJoints: { p1: 'left_hip', p2: 'left_shoulder', p3: 'left_elbow' }, repLogic: { startAngle: 80, midAngle: 100 } },
        { name: 'Wall Push-ups', description: 'Low-impact shoulder strengthening.', instructions: ['Face a wall, hands on wall.', 'Bend elbows, lean in, push out.'], targetBodyPart: 'Shoulder', trackedJoints: { p1: 'left_shoulder', p2: 'left_elbow', p3: 'left_wrist' }, repLogic: { startAngle: 170, midAngle: 90 } },
        { name: 'Seated Knee Flexion', description: 'Improve knee ROM.', instructions: ['Sit on a chair.', 'Slowly bend and straighten your knee.'], targetBodyPart: 'Knee', trackedJoints: { p1: 'left_hip', p2: 'left_knee', p3: 'left_ankle' }, repLogic: { startAngle: 170, midAngle: 80 } },
        { name: 'Glute Bridges', description: 'Strengthen glutes and lower back.', instructions: ['Lie on your back.', 'Lift your hips off the floor.'], targetBodyPart: 'Hips', trackedJoints: { p1: 'left_shoulder', p2: 'left_hip', p3: 'left_knee' }, repLogic: { startAngle: 170, midAngle: 120 } }
    ]);
    console.log(`${exercises.length} exercises created.`);

    // Create Clinicians
    const clinicians = await Promise.all([
        new User({ firstName: 'Evelyn', lastName: 'Reed', email: 'e.reed@rehab.ai', password: await bcrypt.hash('password123', 12), role: 'clinician' }).save(),
        new User({ firstName: 'Ben', lastName: 'Carter', email: 'b.carter@rehab.ai', password: await bcrypt.hash('password123', 12), role: 'clinician' }).save(),
        new User({ firstName: 'Maria', lastName: 'Garcia', email: 'm.garcia@rehab.ai', password: await bcrypt.hash('password123', 12), role: 'clinician' }).save()
    ]);
    console.log(`${clinicians.length} clinicians created.`);

    // Create Patients
    const patientsData = [
        { firstName: 'Alex', lastName: 'Ray', email: 'alex.r@example.com', condition: 'Chronic Shoulder Pain', clinician: clinicians[0] },
        { firstName: 'Sam', lastName: 'Jones', email: 'sam.j@example.com', condition: 'Chronic Shoulder Pain', clinician: clinicians[0] },
        { firstName: 'Casey', lastName: 'Smith', email: 'casey.s@example.com', condition: 'Lower Back Strain', clinician: clinicians[1] },
        { firstName: 'Jordan', lastName: 'Williams', email: 'jordan.w@example.com', condition: 'Rotator Cuff Tendinitis', clinician: clinicians[1] },
        { firstName: 'Taylor', lastName: 'Brown', email: 'taylor.b@example.com', condition: 'Knee Osteoarthritis', clinician: clinicians[2] },
        { firstName: 'Morgan', lastName: 'Davis', email: 'morgan.d@example.com', condition: 'Hip Flexor Strain', clinician: clinicians[2] },
    ];
    const patients = await Promise.all(patientsData.map(async (p) => {
        const patient = await new User({ ...p, password: await bcrypt.hash('password123', 12), role: 'patient', assignedClinician: p.clinician._id }).save();
        p.clinician.patients.push(patient._id);
        return patient;
    }));
    await Promise.all(clinicians.map(c => c.save()));
    console.log(`${patients.length} patients created and assigned.`);

    // Create Prescriptions
    await Prescription.create([
        { patient: patients[0]._id, clinician: clinicians[0]._id, exercises: [{ exercise: exercises.find(e=>e.name==='Pendulum Swings')._id, sets: 3, reps: 15 }, { exercise: exercises.find(e=>e.name==='Wall Push-ups')._id, sets: 2, reps: 10 }] },
        { patient: patients[1]._id, clinician: clinicians[0]._id, exercises: [{ exercise: exercises.find(e=>e.name==='Pendulum Swings')._id, sets: 3, reps: 12 }, { exercise: exercises.find(e=>e.name==='Hand Raises')._id, sets: 2, reps: 10 }] },
        { patient: patients[2]._id, clinician: clinicians[1]._id, exercises: [{ exercise: exercises[3]._id, sets: 4, reps: 10 }] },
        { patient: patients[3]._id, clinician: clinicians[1]._id, exercises: [{ exercise: exercises[1]._id, sets: 3, reps: 8 }] },
        { patient: patients[4]._id, clinician: clinicians[2]._id, exercises: [{ exercise: exercises[2]._id, sets: 3, reps: 15 }] },
        { patient: patients[5]._id, clinician: clinicians[2]._id, exercises: [{ exercise: exercises[3]._id, sets: 3, reps: 12 }] },
    ]);
    console.log('Prescriptions created.');

    // Demo clinician and patient with 3 months of sessions
    const demoClinician = await new User({ firstName: 'Dr', lastName: 'Demo', email: 'demo.doc@rehab.ai', password: await bcrypt.hash('DemoDoc!123', 12), role: 'clinician' }).save();
    const demoPatient = await new User({ firstName: 'John', lastName: 'Demo', email: 'demo.patient@rehab.ai', password: await bcrypt.hash('DemoPatient!123', 12), role: 'patient', condition: 'Post-op Knee Rehab', assignedClinician: demoClinician._id }).save();
    demoClinician.patients.push(demoPatient._id); await demoClinician.save();
    const demoPrescription = await Prescription.create({ patient: demoPatient._id, clinician: demoClinician._id, exercises: [ { exercise: exercises.find(e => e.name === 'Squats')._id, sets: 3, reps: 12 }, { exercise: exercises.find(e => e.name === 'Hand Raises')._id, sets: 2, reps: 10 } ] });
    // Seed ~90 daily sessions
    const today = new Date();
    const sessionsToInsert = [];
    for (let i = 0; i < 90; i++) {
        const d = new Date(); d.setDate(today.getDate() - i);
        const ex = i % 2 === 0 ? exercises.find(e => e.name === 'Squats') : exercises.find(e => e.name === 'Hand Raises');
        const targetReps = i % 2 === 0 ? 12 : 10;
        const repsCompleted = Math.max(6, Math.min(targetReps, Math.round(targetReps * (0.85 + Math.random()*0.2))));
        const pain = Math.max(1, Math.min(10, Math.round(4 + Math.sin(i/10)*2 + (Math.random()*2-1))));
        const difficulty = Math.max(1, Math.min(10, Math.round(5 + Math.cos(i/12)*2 + (Math.random()*2-1))));
        const formScore = Math.round(75 + Math.random()*20);
        const completion = Math.round((repsCompleted/targetReps)*100);
        const quality = Math.round((100 - pain*5 + (10 - difficulty)*5 + completion)/3);
        sessionsToInsert.push({
            patient: demoPatient._id,
            exercise: ex._id,
            prescription: demoPrescription._id,
            setsCompleted: 1,
            repsCompleted,
            averageFormScore: formScore,
            completionRate: completion,
            patientFeedback: { painLevel: pain, difficulty, notes: i % 7 === 0 ? 'Slight soreness after session.' : '' },
            analytics: {
                totalReps: repsCompleted,
                targetReps,
                completionPercentage: completion,
                averagePainLevel: pain,
                averageDifficulty: difficulty,
                formImprovements: [ 'Better knee alignment', 'Improved depth' ],
                sessionQuality: quality,
                recommendations: quality < 70 ? ['Reduce intensity next session'] : ['Maintain current plan']
            },
            createdAt: d,
            updatedAt: d
        });
    }
    await Session.insertMany(sessionsToInsert);

    // Seed 90 days of shoulder-focused sessions for Sam Jones
    const sam = patients.find(p => p.email === 'sam.j@example.com');
    if (sam) {
        const samPrescription = await Prescription.findOne({ patient: sam._id });
        const pendulum = exercises.find(e => e.name === 'Pendulum Swings');
        const wallPush = exercises.find(e => e.name === 'Wall Push-ups');
        const handRaises = exercises.find(e => e.name === 'Hand Raises');
        const samSessions = [];
        for (let i = 0; i < 90; i++) {
            const d = new Date(); d.setDate(today.getDate() - i);
            const ex = i % 3 === 0 ? pendulum : (i % 3 === 1 ? wallPush : handRaises);
            const targetReps = ex?.name === 'Wall Push-ups' ? 10 : 12;
            const repsCompleted = Math.max(6, Math.min(targetReps, Math.round(targetReps * (0.8 + Math.random()*0.25))));
            const pain = Math.max(1, Math.min(10, Math.round(6 - Math.sin(i/14)*1.5 + (Math.random()*2-1)))); // trending improvement
            const difficulty = Math.max(1, Math.min(10, Math.round(6 - Math.cos(i/16)*1 + (Math.random()*2-1))));
            const formScore = Math.round(70 + Math.random()*20 + i*0.05);
            const completion = Math.round((repsCompleted/targetReps)*100);
            const quality = Math.round((100 - pain*5 + (10 - difficulty)*5 + completion)/3);
            samSessions.push({
                patient: sam._id,
                exercise: ex._id,
                prescription: samPrescription?._id,
                setsCompleted: 1,
                repsCompleted,
                averageFormScore: formScore,
                completionRate: completion,
                patientFeedback: { painLevel: pain, difficulty, notes: i % 10 === 0 ? 'Shoulder stiffness decreasing.' : '' },
                analytics: {
                    totalReps: repsCompleted,
                    targetReps: targetReps,
                    completionPercentage: completion,
                    averagePainLevel: pain,
                    averageDifficulty: difficulty,
                    formImprovements: [ 'Better scapular control', 'Improved ROM' ],
                    sessionQuality: quality,
                    recommendations: quality < 70 ? ['Add more rest or reduce volume'] : ['Progress to next level soon']
                },
                createdAt: d,
                updatedAt: d
            });
        }
        await Session.insertMany(samSessions);
    }

    // Seed availability slots for each clinician for the next 7 days (10:00 and 14:00)
    const allClinicians = [...clinicians, demoClinician];
    const availability = [];
    const startBase = new Date();
    for (const c of allClinicians) {
        for (let d = 0; d < 7; d++) {
            const day = new Date(startBase);
            day.setHours(0,0,0,0);
            day.setDate(day.getDate() + d + 1);
            const times = [10, 14];
            for (const hour of times) {
                const start = new Date(day); start.setHours(hour, 0, 0, 0);
                const end = new Date(day); end.setHours(hour + 1, 0, 0, 0);
                availability.push({ clinician: c._id, start, end, status: 'available' });
            }
        }
    }
    await Appointment.insertMany(availability);

    res.status(201).send('Database seeded successfully with demo accounts and availability.');
});


app.listen(PORT, () => console.log(`Backend server running on http://localhost:${5000}`));