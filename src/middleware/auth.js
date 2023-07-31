const jwt = require('jsonwebtoken')
const configs = require('../utils/configs.js')

const auth = (req, res, next) => {
  const token = req.header('x-access-token')

  if (!token) {
    return res.status(401).json({ error: 'No token found.' })
  }

  try {
    const decoded = jwt.verify(token, configs.jwtSecretKey)
    req.user = decoded.user
    next()
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' })
  }
}

module.exports = auth
