// routes/dashboardRoutes.js
import express from 'express';
const router = express.Router();

// Dashboard main route
router.get('/dashboard', (req, res) => {
  const firstName = req.query.name || 'Guest';
  res.render('dashboard', { user: { firstName } });
});

export default router;
