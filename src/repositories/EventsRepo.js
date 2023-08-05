const client = require('../utils/mongodb')

function getCollectionName(eventType) {
  switch (eventType) {
    case 'login':
      return 'login_events'
    case 'search':
      return 'search_events'
    // 추후 다른 이벤트 유형에 대한 추가 case 문 추가하기
    default:
      return 'other_events'
  }
}

class EventsRepo {
  async logEvent(eventType, eventInfo) {
    try {
      const { db } = client
      const collectionName = getCollectionName(eventType)
      console.log(collectionName, 'collectionName')
      await db.collection(collectionName).insertOne({
        ...eventInfo,
        createdAt: new Date(),
      })
    } catch (err) {
      console.err('Error logging Event', err)
      throw new Error('Failed to log event')
    }
  }
}

module.exports = new EventsRepo()
