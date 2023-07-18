const jwt = require('jsonwebtoken')
const configs = require('../config/configs.js')

const auth = (req, res, next) => {
  const token = req.header('x-access-token')
  if (!token) {
    return res.status(401).json({ status: 4010, msg: 'No token' })
  }
  try {
    const verified = jwt.verify(token, configs.accessTokenSecret)
    req.user = verified.user
    next()
  } catch (err) {
    res.status(401).json({ status: 4011, msg: 'Invalid Token' })
  }
}

module.exports = auth
