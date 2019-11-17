const express = require('express')
const MongoClient = require("mongodb").MongoClient;
const dbname = "uHomeDB"
const hue = require('./hue')
var randomstring = require("randomstring");

//const url = "mongodb://localhost:27017/";
//const { ExpressAdapter } = require('ask-sdk-express-adapter');
const uri = "mongodb+srv://uHomeB:uhome@uhome-bakds.mongodb.net/test?retryWrites=true&w=majority";
const ObjectId = require('mongodb').ObjectID;
const app = express();
var cors = require('cors')

app.use(cors())
app.use(express.json());

const authen = require('./authen')


//format
// app.post('/', (req, res) => {
//   var auth =  authen(req.body.idToken).then(async function(resolve){
    
//     
    
//   }).catch(function(reject){
//     
//     res.status(401).send(reject.error)
//   });
//   })



app.post('/', (req, res) => {
var auth =  authen(req.body.idToken).then(async function(resolve){
  //console.log(resolve)
  var result = hue.addHueUser().then(function(resolve){
    res.send(resolve)
  
  }).catch(function(reject){
    res.send(reject)
  })
  console.log(result)
  
}).catch(function(reject){
  // console.log(reject)
  // console.log("I'm back catch")
  res.status(401).send(reject.error)
});
})


app.get('/callback', (req, res) => {
  var code = req.query.code;
  var state = req.query.state

  var obj = {
    "code" : code,
    "state" : state
  }

  console.log(obj)

  var auth =  authen(req.body.idToken).then(async function(resolve){

    var uid = resolve.uid
  
    var result = hue.addHueUser(code).then(function(resolve){

      MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }, (err, client) => {
      if (err) {
        console.error(err)
        return
      }
      const db = client.db(dbname)
      const collection = db.collection("HueCred")
  
      collection.insertOne(creds, (err, result) => {
        if(err) res.send(err)
        else res.send(result)
      })
    
      client.close();
      
      })
        res.send(resolve)
      }).catch(function(reject){
        res.send(reject)
      })
      console.log(result)
        
      }).catch(function(reject){
        
        res.status(401).send(reject.error)
      });

  
  })


  app.get('/switchLight', (req, res) => {

    var LightId = req.body.LightId
    var auth =  authen(req.body.idToken).then(async function(resolve){
      
      console.log(typeof(LightId))
      var uid = resolve.uid

      console.log(resolve)
      MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }, (err, client) => {
      if (err) {
        console.error(err)
        res.send(err)
      }
      const db = client.db(dbname)
      const collection = db.collection("HueCred")
  
      var val;
  
      var query1 = new Promise((resolve,reject)=> {
        console.log("### Query 1 ###")
        collection.findOne({uid: uid},(err,result) => {
          if(err) {
             reject(err);
             console.log(err)
          }
          //console.log(result);
          resolve(result);
          
         })

         client.close();
        })
  
         var run = () =>{
          return query1.then(async function(resolve){

            var access = resolve.tokens.access.value
            , refresh = resolve.tokens.refresh.value
            , username = resolve.username
             hue.switchLight(access, refresh, username, LightId);
            console.log(resolve)

            res.send("done")
      }).catch(function(reject){
        res.send(reject.err)
      })

      
    }
    
    run();
    
    })
  
    }).catch(function(reject){
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
  client.close();


      

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