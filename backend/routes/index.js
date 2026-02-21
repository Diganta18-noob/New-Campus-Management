// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const batchRoutes = require('./src/routes/batch.routes');
const attendanceRoutes = require('./src/routes/attendance.routes');
const dailyUpdateRoutes = require('./src/routes/dailyUpdate.routes');
const auditRoutes = require('./src/routes/audit.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const classroomRoutes = require('./src/routes/classroom.routes'); 
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/daily-updates', dailyUpdateRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/classrooms', classroomRoutes); 