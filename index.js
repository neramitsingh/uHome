const express = require('express')
const MongoClient = require("mongodb").MongoClient;
const dbname = "uHomeDB"
//const url = "mongodb://localhost:27017/";
//const { ExpressAdapter } = require('ask-sdk-express-adapter');
const uri = "mongodb+srv://uHomeB:uhome@uhome-bakds.mongodb.net/test?retryWrites=true&w=majority";
const ObjectId = require('mongodb').ObjectID;
const app = express();
var cors = require('cors')

app.use(cors())
app.use(express.json());

const authen = require('./authen')

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
// var firebase = require("firebase/app");

// // Add the Firebase products that you want to use
// require("firebase/auth");
// require("firebase/firestore");


//   // Your web app's Firebase configuration

//   var firebaseConfig = {
//     apiKey: "AIzaSyBWUtbxKBnglyCxYFAAbMpeyQNuSt6Hgp8",
//     authDomain: "uhome-bd34e.firebaseapp.com",
//     databaseURL: "https://uhome-bd34e.firebaseio.com",
//     projectId: "uhome-bd34e",
//     storageBucket: "uhome-bd34e.appspot.com",
//     messagingSenderId: "514062511683",
//     appId: "1:514062511683:web:b5f42933a08e60b401aef6",
//     measurementId: "G-JFF1W2HXSX"
//   };
  
//   // Initialize Firebase
//   firebase.initializeApp(firebaseConfig);




app.post('/', (req, res) => {
var auth =  authen(req.body.idToken).then(async function(resolve){
  //console.log(resolve)
  res.send({
    text: 'uHome'
  })
  
}).catch(function(reject){
  // console.log(reject)
  // console.log("I'm back catch")
  res.status(401).send(reject.error)
});
})


app.post('/api/device/add',(req,res)=>{

  var auth =  authen(req.body.idToken).then(async function(resolve){
    
    const device = {
      uid: resolve.uid,
      name: req.body.name,
      status: "enabled",
      on: true
  }
  MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
  if (err) {
    console.error(err)
    res.send({
      error: err
    })
  }
  const db = client.db(dbname)
  const collection = db.collection("devices")
  collection.insertOne(device, (err, result) => {
    if(err) res.send(err)
    else res.send(device)
  })

  client.close();
  
  })

  }).catch(function(reject){
    // console.log(reject)
    // console.log("I'm back catch")
    res.status(401).send(reject.error)
  });

});

app.post('/api/device/get',(req,res)=>{

  var auth =  authen(req.body.idToken).then(async function(resolve){
    //console.log(resolve)
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
    let id = resolve.uid
    //res.send(req.params.id)
    collection.find({uid: id}).toArray((err, items) => {
      if(err) res.send(err)   
      else res.send(items)  
    })
    client.close();
  })
    
  }).catch(function(reject){
    // console.log(reject)
    // console.log("I'm back catch")
    res.status(401).send(reject.error)
  });
  
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
  console.log('Test API')
  const db = client.db(dbname)
  const collection = db.collection("devices")
  let id = req.params.id
  //res.send(req.params.id)
  collection.find({uid: id}).toArray((err, items) => {
    if(err) res.send(err)   
    else res.send(items)  
  })
  client.close();
})
});

app.post('/api/toggleswitch', (req, res) => {
  var auth =  authen(req.body.idToken).then(async function(resolve){
    console.log(resolve)
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

    var val;

    var query1 = new Promise((resolve,reject)=> {
      console.log("### Query 1 ###")
      collection.find(ObjectId(req.body.did)).toArray(function(err, result) {
        if (err) reject(err);
        console.log(result);
        val = result[0].on;
        resolve(result);
        
       })
      })

       var query2 = () =>{
        return query1.then(async function(resolve){
          console.log("### Query 2 ###")
          if(val == true) val = false;
          else if(val == false) val = true;
  
          var newvalues = { $set: { on: val } };
  
          collection.updateOne({_id: ObjectId(req.body.did)}, newvalues, function(err, result) {
            if (err){
              console.log(err)
              return res.send(err);
            } 
            console.log(result);
            res.send(result);
            client.close();
          });
    }).catch(function(reject){
      res.send(reject.err)
    })
  }
  
  query2();


      

    //console.log(val.switch);

    
   // client.close();
  })

  }).catch(function(reject){
    res.status(401).send(reject.error)
  });
  })

  app.post('/api/starttimer',(req,res)=>{

    var auth =  authen(req.body.idToken).then(async function(resolve){
      
      const timer = {
        uid: resolve.uid,
        time: Date.now(),
        current: true,
    }
    let id = resolve.uid
    let objectid;
    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
    if (err) {
      console.error(err)
      res.send({
        error: err
      })
    }
    const db = client.db(dbname)
    const collection = db.collection("timer")
    collection.insertOne(timer, (err, result) => {
      if(err) res.send(err)
      else{
        objectid = timer._id
        res.send(timer)

        setTimeout(function(timer) {
          console.log('starting')
          collection.find(ObjectId(objectid)).toArray((err, items) => {
            if(err) console.log(err)   
            else{
              let current = items[0].current;
              console.log(current)
              if(current === true){
                console.log('Danger')
              }
              else console.log('No Danger')
            }  
          })
        }, 15000);

      } 
    })
  
    client.close();
    })
  
    }).catch(function(reject){
      // console.log(reject)
      // console.log("I'm back catch")
      res.status(401).send(reject.error)
    });
  });
  
  app.post('/api/stoptimer',(req,res)=>{

    var auth =  authen(req.body.idToken).then(async function(resolve){
      
    let id = resolve.uid
    let objectid = req.body._id;
    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
    if (err) {
      console.error(err)
      res.send({
        error: err
      })
    }
    const db = client.db(dbname)
    const collection = db.collection("timer")

    var newvalues = { $set: { current: false } };

    collection.updateOne({_id: ObjectId(objectid)},newvalues, (err, result) => {
      if(err) res.send(err)
      else{
        res.send({
          status: "Timer stopped"
        })

      } 
    })
  
    client.close();
    })
  
    }).catch(function(reject){
      // console.log(reject)
      // console.log("I'm back catch")
      res.status(401).send(reject.error)
    });
  });



app.listen(3000, () => {
  console.log('Listening on port 3000!')
}); 