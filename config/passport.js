const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const User = require('../models/user')

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

passport.use(new localStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async ( email, password, done) => {
  try {
    const user = await User.findOne({ 'email': email })
    if (!user) return done(null, false, {message})

    const isValid = user.validatePassword(password)
    if (!isValid ) {
      return done(null, false, {message: 'Unknown password'})
    }

    if (!user.active) {
      return done(null, false, {message: 'Email verification required'})
    }

    return done(null, user)
  } catch (error) {
    return done(error, false)
  }
}))