import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  message: String,
  route: String,
  isRead: Boolean
}, {
  timestamps: true
})

const Notification = mongoose.models.notifications || mongoose.model('notifications', schema)

export default Notification
