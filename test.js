// const SearchService = require('./src/services/SearchService')

const UserRepo = require('./src/repositories/UserRepo')

async function test() {
  const phoneNumber = '01066342670'
  const result = await UserRepo.registerUser(phoneNumber)
  console.log('result is', result)
}

test()
