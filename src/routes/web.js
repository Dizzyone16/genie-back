const express = require('express')

// utils
const auth = require('../middleware/auth')

// controllers
const UserController = require('../controllers/userController')

const router = express.Router()

router.post('/issue-web-token', wrapAsync(UserController.issueWebToken))

function wrapAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

module.exports = router
