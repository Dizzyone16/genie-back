const client = require("../utils/mongodb")
const { ObjectId } = require("mongodb")

const collection = client.db.collection("product_search")

const minute = 1000 * 60 * 60
const hour = 1000 * 60 * 60 * 60
const day = 1000 * 60 * 60 * 60 * 24

class ProductSearchRepo {
  async registerProductData(data) {
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date(),
    })
  }

  async getProductData(query) {
    const result = await collection.findOne({
      productName: query,
      createdAt: { $gte: new Date() - hour },
      deletedAt: null,
    })
    return result
  }
}

module.exports = new ProductSearchRepo()
