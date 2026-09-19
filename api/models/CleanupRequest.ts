import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  figure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'figures'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  isDone: Boolean
}, {
  timestamps: true
})

const CleanupRequest = mongoose.models.cleanupRequests || mongoose.model('cleanupRequests', schema)

export default CleanupRequest
