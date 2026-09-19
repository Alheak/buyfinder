import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  altNames: [{
    type: String
  }]
})

const Origin = mongoose.models.origins || mongoose.model('origins', schema)

export default Origin
