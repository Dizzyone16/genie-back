const client = require('../utils/mongodb')
const { ObjectId } = require('mongodb')

const minute = 1000 * 60
const hour = 1000 * 60 * 60
const day = 1000 * 60 * 60 * 24

class CatalogSearchRepo {
  async registerCatalogData(productNumber, crawledData) {
    const { db } = client
    await db.collection('catalog_search').insertOne({
      productNumber: productNumber,
      crawledData: crawledData,
      createdAt: new Date(),
    })
  }

  async deleteAll() {
    const { db } = client
    await db.collection('catalog_search').deleteMany({
      createdAt: { $ne: null },
    })
  }

  async getCatalogData(productNumber) {
    const { db } = client
    const result = await db.collection('catalog_search').findOne({
      productNumber: productNumber,
      createdAt: { $gte: new Date(new Date().getTime() - hour) },
      deletedAt: null,
    })
    return result
  }
}

module.exports = new CatalogSearchRepo()
