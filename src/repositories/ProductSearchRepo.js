const client = require('../utils/mongodb')
const { ObjectId } = require('mongodb')

const minute = 1000 * 60
const hour = 1000 * 60 * 60
const day = 1000 * 60 * 60 * 24

class ProductSearchRepo {
  async registerProductData(query, crawledData) {
    const { db } = client
    await db.collection('product_search').insertOne({
      productName: query,
      crawledData: crawledData,
      createdAt: new Date(),
    })
  }

  async getProductData(query) {
    const { db } = client
    const result = await db.collection('product_search').findOne({
      productName: query,
      createdAt: { $gte: new Date(new Date().getTime() - hour) },
      deletedAt: null,
    })
    return result
  }
}

module.exports = new ProductSearchRepo()
