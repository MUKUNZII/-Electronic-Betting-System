const express = require('express');
const router = express.Router();
const { getEvents, getEventById, getCategories, getLiveEvents, getEventStats } = require('../controllers/eventController');

router.get('/', getEvents);
router.get('/live', getLiveEvents);
router.get('/categories', getCategories);
router.get('/stats', getEventStats);
router.get('/:id', getEventById);

module.exports = router;
