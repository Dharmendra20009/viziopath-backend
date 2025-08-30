const router = require('express').Router();


router.get('/', (req, res) => res.json({ message: 'Viziopath API v1' }));
router.use('/auth', require('./auth.routes'));


module.exports = router;