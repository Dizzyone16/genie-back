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
      crawledData: { ...crawledData, crawledAt: new Date() },
      createdAt: new Date(),
    })
  }

  async registerCatalogOptionData(
    productNumber,
    optionNumber,
    crawledOptionData
  ) {
    const setOperation = {}

    for (const [key, value] of Object.entries(crawledOptionData)) {
      setOperation[`crawledData.options.$.${key}`] = value
    }

    const { db } = client
    await db.collection('catalog_search').updateOne(
      {
        productNumber: productNumber,
        createdAt: { $gte: new Date(new Date().getTime() - hour) },
        'crawledData.options.optionNumber': optionNumber,
      },
      {
        $set: setOperation,
      }
    )
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

  async getCatalogOptionData(productNumber, optionNumber) {
    const { db } = client
    const query = {
      productNumber: productNumber,
      [`crawledData.options.optionNumber`]: optionNumber,
      createdAt: { $gte: new Date(new Date().getTime() - hour) },
      deletedAt: null,
    }

    const result = await db.collection('catalog_search').findOne(query)

    if (
      result &&
      result?.crawledData &&
      Array.isArray(result?.crawledData.options)
    ) {
      const specificOption = result?.crawledData?.options.find(
        (opt) => opt?.optionNumber === optionNumber
      )

      if (specificOption) {
        return specificOption?.mallList ? specificOption : null
      }
    }

    return result
  }
}

module.exports = new CatalogSearchRepo()
