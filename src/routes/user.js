const express = require('express')

// utils
const auth = require('../middleware/auth')

// services
const SearchService = require('../services/SearchService')

// controllers
const UserController = require('../controllers/userController')

const router = express.Router()

router.post(
  '/login-or-register',
  // auth,
  wrapAsync(UserController.loginOrRegister)
)

router.post(
  '/search',
  auth,
  wrapAsync(async (req, res) => {
    const searchQuery = req.body.query

    const result = await SearchService.searchProducts(searchQuery)

    if (result) {
      return res.json({
        status: 200,
        data: result,
        message: 'Search completed successfully.',
      })
    }
    return res.json({
      status: 404,
      message: 'Search failed.',
    })
  })
)

router.post(
  '/catalog',
  auth,
  wrapAsync(async (req, res) => {
    const productNumber = req.body.productNumber

    const catalogData = await SearchService.getCatalogData(productNumber)

    if (result) {
      return res.json({
        status: 200,
        data: catalogData,
        message: 'Catalog search completed successfully.',
      })
    }
    return res.json({
      status: 404,
      message: 'Catalog search failed.',
    })
  })
)

function wrapAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

module.exports = router
