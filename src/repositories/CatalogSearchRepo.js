const client = require('../utils/mongodb')
const { ObjectId } = require('mongodb')

const minute = 1000 * 60 * 60
const hour = 1000 * 60 * 60 * 60
const day = 1000 * 60 * 60 * 60 * 24

class CatalogSearchRepo {
  async registerCatalogData(data) {
    const { db } = client
    await db.collection('catalog_search').insertOne({
      ...data,
      createdAt: new Date(),
    })
  }

  async getCatalogData(productNumber) {
    const { db } = client
    const result = await db.collection('catalog_search').findOne({
      productNumber,
      createdAt: { $gte: new Date() - hour },
      deletedAt: null,
    })
    return result
  }
}

module.exports = new CatalogSearchRepo()
