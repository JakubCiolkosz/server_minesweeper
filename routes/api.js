var express = require('express');
var router = express.Router();


var user_controller = require('../controllers/userController')

router.get('/stats', user_controller.stats_get);

router.post('/stats/countGame', user_controller.stats_post);

router.post('/register', user_controller.register);

router.post('/login', user_controller.login);

router.post('/user/:id/sendDeleteEmail', user_controller.email);

router.delete('/user/:id', user_controller.delete_user);

module.exports = router;