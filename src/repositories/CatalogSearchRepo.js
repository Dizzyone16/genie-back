const client = require('../utils/mongodb')
const { ObjectId } = require('mongodb')

const collection = client.db.collection('catalog_search')

const minute = 1000 * 60 * 60
const hour = 1000 * 60 * 60 * 60
const day = 1000 * 60 * 60 * 60 * 24

class CatalogSearchRepo {
  async registerCatalogData(data) {
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date(),
    })
  }

  async getCatalogData(productNumber) {
    const result = await collection.findOne({
      productNumber,
      createdAt: { $gte: new Date() - hour },
      deletedAt: null,
    })
    return result
  }
}

module.exports = new CatalogSearchRepo()
