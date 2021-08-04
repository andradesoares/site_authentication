const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  secretToken: String,
  active: Boolean
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
})

userSchema.pre('save', async function save(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods = {
  validatePassword: async function(data) {
    return bcrypt.compare(data, this.password);
  }
}

const User = mongoose.model('user', userSchema)

module.exports = User


