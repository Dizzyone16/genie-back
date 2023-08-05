function handleAsyncError(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      console.error('Error occured', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

module.exports = { handleAsyncError }
