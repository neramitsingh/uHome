const express = require('express')
const MongoClient = require("mongodb").MongoClient;
const dbname = "uHomeDB"
const hue = require('./hue')
var randomstring = require("randomstring");
const http = require('http'); 

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

app.get('/status', (req, res) => {
  
  res.send({
    "message": "Online"
  })
  
  })


app.post('/api/addHueUser', (req, res) => {
  var auth = authen(req.body.idToken).then(async function (resolve) {
    //console.log(resolve)
    var result = hue.addHueUser().then(function (resolve) {
      res.send(resolve)

    }).catch(function (reject) {
      res.send(reject)
    })
    console.log(result)

  }).catch(function (reject) {
    // console.log(reject)
    // console.log("I'm back catch")
    res.status(401).send(reject.error)
  });
})

app.get('/convert', (req, res) => {
  function httpGet2() {
    const data = JSON.stringify({
    "idToken": "1111",
	  "LightId": "4"
  })
    //console.log("Light API started" + data + " Type: " + typeof(data))
    return new Promise(((resolve, reject) => {
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/switchLight',
        method: 'POST',
        json:{
          "idToken": "1111",
          "LightId": "4"
        },
        headers: {
          'Content-Type': 'application/json'
        }
    
    };

    var req = http.request(options, (res) => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:', res.headers);
    
      res.on('data', (d) => {
        process.stdout.write(d);
      });
    });
    
    req.on('error', (e) => {
      console.error(e);
    });
    
    req.write(data);
    req.end();
    
  }));
}
async function run(){
  var response = httpGet2();
  console.log("################################# Response ##########################")
  console.log(response)
}
run();
})


app.post('/api/addHueUser/callback', (req, res) => {
  var code = req.body.code;
  var state = req.body.state

  var obj = {
    "code": code,
    "state": state
  }

  console.log(obj)

  var auth = authen(req.body.idToken).then(async function (resolve) {

     var uid = resolve.uid

    var result = hue.addHueUser(code).then(function (resolve) {

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
          if (err) res.send(err)
          else res.send(result)
        })

        client.close();

      })
      res.send(resolve)
    }).catch(function (reject) {
      res.send(reject)
    })
    console.log(result)

  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });


})


app.post('/switchLight', (req, res) => {

  // console.log("Body: ")
  // console.log(req.body)
  var LightId = req.body.LightId
  var auth = authen(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid

    //console.log(resolve)
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

      var query1 = new Promise((resolve, reject) => {
        console.log("### Query 1 ###")
        collection.findOne({ uid: uid }, (err, result) => {
          if (err) {
            reject(err);
            console.log(err)
          }
          //console.log(result);
          resolve(result);

        })

        client.close();
      })

      var run = () => {
        return query1.then(async function (resolve) {

          var access = resolve.tokens.access.value
            , refresh = resolve.tokens.refresh.value
            , username = resolve.username
            , expire = resolve.tokens.refresh.expiresAt
          var state = await hue.switchLight(access, refresh, username, LightId);
          //console.log(resolve)
          res.send({
            "message": "toggle activated",
            "current_state": state
          })
        }).catch(function (reject) {
          res.send(reject.err)
        })


      }

      run();

    })
  }).catch(function (reject) {
    res.status(401).send(reject.error)
  });

})


app.post('/api/device/add', (req, res) => {

  var auth = authen(req.body.idToken).then(async function (resolve) {

    const device = {
      uid: resolve.uid,
      name: req.body.name,
      enabled: true,
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
        if (err) res.send(err)
        else res.send(device)
      })

      client.close();

    })

  }).catch(function (reject) {
    // console.log(reject)
    // console.log("I'm back catch")
    res.status(401).send(reject.error)
  });

});

app.post('/api/device/get', (req, res) => {

  var auth = authen(req.body.idToken).then(async function (resolve) {
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
      collection.find({ uid: id }).toArray((err, items) => {
        if (err) res.send(err)
        else res.send(items)
      })
      client.close();
    })

  }).catch(function (reject) {
    // console.log(reject)
    // console.log("I'm back catch")
    res.status(401).send(reject.error)
  });

});

app.get('/api/device/:id', (req, res) => {
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
    collection.find({ uid: id }).toArray((err, items) => {
      if (err) res.send(err)
      else res.send(items)
    })
    client.close();
  })
});

