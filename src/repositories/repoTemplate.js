const client = require('../utils/mongodb')
const { ObjectId } = require('mongodb')

// 'collection_name'안에 collection명 넣기
const collection = client.db.collection('collection_name')

const minute = 1000 * 60 * 60
const hour = 1000 * 60 * 60 * 60
const day = 1000 * 60 * 60 * 60 * 24

class Repo {
  // 예시 함수
  async function(data) {
    const result = await collection.findOne({
      ...data,
      createdAt: new Date(),
    })
  }
}

module.exports = new Repo()
