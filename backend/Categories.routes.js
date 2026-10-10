import { Router } from 'express';
import * as ctrl from './Categories.controller.js';

const router = Router();
router.get('/', ctrl.list);

export default router;
