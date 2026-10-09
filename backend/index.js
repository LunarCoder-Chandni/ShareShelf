import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import listingRoutes from './listing.routes.js';
import servicesRoutes from './services.routes.js';
import requestRoutes from './request.routes.js';
import needRoutes from './need.routes.js';
import reviewRoutes from './review.routes.js';
import safetyRoutes from './safety.routes.js';
import uploadRoutes from './upload.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'shareshelf-api' }));

router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/listings', listingRoutes); // Borrow & Lend + Buying & Selling
router.use('/services', servicesRoutes); // Student Services
router.use('/requests', requestRoutes); // borrow + service requests
router.use('/needs', needRoutes); // Need -> Match
router.use('/reviews', reviewRoutes);
router.use('/safety', safetyRoutes); // reports + blocks
router.use('/uploads', uploadRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;