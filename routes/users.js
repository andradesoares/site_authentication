const express = require('express');
const router = express.Router();
const joi = require('joi');
const { token } = require('morgan');
const passport = require('passport')
const randomstring = require('randomstring')

const mailer = require('../config/mailer')
const User = require('../models/user')

const userSchema = joi.object().keys({
  email: joi.string().email().required(),
  username: joi.string().required(),
  password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
  confirmationPassword: joi.any().valid(joi.ref('password')).required()
})

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    next()
  } else {
    req.flash('error', 'Sorry but you must be registered first')
    res.redirect('/')
  }
}

const isNotAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    next()
  } else {
    req.flash('error', 'Sorry but you are already logged in')
    res.redirect('/')
  }
}

router.route('/register')
  .get(isNotAuthenticated, (req, res) => {
    res.render('register');
  })
  .post(async (req, res, next) => {
    try {
      const result = userSchema.validate(req.body)

      if (result.error) {
        req.flash('error', 'Data is not valid, please try again')
        res.redirect('/users/register')
        return
      }
  
      const userEmail = await User.findOne({'email': result.value.email })
      if (userEmail) {
        req.flash('error', 'Email is already in use')
        res.redirect('/users/register')
        return
      }

      const secretToken = randomstring.generate()
      result.value.secretToken = secretToken

      result.value.active = false

      delete result.value.confirmationPassword
      await new User(result.value).save()

      const html = `Hi there, 
      <br/> 
      Thank you for registering
      <br/><br/>
      Please verfiy your email
      <br/>
      <a href="http://localhost:5000/users/${secretToken}"`

      await mailer.sendEmail('test@test.com', result.value.email, 'Please verify your email', html)

      req.flash('success', 'Please check your email')
      res.redirect('/users/login')
    } catch (err) {
      next(err)
    }
  });

router.route('/login')
  .get(isNotAuthenticated, (req, res) => {
    res.render('login');
  })
  .post(passport.authenticate('local', {
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  }));

router.route('/dashboard')
  .get(isAuthenticated, (req, res) => {
    res.render('dashboard', {
      username: req.user.username
    })
  })

router.route('/verify')
  .get(isAuthenticated, (req, res) => {
    res.render('verify')
  })
  .post(async (req, res, next) => {
    try{
    const { secretToken } = req.body

    const user = await User.findOne({'secretToken': secretToken })
    if (!user) {
      req.flash('error', 'User not found')
      res.redirect('/users/verify')
      return
    }

    user.active = true
    user.secretToken = ''
    await user.save()

    req.flash('success', "Now you may login")
    res.redirect('/users/login')

    } catch (err) {
      next(err)
    }
  })

router.route('/logout')
  .get(isAuthenticated, (req, res) => {
    req.logout()
    req.flash('success', 'Successfully logged out.')
    res.redirect('/')
  })

module.exports = router;