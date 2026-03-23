require('./utils');

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const bcrypt = require('bcrypt');
const { printMySQLVersion } = require('./db_utils');
const saltRounds = 12;

const database = include('databaseconnection');
const users = include('users');
const groups = include('groups');
const port = process.env.PORT || 3000;

const mongodb_user = process.env.MONGO_USERNAME;
const mongodb_password = process.env.MONGO_PASSWORD;
const mongo_secret = process.env.MONGO_SECRET;
const node_session_secret = process.env.NODE_SECRET
const expireTime = 60 * 60 * 1000; //expires after 1 hour  (minutes * seconds * millis)

const app = express();

app.use(session({
  secret: node_session_secret,
  store: MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@cluster0.wfh8c1s.mongodb.net/?appName=Cluster`,
    crypto: {
      secret: mongo_secret
    }
  }),
  saveUninitialized: false,
  resave: true
}))

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: false}));
app.use( express.static( "public" ) );
app.get('/', (req,res) => {

  if(req.session.authenticated)
  {
    res.render('home', {name : req.session.name})
  } else
  {
    res.render('index')
  }
});

app.get('/groups', async (req,res) => {
  //get all the groups and display them in a list
  if(!req.session.authenticated)
  {
    res.redirect('/')
  }

  const user_groups = await groups.getGroups(req.session.user_id)
  const user_groups_list = user_groups[0]
  console.log(user_groups_list)
  console.log(user_groups);

  res.render('groups', {groups: user_groups_list})
  // res.redirect('/')
})

app.post('/newGroup/:group_name', (req,res) => {
  //create a new group based on group name, and add person who made group to group.
})

//Needs group id as a query parameter
app.get('/group/:group_id', (req,res) => {
  let groupID = req.params.group_id
  //displays all of the texts inside a group, reactions to those messages, and text area to send messages
})

app.post('/group/invite/:person_name/:group_id', (req,res) => {
  //add a person to the group. 
})

app.post('/message/:message_id/user/:user_id/emoji/:emoji_id', (req,res) => {
  //reacts to a message
})

app.post('/newMessage/user/:user_id', (req,res) => {
  var message = req.body.message
})

app.get('/sql', (req,res) => {
  printMySQLVersion()
  res.redirect('/')
})

app.get('/signup', (req,res) => {
  let message = '';
  if(req.query.missingUsername)
  {
    message = 'Missing Username';
  }

  if(req.query.missingPassword){
    message = "Missing Password";
  }

  if(req.query.missingEmail)
  {
    message = "Missing email"
  }

  if(req.query.weakPassword)
  {
    message = "Weak password, passwords need to be >= 10 characters with upper and lower letters, numbers, and symbols"
  }
  res.render('signup', {message: message});
})

app.get('/logout', (req,res) => {
  req.session.destroy();
  res.redirect('/')
})

app.get('/login', (req,res) => {
  let message = '';
  if(req.query.missingUsername)
  {
    message += 'Missing Username';
  }

  if(req.query.missingPassword){
    message += "Missing Password";
  }

  if(req.query.userNotFound){
    message += "User not found, or password incorrect"
  }

  if(req.query.databaseError){
    message += "Something has gone wrong with the database"
  }

  res.render('login', {message: message})
})


function checkRegex(string)
{
  let alphaNumericCheck = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])/
  let symbolCheck = /\W/

  if(!alphaNumericCheck.test(string))
  {
    return false
  }
  if(!symbolCheck.test(string))
  {
    return false
  }

  return true
}
app.post('/signupPost', (req,res) => {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;

  if(!email)
  {
    res.redirect('/signup?missingEmail=true')
  }
  if(!username)
  {
    res.redirect('/signup?missingUsername=true');
  }
  if(!password)
  {
    res.redirect('/signup?missingPassword=true');
  }
  if(password.length < 10)
  {
    res.redirect('/signup?weakPassword=true')
  }
  let check = checkRegex(password)
  if(!check)
  {
    res.redirect('/signup?weakPassword=true')
  }

  var hashedPassword = bcrypt.hashSync(password, saltRounds)
  

  var success = users.createUser({user: username, hashedPassword: hashedPassword, email: email})

  if(success){
    req.session.authenticated = true
    req.session.name = username
    req.session.cookie.maxAge = expireTime
    res.redirect('/')
  } else {
    res.send('error');
  }
})


app.post('/loginPost', async (req,res) => {
  var username = req.body.username;
  var password = req.body.password;

  if(!username)
  {
    res.redirect('/login?missingUsername=true');
  }
  if(!password)
  {
    res.redirect('/login?missingPassword=true');
  }

  const result = await users.getUser(username);
  if(!result)
  {
    console.log('somethings gone wrong')
    res.redirect('/login?databaseError=true')
  }else {
    if(result[0].length != 1)
    {
      res.redirect('/login?userNotFound=true')
      console.log('result[0].lenght is the problem')
    }

    if(bcrypt.compareSync(password, result[0][0].password_hash))
    {
      req.session.authenticated = true;
      req.session.name = username;
      req.session.cookie.maxAge = expireTime;
      req.session.email = result[0][0].email;
      const user_id = await users.getUserId(username)
      req.session.user_id = user_id[0][0].user_id
      
      res.redirect('/')
    } else {
      console.log('bcrypt compare password is the problem')
      res.redirect("/login?userNotFound=true")
    }
  }

})

app.get('/*splat', (req,res) => {
  res.status(404)
  res.send("Page not found - 404. Uh oh!")
})
app.listen(port, () => {
    console.log("Node application listening on port "+port);
}); 