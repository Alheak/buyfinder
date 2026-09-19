import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  mfcId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  originalName: String,
  altNames: [{
    type: String
  }]
})

const Character = mongoose.models.characters || mongoose.model('characters', schema)

export default Character
