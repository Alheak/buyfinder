import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  previousEmail: String,
  password: {
    type: String,
    required: true
  },
  stripeCustomerId: String,
  hasActiveSubscription: Boolean,
  subscriptionLevel: {
    type: Number,
    default: 0
  },
  watchPoints: Number,
  watchPointsSubscription: Boolean,
  admin: Boolean,
  activated: {
    type: Boolean,
    default: true
  },
  token: String
}, {
  timestamps: true
})

const User = mongoose.models.users || mongoose.model('users', schema)

export default User