app.post('/api/toggleswitch', (req, res) => {
  var auth = authen(req.body.idToken).then(async function (resolve) {
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

      var query1 = new Promise((resolve, reject) => {
        console.log("### Query 1 ###")
        collection.find(ObjectId(req.body.did)).toArray(function (err, result) {
          if (err) reject(err);
          console.log(result);
          val = result[0].on;
          resolve(result);

        })
      })

      var query2 = () => {
        return query1.then(async function (resolve) {
          console.log("### Query 2 ###")
          if (val == true) val = false;
          else if (val == false) val = true;

          var newvalues = { $set: { on: val } };

          collection.updateOne({ _id: ObjectId(req.body.did) }, newvalues, function (err, result) {
            if (err) {
              console.log(err)
              return res.send(err);
            }
            console.log(result);
            res.send(result);
            client.close();
          });
        }).catch(function (reject) {
          res.send(reject.err)
        })
      }

      query2();
      client.close();
    })

  }).catch(function (reject) {
    res.status(401).send(reject.error)
  });
})

app.post('/api/starttimer', (req, res) => {

  var auth = authen(req.body.idToken).then(async function (resolve) {
    console.log("-----------------------Starting Timer--------------------------")

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
        if (err) res.send(err)
        else {
          objectid = timer._id
          timer.time = timer.time.toString()
          res.status(200).send(timer)

          setTimeout(function (timer) {
            console.log('starting')
            collection.find(ObjectId(objectid)).toArray((err, items) => {
              if (err) console.log(err)
              else {
                let current = items[0].current;
                console.log(current)
                if (current === true) {
                  console.log('Danger')
                }
                else console.log('No Danger')
              }
            })
          }, 36000);

        }
      })

      client.close();
    })

  }).catch(function (reject) {
    // console.log(reject)
    // console.log("I'm back catch")
    res.status(401).send(reject.error)
  });
});

app.post('/api/stoptimer', (req, res) => {

  var auth = authen(req.body.idToken).then(async function (resolve) {

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

      collection.updateOne({ _id: ObjectId(objectid) }, newvalues, (err, result) => {
        if (err) res.send(err)
        else {
          res.send({
            status: "Timer stopped"
          })

        }
      })

      client.close();
    })

  }).catch(function (reject) {
    // console.log(reject)
    // console.log("I'm back catch")
    res.status(401).send(reject.error)
  });
});

app.post('/api/setEnabled', (req, res) => {

  var deviceId = req.body._id
  var toSetEnabled = req.body.enabled
  var auth =  authen(req.body.idToken).then(async function(resolve){

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

      var newvalues = { $set: { enabled: toSetEnabled } };

      collection.updateOne({ _id: ObjectId(deviceId) }, newvalues, (err, result) => {
        if (err) res.send(err)
        else {
          res.send({
            "_id": deviceId,
            "enabled": toSetEnabled
          })

        }
      })

      client.close();
    })
    
    

  }).catch(function(reject){
    
    res.status(401).send(reject.error)
  });
  })


  app.post('/api/device/delete', (req, res) => {

  var deviceId = req.body._id
  var auth =  authen(req.body.idToken).then(async function(resolve){

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


      collection.deleteOne({ _id: ObjectId(deviceId) }, (err, result) => {
        if (err) res.send(err)
        else {
          res.send({
            "message": "Delete successful"
          })

        }
      })

      client.close();
    })
    
    

  }).catch(function(reject){
    
    res.status(401).send(reject.error)
  });
  })




app.listen(3000, () => {
  console.log('Listening on port 3000!')
});

module.exports.updateHueToken = function (data, UID){

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
    const collection = db.collection("HueCred")

    var query1 = new Promise((resolve, reject) => {
      console.log("### Query 1 ###")
      collection.deleteOne({uid: UID},function (err, result) {
        if (err) reject(err);
        console.log(result);
        val = result[0].on;
        resolve(result);

      })
    })

    var query2 = () => {
      return query1.then(async function (resolve) {
        console.log("### Query 2 ###")
        if (val == true) val = false;
        else if (val == false) val = true;

        var newvalues = { $set: { on: val } };

        collection.updateOne({ _id: ObjectId(req.body.did) }, newvalues, function (err, result) {
          if (err) {
            console.log(err)
            return res.send(err);
          }
          console.log(result);
          res.send(result);
          client.close();
        });
      }).catch(function (reject) {
        res.send(reject.err)
      })
    }

    query2();
    client.close();
  })

}

