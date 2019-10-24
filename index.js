const express = require('express')
const MongoClient = require("mongodb").MongoClient;
const dbname = "uHomeDB"
//const url = "mongodb://localhost:27017/";
//const { ExpressAdapter } = require('ask-sdk-express-adapter');
const uri = "mongodb+srv://uHomeB:uhome@uhome-bakds.mongodb.net/test?retryWrites=true&w=majority";
const app = express();
app.use(express.json());

const authen = require('./authen')

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
var firebase = require("firebase/app");

// Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/firestore");


  // Your web app's Firebase configuration

  var firebaseConfig = {
    apiKey: "AIzaSyBWUtbxKBnglyCxYFAAbMpeyQNuSt6Hgp8",
    authDomain: "uhome-bd34e.firebaseapp.com",
    databaseURL: "https://uhome-bd34e.firebaseio.com",
    projectId: "uhome-bd34e",
    storageBucket: "uhome-bd34e.appspot.com",
    messagingSenderId: "514062511683",
    appId: "1:514062511683:web:b5f42933a08e60b401aef6",
    measurementId: "G-JFF1W2HXSX"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);




app.post('/', (req, res) => {
var auth = authen.isAuthenticated(req.body.idToken)
if(auth)
{
  res.send('uHome')
}
else res.status(401).send("Authentication error")
  
});

app.post('/api/device',(req,res)=>{
    
    const device = {
        uid: 1,
        name: req.body.name,
        status: "connected"
    };

    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
    if (err) {
      console.error(err)
      return
    }
    const db = client.db(dbname)
    const collection = db.collection("devices")
    collection.insertOne(device, (err, result) => {
      if(err) res.send(err)
      else res.send(device)
    })

    client.close();
    
  })
    

});

app.get('/api/device/:id',(req,res)=>{
  MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
  if (err) {
    console.error(err)
    return
  }
  const db = client.db(dbname)
  const collection = db.collection("devices")
  //res.send(req.params.id)
  collection.find({uid: id}).toArray((err, items) => {
    if(err) res.send(err)
    else res.send(items)
    let id = parseInt(req.params.id);
  })
  client.close();
})
});

// app.post('/api/signup',(req,res)=>{

//   var email = req.body.email
//   var password = req.body.password
//   firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
//     // Handle Errors here.
//     var errorCode = error.code;
//     var errorMessage = error.message;
//     var errorReply = {
//       'errorCode': errorCode,
//       'errorMessage' : errorMessage

//     }
//     res.send(errorReply)
//   });
//   res.send("Successfully created account")

// });

// app.post('/api/signin',(req,res)=>{

//   var email = req.body.email
//   var password = req.body.password
//   firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
//     // Handle Errors here.
//     var errorCode = error.code;
//     var errorMessage = error.message;
//     var errorReply = {
//       'errorCode': errorCode,
//       'errorMessage' : errorMessage

//     }
//     res.send(errorReply)
//   });
//   res.send("Successfully Signed in")

// });


app.listen(3000, () => {
  console.log('Listening on port 3000!')
}); 