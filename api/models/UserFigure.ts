import mongoose from 'mongoose'

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
  }
}, {
  timestamps: true
})

const UserFigure = mongoose.models.userFigures || mongoose.model('userFigures', schema)

export default UserFigure
