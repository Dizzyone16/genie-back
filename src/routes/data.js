const express = require('express')

// utils
const auth = require('../middleware/auth')
const { handleAsyncError } = require('../utils/handleAsyncError')

// services

// repos
const EventsRepo = require('../repositories/EventsRepo')

const router = express.Router()

router.post(
  '/log-event',
  auth,
  handleAsyncError(async (req) => {
    const { eventType, eventData } = req?.body
    const userId = req?.user?.id
    console.log(eventType, eventData, 'event')
    console.log(userId, 'userId')

    const eventInfo = { ...eventData, userId }

    await EventsRepo.logEvent(eventType, eventInfo)
  })
)

module.exports = router
