import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  figure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'figures',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }
}, {
  timestamps: true
})

const Search = mongoose.models.searches || mongoose.model('searches', schema)

export default Search
