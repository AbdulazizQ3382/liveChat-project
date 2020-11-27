const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ejs = require('ejs')
const session = require('express-session')
const passport = require('passport');
// to make passport saves data in mongodb 
const passportLocalMongoose = require('passport-local-mongoose');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require(__dirname+'/utils/messages')
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require('./utils/users');
  


// we nedd the http server to use socket.io
const server = http.createServer(app);
// make socketio using http server
const io = socketio(server);
// you can choose any number you want xxxx
const port = 3000;

const botName = 'live chat bot';


app.use(bodyParser.urlencoded({extended:true}));
// to use the public folder
app.use(express.static(__dirname+'/public'))
app.set('view engine', 'ejs');
// to make express to use the session
app.use(session({
    secret: 'Abdulaziz',
    resave: false,
    saveUninitialized: false
}));

// express use passport
app.use(passport.initialize());
// make passport to set up session
app.use(passport.session());


mongoose.connect('mongodb://localhost:27017/liveChat', {useNewUrlParser: true, useUnifiedTopology: true});
// there is deprecated warning so if we add this below it will remove the warning 
mongoose.set('useCreateIndex', true);
console.log('we are connected now')

const usersSchema = new mongoose.Schema({
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    nickName:String,
    feedbackTitle:String,
    feedbackDescription:String

  });

  // mongoose use passport 
  //  Passport-Local Mongoose will add a username, hash and salt field to store the username, the hashed password and the salt value.
  usersSchema.plugin(passportLocalMongoose);

  const User = mongoose.model('users', usersSchema);
  // to begin and use the username and password strtegy 
  passport.use(User.createStrategy());
  // to add user info into cookie 
  passport.serializeUser(User.serializeUser());
  // to destroy cookie 
  passport.deserializeUser(User.deserializeUser());
  




    
    app.get('/',(req,res)=>{
        res.render('register',{displayMessage : ''})
    });

    
    app.post('/',(req,res)=>{
        // User.register({username:req.body.username}, req.body.pass, function(err, user) {
        //     if (err) {
        //         console.log(err)
        //          res.redirect('/')
        //     }
        //     passport.authenticate('local')(req,res,function(){
        //         res.send('good you are ...')
        //     });
        // });

        
        User.register({username:req.body.username,firstName: req.body.firstName,lastName: req.body.lastName, nickName:req.body.nickname}, req.body.password , function(err, user) {
  
                  console.log(user);
                //   saving data in the session array.
                  req.session.username = req.body.username;
                  req.session.password = req.body.password; 
                  
                  
            if (err) { console.log(err); res.send('error')}
            passport.authenticate('local')(req,res,function(){
                res.redirect('/main')
            });
          });

    });

    app.get('/login', (req,res) => {
        res.render('login',{displayMessage : ''})
    })

    app.post('/login', (req,res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })
        
        req.login(user,function (err){
            console.log(user);
            if(err){
                res.redirect('/login')
                console.log(err)
                
            }if(!user){
                return res.render('login',{displayMessage:'wrong'})
            }
            else {
                    passport.authenticate('local')(req,res,function(){
                    req.session.username = req.body.username;
                    req.session.password = req.body.password;
                    console.log(req.body.username);
                
                    res.redirect('/main')
                    });
            }
    
        });

    });
    app.get('/main',function(req,res){
        if(req.isAuthenticated()){
        console.log(req.session.username);
        console.log(req.session.password)
        res.render('main')
        }
        else 
        res.redirect('/')
    
    })

    app.get('/logout',function(req,res){
        req.session.destroy(function(err) {
            if(err)
            console.log(err);
            else{
                console.log('session detroyed succesfully')
            }
          })
        req.logout();
        res.redirect('/');
    })

    app.get('/Feedback',function(req,res){
        if(req.isAuthenticated())
        res.render('Feedback',{message:''})
        else 
        res.redirect('/')
        
    })
    app.post('/feedback', async function(req,res){
        let doc = await User.findOneAndUpdate({ username: req.session.username }, {feedbackTitle : req.body.title,feedbackDescription:req.body.description}, {
            new: true
          });

          console.log(doc.feedbackTitle);
          res.render('feedback',{message:'We saved your feedback, thanks for your time.'});

    })

    app.get('/UserName_info',function(req,res){
        if(req.isAuthenticated()){
            // retriving data to display it in userName_info page
            User.findOne({ username: req.session.username }, function (err, data) {
                if(err){
                    console.log('what happend !'+err)
                }else{
                    console.log(data)
                    res.render('UserName_info',{NickName:data.nickName,FirstName:data.firstName,LastName:data.lastName,Email:data.username,message:''})
                }
            });
        
        }
        else 
        res.redirect('/')
        
    })

     app.post('/UserName_info', async function(req,res){
        console.log(req.body.firstName)

        // to find the document and update it 
        // the third parameter means return the document after it modified . 
       let doc = await User.findOneAndUpdate({ username: req.session.username }, {username: req.body.username, firstName : req.body.firstName , lastName : req.body.lastName , nickName : req.body.nickName }, {
            new: true
          });
         console.log(doc.firstName);
         req.session.username = req.body.username;
         console.log(req.session);

         req.logout();
        //  to handle bad request error 
         req.body.password = req.session.password;
        //  we have to login again because we changed the email
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })
        
        req.login(user,function (err){
            console.log(user);
            if(err){
                res.redirect('/login')
                console.log(err)
                
            }if(!user){
                return res.render('login',{displayMessage:'wrong'})
            }
            else {
                    passport.authenticate('local')(req,res,function(){
                        req.session.nickName = req.body.nickName;
                        req.session.firstName = req.body.firstName;
                        req.session.lastName = req.body.lastName;

                    res.render('UserName_info',{NickName:req.body.nickName,FirstName:req.body.firstName,LastName:req.body.lastName,Email:user.username,message:'General info Updated succesfully'});

                    });
            }
    
        });

         
    });

    //  a post coming from a component with the id : account-change-password
    app.post('/UserName_info:account-change-password',function(req,res){
    //    To be continuoued .
    if(req.body.currentPass === req.session.password ){
        if(req.body.newPass === req.body.reNewPass)
          res.render('UserName_info',{NickName:req.session.nickName,FirstName:req.session.firstName,LastName:req.session.lastName,Email:req.session.username,message:'Password Updated succesfully'});
        else 
        res.render('UserName_info',{NickName:req.session.nickName,FirstName:req.session.firstName,LastName:req.session.lastName,Email:req.session.username,message:'your new password doesn\'t match with the  new repeated password'});
          
    }
    else {
        res.render('UserName_info',{NickName:req.session.nickName,FirstName:req.session.firstName,LastName:req.session.lastName,Email:req.session.username,message:'Your current password is wrong , please write your correct password'});
    }

    })
    app.get('/chat',function(req,res){
        res.render('chat')
    });

          // an event when the user connect to the socket
          io.on('connection', socket => {
            socket.on('joinRoom', ({ username, room }) => {
              const user = userJoin(socket.id, username, room);
          
              socket.join(user.room);
          
              // Welcome current user
              socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));
          
              // Broadcast when a user connects
              socket.broadcast
                .to(user.room)
                .emit(
                  'message',
                  formatMessage(botName, `${user.username} has joined the chat`)
                );
          
              // Send users and room info
              io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
              });
            });
          
            // Listen for chatMessage
            socket.on('chatMessage', msg => {
              const user = getCurrentUser(socket.id);
          
              io.to(user.room).emit('message', formatMessage(user.username, msg));
            });
          
            // Runs when client disconnects
            socket.on('disconnect', () => {
              const user = userLeave(socket.id);
          
              if (user) {
                io.to(user.room).emit(
                  'message',
                  formatMessage(botName, `${user.username} has left the chat`)
                );
          
                // Send users and room info
                io.to(user.room).emit('roomUsers', {
                  room: user.room,
                  users: getRoomUsers(user.room)
                });
              }
            });
          });
          



    
    server.listen(port,()=>{
        console.log('user Joind')
    })
