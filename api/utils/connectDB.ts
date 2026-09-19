import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = () => {
  if (mongoose.connections[0].readyState) {
    console.error('MongoDB is already connected')

    return
  }

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017', { dbName: 'buyfinder' })
    .then(() => {
      import('../models/Character')
      import('../models/CleanupRequest')
      import('../models/Error')
      import('../models/Figure')
      import('../models/Listing')
      import('../models/NoHit')
      import('../models/Notification')
      import('../models/Origin')
      import('../models/Price')
      import('../models/PricePoint')
      import('../models/Report')
      import('../models/Search')
      import('../models/ShopSearch')
      import('../models/ShopSuggestion')
      import('../models/Token')
      import('../models/User')
      // import('../models/UserFigure')
      import('../models/Watch')
      import('../models/WatchPointsCredit')

      // console.log('MongoDB is connected')
    })
    .catch(err => console.error(err))
}

export default connectDB
