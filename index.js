const express = require('express')
const mongoose = require('mongoose')
// const dotenv = require("donenv").config();
const jwt = require('jsonwebtoken')

const helmet = require('helmet')

const createError = require('http-errors')
const cors = require('cors')
const logger = require('morgan')
const path = require('path')
const moment = require('moment')
require('moment-timezone')

const configs = require('./src/utils/configs.js')

// moment.tz.setDefault('Asia/Seoul')

const app = express()

const userRouter = require('./src/routes/user')
const dataRouter = require('./src/routes/data')
const webRouter = require('./src/routes/web')
const { v4: uuidv4 } = require('uuid')

// app.use(helmet())

app.use(cors())
app.use(express.json())

app.set('view engine', 'ejs')
app.engine('html', require('ejs').renderFile)

// app.use((req, res, next) => {
//   next(createError(404))
// })

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  // render the error page
  res.status(err.status || 500)
  res.json({})
})

const httpServer = require('http').createServer(app)

httpServer.listen(configs.port, async () => {
  try {
    console.log(`Server up and running on port ${configs.port}...`)
  } catch (err) {
    console.log(err)
  }
})

app.get('/', (req, res) => {
  return res.json({
    message: 'Hello world',
  })
})

app.get('/web', (req, res) => {
  let userId = req.cookies.user_id

  if (!userId) {
    userId = uuidv4()
    res.cookie('user_id', userId, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
    })
    console.log(`User with ID ${userId} visited the homepage.`)
  } else {
    console.log(`User with ID ${userId} is a returning visitor.`)
  }

  res.send('Welcome!')
})

app.get('/health-check', (req, res) => {
  return res.status(200).json({
    message: 'Hello world',
  })
})

// mongoose.connect(
//   process.env.DB_CONNECT,
//   {
//     useNewURLParser: true,
//     useUnifiedTopology: true,
//   },
//   (err) => {
//     if (err) return console.errer(err);
//     console.log("Connected to MongoDB");
//   }
// );

// // 라우트 설정
app.use('/user', userRouter)
app.use('/data', dataRouter)
app.use('/web', webRouter)
