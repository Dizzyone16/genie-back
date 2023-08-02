const client = require('../utils/mongodb')
const { ObjectId } = require('mongodb')

const minute = 1000 * 60
const hour = 1000 * 60 * 60
const day = 1000 * 60 * 60 * 24

class UserRepo {
  async registerUser(phoneNumber) {
    const { db } = client
    const result = await db.collection('user').insertOne({
      phoneNumber: phoneNumber,
      createdAt: new Date(),
    })
    return result.insertedId
  }

  async getUserBasicInfoByPhoneNumber(phoneNumber) {
    const { db } = client
    const result = await db.collection('user').findOne(
      {
        phoneNumber: phoneNumber,
        deletedAt: null,
      },
      {
        projection: { phoneNumber: 1 },
      }
    )
    return result
  }
}

module.exports = new UserRepo()
