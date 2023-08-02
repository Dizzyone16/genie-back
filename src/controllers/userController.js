// config
const configs = require('../utils/configs')

// middlewares
const jwt = require('jsonwebtoken')

//repos
const UserRepo = require('../repositories/UserRepo')

function generateJwtToken(userId) {
  const payload = { user: { id: userId } }
  const accessToken = jwt.sign(payload, configs.jwtSecretKey)
  return accessToken
}

const UserController = {
  async loginOrRegister(req, res) {
    try {
      const { phoneNumber } = req.body

      // check whether registered
      const existingUser = await UserRepo.getUserBasicInfoByPhoneNumber(
        phoneNumber
      )

      if (existingUser) {
        const userId = existingUser?._id
        const accessToken = generateJwtToken(userId)
        return res.status(200).json({ token: accessToken, userId: userId })
      } else {
        const newUserId = await UserRepo.registerUser(phoneNumber)
        const accessToken = generateJwtToken(newUserId)
        return res.status(200).json({ token: accessToken, userId: newUserId })
      }
    } catch (err) {
      console.error('Error registering user:', err)
      res.status(500).json({ message: 'Internal server error.' })
    }
  },
}

module.exports = UserController
