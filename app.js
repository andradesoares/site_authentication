const express = require('express');
const morgan = require('morgan')
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressHandlebars = require('express-handlebars');
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose')
const passport = require('passport')

require('./config/passport')

const app = express();
app.use(morgan('dev'));

//DB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/authentication', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    })
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
}
connectDB()

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', expressHandlebars({ defaultLayout: 'layout' }));
app.set('view engine', 'handlebars');
      
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  cookie: { maxAge: 60000 },
  secret: 'codeworkrsecret',
  saveUninitialized: false,
  resave: false
}));

app.use(passport.initialize())
app.use(passport.session())

app.use(flash());

app.use((req, res, next) => {
  res.locals.success_messages = req.flash('success')
  res.locals.error_messages = req.flash('error')
  res.locals.isAuthenticated = req.user ? true : false
  next()
}) 

app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.render('notFound');
});

app.listen(5000, () => console.log('Server started listening on port 5000!'));