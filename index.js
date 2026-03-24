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
app.use(express.static(__dirname +  "/public" ));


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
  } else {
    const user_groups = await groups.getGroups(req.session.user_id)
    const user_groups_list = user_groups[0]
    console.log(user_groups_list)
    res.render('groups', {groups: user_groups_list})
    // res.redirect('/')
  }

})


app.get('/new_group', (req,res) => {
  res.render('createGroup')
})
app.post('/new_group', (req,res) => {
  console.log(req.body.group_name)
  groups.makeGroup(req.session.user_id, req.body.group_name)
  res.redirect('/groups')
})

//displays all of the texts inside a group, reactions to those messages, and text area to send messages
app.get('/group/:group_id/:room_user_id', async (req,res) => {
  let group_id = req.params.group_id
  const room_user_id = req.params.room_user_id
  const messages = await groups.getMessagesInGroup(group_id) //have a divider between seen messages and unseen messages (where message_id is greater than last seen message id)
  const message_list = messages[0]
  const seen_messages = []
  const unseen_messages = []
  if(message_list.length > 0)
  {
    
    const last_seen_message_id = groups.getLastSeenMessageId(room_user_id)
    for(let i = 0; i < message_list.length; i++)
    {
      let message_id = message_list[i].message_id;
      if (message_id > last_seen_message_id)
      {
        unseen_messages.push(message_list[i])
      } else {
        seen_messages.push(message_list[i])
      }
    }
    const last_message = message_list[message_list.length - 1]
    const last_message_id = last_message.message_id;
    groups.updateLastSeenMessage(room_user_id, last_message_id)
  }
  console.log(message_list)
  const emptyRoom = message_list.length == 0
  res.render('group', {unseen_messages: unseen_messages, seen_messages: seen_messages, emptyRoom: emptyRoom, userid: req.session.user_id, group_id: group_id, room_user_id: room_user_id})
})


app.get('/invite_person', (req,res) => {
  res.render('inviteToGroup')
})

app.post('/group/:group_id/invite_to_group', (req,res) => {
  //add a person to the group. 
})

app.post('/message/:message_id/user/:user_id/emoji/:emoji_id', (req,res) => {
  //reacts to a message
})

app.post('/group/:group_id/newMessage/room_user_id/:room_user_id', (req,res) => {
  const message = req.body.message;
  const room_user_id = req.params.room_user_id;
  const group_id = req.params.group_id;
  console.log(room_user_id)
  console.log(group_id)
  const result = groups.addMessageToGroup(message, room_user_id)
  console.log(message)
  res.redirect('/group/' + group_id + "/" + room_user_id)
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