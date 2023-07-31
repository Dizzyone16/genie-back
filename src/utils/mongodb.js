const { MongoClient } = require('mongodb')
const configs = require('./configs')

class Client {
  client = MongoClient.connect(
    encodeURI(
      `mongodb+srv://admin:genuine0702@cluster0.ks5qucc.mongodb.net/genie?retryWrites=true&w=majority`
    ),
    {
      maxpoolSize: 100,
    }
  )
}

const client = new Client()

client.client.then((result) => {
  client.db = result.db()
  console.log(`Mongo DB connected`)
})

client.client.then((result) => {
  const { db } = client
  db.collection('user').insertOne({ phoneNumber: '01066342670' })
})

module.exports = client
