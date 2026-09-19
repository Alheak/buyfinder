import mongoose, { Schema } from 'mongoose'
import { frequencies } from '../../types/Watch'

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  figure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'figures',
    required: true
  },
  maximumPrice: Number,
  currency: {
    type: String,
    default: 'JPY'
  },
  shopsToSearch: [{
    type: String
  }],
  shopsToIgnore: [{
    type: String
  }],
  shopRules: {
    type: Schema.Types.Mixed,
    of: {
      searches: [{
        type: String
      }],
      mustContain: [{
        type: String
      }],
      exclude: [{
        type: String
      }]
    }
  },
  newListings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'listings'
  }],
  activeSearch: Boolean,
  frequency: {
    type: Number,
    enum: frequencies,
    default: 1000 * 60 * 10
  },
  lastCheck: Date,
  lastFound: Date
}, {
  timestamps: true
})

const Watch = mongoose.models.watches || mongoose.model('watches', schema)

export default Watch
