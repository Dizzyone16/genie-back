const express = require('express')

// utils
const auth = require('../middleware/auth')

// services
const SearchService = require('../services/SearchService')

// controllers
const UserController = require('../controllers/userController')

const router = express.Router()

router.post('/login-or-register', wrapAsync(UserController.loginOrRegister))

router.post(
  '/search',
  auth,
  wrapAsync(async (req, res) => {
    console.log('data received')
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
    const catalogNumber = req.body.catalogNumber

    const result = await SearchService.getCatalogData(catalogNumber)

    if (result) {
      return res.json({
        status: 200,
        data: result,
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
