require('dotenv').config()

const configs = {
  port: null,
  jwtSecretKey: null,
  dbName: 'GENIE',
  mongoURI: null,
  mongoURIForRead: null,
}

if (process.env.NODE_ENV === 'production') {
  configs.port = process.env.PORT_DEVELOPMENT
  configs.jwtSecretKey = process.env.JWT_SECRET
  configs.dbName = 'GENIE'
  configs.mongoURIForRead = `mongodb+srv://admin:genuine0702@cluster0.ks5qucc.mongodb.net/${configs.dbName}?retryWrites=true&w=majority&readPreference=secondary`
  configs.mongoURI = `mongodb+srv://admin:genuine0702@cluster0.ks5qucc.mongodb.net/${configs.dbName}?retryWrites=true&w=majority`
}

module.exports = configs
