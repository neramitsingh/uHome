const express = require('express')
const MongoClient = require("mongodb").MongoClient;
const dbname = "uHomeDB"
const hue = require('./hue')
const http = require('http');
const mysql = require('mysql');
const uri = "mongodb+srv://uHomeB:uhome@uhome-bakds.mongodb.net/test?retryWrites=true&w=majority";
const ObjectId = require('mongodb').ObjectID;
const app = express();
const cors = require('cors')
const authen = require('./authen')
const Sync = require('sync');

var randomstring = require("randomstring");


//const url = "mongodb://localhost:27017/";
//const { ExpressAdapter } = require('ask-sdk-express-adapter');


app.use(cors())
app.use(express.json());




//format
// app.post('/', (req, res) => {
//   var auth =  authen.isAuthenticated(req.body.idToken).then(async function(resolve){

//     

//   }).catch(function(reject){
//     
//     res.status(401).send(reject.error)
//   });
//   })


//SQL DB format
// var con = mysql.createConnection({
//   host: "127.0.0.1",
//   user: "root",
//   password: "",
//   database: "uhomesql"
// });

// con.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
// });


app.get('/status', (req, res) => {

  res.send({
    "message": "Online"
  })

})


//##### User and Home Management #####
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/checkAdmin', (req, res) => {
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(async function (err) {
      if (err) res.send({
        "message": err
      })

      var searchAdmin = `SELECT * FROM admin WHERE UserID = '${resolve.uid}'`

      await con.query(searchAdmin, async function (err, result) {
        if (err) res.send({
          "message": err
        })
        //console.log(result);
        // Check whether user exists or not
        if (result.length == 0) { //User does not exist in DB
          var sql = `INSERT INTO admin (UserID) VALUES ('${resolve.uid}')`;
          con.query(sql, function (err, result) {
            if (err) res.send({
              "message": err
            })
            else
              res.send({
                "message": "1 record inserted",
                "admin": false,
                "AdminID": result.insertId
              })
            // var AdminID = result.insertId;
            // console.log(result);
            // console.log("AdminID: " + AdminID)
          });
        } else {
          res.send({
            "message": result,
            "admin": true
          })
        }
      });
    });
  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})

//Add Home to a user (Admin)
app.post('/admin/addHome', (req, res) => {
  //var adminID = req.body.adminID
  var name = req.body.name

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(async function (err) {
      if (err) res.send({
        "message": err
      })

      var searchAdmin = `SELECT * FROM admin WHERE UserID = '${resolve.uid}'`

      await con.query(searchAdmin, async function (err, result) {
        if (err) res.send({
          "message": err
        })

        // Check whether user exists or not
        if (result.length != 0) {

          var adminID = result[0].AdminID

          var sql = `INSERT INTO home (AdminID,Name) VALUES ('${adminID}',"${name}")`;

          con.query(sql, async function (err, result) {
            if (err) res.send({
              "message": err
            })
            else {

              var homeID = result.insertId

              var sql2 = `INSERT INTO home_user (HomeID,UserID) VALUES ('${homeID}',"${resolve.uid}")`;

              con.query(sql2, function (err, result) {
                if (err) res.send({
                  "message": err
                })
                else
                  res.send({
                    "message": result,
                    "HomeID": homeID
                  })
              })
            }
          });
        } else {
          res.send({
            "message": "AdminID not found"
          })
        }
      });
    });

  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})

app.post('/user/addtoHome', (req, res) => {

  var homeID = req.body.homeID
  var email = req.body.email

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var getid = authen.getUserID(email).then(function (resolve) {

      var uid = resolve.uid
      var con = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "uhomesql"
      });

      con.connect(async function (err) {
        if (err) res.send({
          "message": err
        })

        var sql = `INSERT INTO home_user (HomeID,UserID) VALUES ('${homeID}',"${resolve}")`;

        con.query(sql, function (err, result) {
          if (err) res.send({
            "message": err
          })
          else
            res.send({
              "message": "1 record inserted"
            })
        })

      });
    }).catch(function (reject) {
      res.send(reject)

    })

  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})

//Get list of homes to display for User
app.post('/user/getHome', (req, res) => {


  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {


    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(async function (err) {
      if (err) res.send({
        "message": err
      })

      var sql = `SELECT home_user.HomeID, home.Name from home_user INNER JOIN home ON home.HomeID = home_user.HomeID WHERE home_user.UserID = '${resolve.uid}'`

      con.query(sql, function (err, result) {
        if (err) res.send({
          "message": err
        })
        else
          res.send({
            "message": result
          })
      })

    });
  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})

//Get list of homes to display for Admin
app.post('/admin/getHome', (req, res) => {

  var adminID = req.body.adminID

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {


    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(async function (err) {
      if (err) res.send({
        "message": err
      })

      var sql = `SELECT HomeID, Name FROM home WHERE AdminID = '${adminID}' `

      con.query(sql, function (err, result) {
        if (err) res.send({
          "message": err
        })
        else
          res.send({
            "message": result
          })
      })

    });
  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})


//Get Room (Both Admin & User)
app.post('/getRoom', (req, res) => {

  var homeID = req.body.homeID

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {


    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(async function (err) {
      if (err) res.send({
        "message": err
      })

      var sql = `SELECT RoomID, Name, Type FROM room WHERE HomeID = '${homeID}' `

      con.query(sql, function (err, result) {
        if (err) res.send({
          "message": err
        })
        else
          res.send({
            "message": result
          })
      })

    });
  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})

//Admin add Room to Home
app.post('/admin/addRoom', (req, res) => {

  var homeID = req.body.homeID
  var name = req.body.name
  var type = req.body.type

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {


    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(async function (err) {
      if (err) res.send({
        "message": err
      })

      var sql = `INSERT INTO room (HomeID, Name, Type) VALUES ('${homeID}',"${name}","${type}") `

      con.query(sql, function (err, result) {
        if (err) res.send({
          "message": err
        })
        else
          res.send({
            "message": "1 record inserted"
          })
      })

    });
  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})

app.post('/admin/getUser', (req, res) => {

  var HomeID = req.body.HomeID

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
  var uid = resolve.uid
var SQLquery = new Promise((resolve, reject) => {

  var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "uhomesql"
  });

  con.connect(async function (err) {
    if (err) res.send({
      "message": err
    })

    var sql = `SELECT * FROM home_user WHERE HomeID = '${HomeID}' `

    con.query(sql, async function (err, result) {
      if (err) {
        res.send({
          "message": err
        })
        return
      } else {
        console.log(result)
        resolve(result)
      }
    })
    
  });
})
////////////////////////////////////////////////////////////////////////

var run = () => {
  return SQLquery.then(async function (resolve) {


    var newResult = []

      await Promise.all(resolve.map(async (elem) =>{

        var user = await authen.getUser(elem.UserID);

  
      var obj = {
        "HomeID": elem.HomeID,
        "Name": user.displayName,
        "UserID": elem.UserID,
        "Email": user.email
      }

      console.log(obj)

      newResult.push(obj)

      }))
    res.send({
          "message": newResult
        })

    
  }).catch(function (reject) {
    res.send(reject.err)
  })
}
run();
    
  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})





//  ##### Devices #######
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/user/getDevices', (req, res) => {

  var RoomID = req.body.RoomID

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid


    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(async function (err) {
      if (err) res.send({
        "message": err
      })

      var sql = `SELECT DeviceID, Name FROM device WHERE RoomID = '${RoomID}' `

      con.query(sql, async function (err, result) {
        if (err) res.send({
          "message": err
        })
        else{

          await Promise.all(result.map(async (elem) =>{
        
          var light = await getLightfromDB(elem.DeviceID)

          elem.on = light.Info.state.on
    
          }))


          res.send({
            "message": result
          })
        }
          
      })

    });
  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})




//##### Timer #####
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.post('/api/starttimer', (req, res) => {

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
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
                } else console.log('No Danger')
              }
            })
          }, 36000); //Time in ms

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

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

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

      var newvalues = {
        $set: {
          current: false
        }
      };

      collection.updateOne({
        _id: ObjectId(objectid)
      }, newvalues, (err, result) => {
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






//Below this line needs revision
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Add Device to uHome //TODO: implement individual insert to both DBs
app.post('/admin/addDevice/Hue', (req, res) => {
  var LightObjs = req.body.message;

  console.log(LightObjs)

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var uid = resolve.uid



    var HueCred = await getHueCreds(uid)

    var access = HueCred.tokens.access.value,
      refresh = HueCred.tokens.refresh.value,
      username = HueCred.username

    LightObjs.forEach(light => {

      //var arr = [light.Name.toString(), light.RoomID.toString()]

      var con = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "uhomesql"
      });

      con.connect(function (err) {
        if (err) res.send({
          "message": error
        })

        var sql = `INSERT INTO device (Name, RoomID) VALUES ("${light.Name}","${light.RoomID}")`;

        con.query(sql, async function (err, result) {
          if (err) res.send({
            "message": error
          })
          else {
            var DeviceID = result.insertId

            var LightHue = await hue.getLight(access, refresh, username, light.LightID);

            var obj = {
              "DeviceID": DeviceID,
              "Info": LightHue
            }

            MongoClient.connect(uri, {
              useNewUrlParser: true,
              useUnifiedTopology: true
            }, (err, client) => {
              if (err) {
                res.send({
                  "message": error
                })
                return
              }
              const db = client.db(dbname)
              const collection = db.collection("devices")

              collection.insertOne(obj, (err, result) => {
                if (err) res.send(err)
                else res.send(result)
              })

              client.close();

            })
          }
        });

      })

      res.send({
        "message": "Devices added"
      })

    }).catch(function (reject) {
      res.send({
        message: reject
      })
    })





  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})









app.post('/api/addHueUser', (req, res) => {
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
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

// app.get('/convert', (req, res) => {
//   function httpGet2() {
//     const data = JSON.stringify({
//       "idToken": "1111",
//       "LightId": "4"
//     })
//     //console.log("Light API started" + data + " Type: " + typeof(data))
//     return new Promise(((resolve, reject) => {
//       var options = {
//         host: 'localhost',
//         port: 3000,
//         path: '/switchLight',
//         method: 'POST',
//         json: {
//           "idToken": "1111",
//           "LightId": "4"
//         },
//         headers: {
//           'Content-Type': 'application/json'
//         }

//       };

//       var req = http.request(options, (res) => {
//         console.log('statusCode:', res.statusCode);
//         console.log('headers:', res.headers);

//         res.on('data', (d) => {
//           process.stdout.write(d);
//         });
//       });

//       req.on('error', (e) => {
//         console.error(e);
//       });

//       req.write(data);
//       req.end();

//     }));
//   }
//   async function run() {
//     var response = httpGet2();
//     console.log("################################# Response ##########################")
//     console.log(response)
//   }
//   run();
// })


app.post('/api/addHueUser/callback', (req, res) => {
  var code = req.body.code;
  var state = req.body.state

  var obj = {
    "code": code,
    "state": state
  }

  console.log(obj)

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var uid = resolve.uid

    var resultcred = hue.addHueUser(code).then(function (resolve) {
      resultcred.uid = uid

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

        collection.insertOne(resultcred, (err, result) => {
          if (err) res.send(err)
          else res.send(result)
        })

        client.close();

      })
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
  var DeviceID = req.body.DeviceID

  console.log("DeviceID = " + DeviceID)
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid

    var Light = await getLightfromDB(DeviceID)

    var LightID = Light.Info.id

    console.log(LightID);


    var HueCred = getHueCreds(uid).then(async function (resolve) {

      var access = resolve.tokens.access.value,
        refresh = resolve.tokens.refresh.value,
        username = resolve.username,
        expire = resolve.tokens.refresh.expiresAt
      var state = hue.switchLight(access, refresh, username, LightID);
      //console.log(resolve)
      console.log(state)
      res.send({
        "message": "toggle activated",
        "current_state": state
      })
    }).catch(function (reject) {
      res.send(reject.err)
    })


  }).catch(function (reject) {
    res.status(401).send(reject.error)
  });

})

app.post('/setLight', (req, res) => {

  // console.log("Body: ")
  // console.log(req.body)
  var DeviceID = req.body.DeviceID

  var Hex = req.body.Hex

  const hexToRgb = hex =>
  hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
             ,(m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16))

  var RGB = hexToRgb(Hex);


  console.log("DeviceID = " + DeviceID)
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid

    var Light = await getLightfromDB(DeviceID)

    var LightID = Light.Info.id

    console.log(LightID);


    var HueCred = getHueCreds(uid).then(async function (resolve) {

      var access = resolve.tokens.access.value,
        refresh = resolve.tokens.refresh.value,
        username = resolve.username,
        expire = resolve.tokens.refresh.expiresAt
      var state = hue.setLight(access, refresh, username, LightID, RGB);
      //console.log(resolve)
      console.log(state)
      res.send({
        "message": "Light set"
      })
    }).catch(function (reject) {
      res.send(reject.err)
    })


  }).catch(function (reject) {
    res.status(401).send(reject.error)
  });

})

//Get all lights
app.post('/getAllLights', (req, res) => {

  // console.log("Body: ")
  // console.log(req.body)
  //var LightId = req.body.LightId
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
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

      var query1 = new Promise((resolve, reject) => {
        console.log("### Query 1 ###")
        collection.findOne({
          uid: uid
        }, (err, result) => {
          if (err) {
            reject(err);
            console.log(err)
          }
          console.log(result);
          resolve(result);

        })

        client.close();
      })

      var run = () => {
        return query1.then(async function (resolve) {

          var access = resolve.tokens.access.value,
            refresh = resolve.tokens.refresh.value,
            username = resolve.username,
            expire = resolve.tokens.refresh.expiresAt
          var lights = await hue.getAllLights(access, refresh, username);
          //console.log(resolve)
          console.log(lights)

          var LightArr = []

          lights.forEach(light => {
            var obj = {
              "LightID": light._id,
              "Name": light.name
            }

            LightArr.push(obj)
          })

          res.send({
            "message": LightArr
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

app.post('/searchLight', (req, res) => {

  // console.log("Body: ")
  // console.log(req.body)
  //var LightId = req.body.LightId
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
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

      var query1 = new Promise((resolve, reject) => {
        console.log("### Query 1 ###")
        collection.findOne({
          uid: uid
        }, (err, result) => {
          if (err) {
            reject(err);
            console.log(err)
          }
          console.log(result);
          resolve(result);

        })

        client.close();
      })

      var run = () => {
        return query1.then(async function (resolve) {

          var access = resolve.tokens.access.value,
            refresh = resolve.tokens.refresh.value,
            username = resolve.username,
            expire = resolve.tokens.refresh.expiresAt
          var lights = await hue.searchLight(access, refresh, username);
          //console.log(resolve)
          console.log(lights)

          // var LightArr = []

          // lights.forEach(light => {
          //   var obj = {
          //     "LightID": light._id,
          //     "Name": light.name
          //   }

          //   LightArr.push(obj)
          // })

          // res.send({
          //   "message": LightArr
          // })
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

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

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

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    //////////////////////////////////////////////














    ///////////////////////////////////////////////
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
      collection.find({
        uid: id
      }).toArray((err, items) => {
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

//console.error(err)
app.get('/api/device/:id', (req, res) => {
  MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, (err, client) => {
    if (err) {
      return
    }
    console.log('Test API')
    const db = client.db(dbname)
    const collection = db.collection("devices")
    let id = req.params.id
    //res.send(req.params.id)
    collection.find({
      uid: id
    }).toArray((err, items) => {
      if (err) res.send(err)
      else res.send(items)
    })
    client.close();
  })
});

app.post('/api/toggleswitch', (req, res) => {
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
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

          var newvalues = {
            $set: {
              on: val
            }
          };

          collection.updateOne({
            _id: ObjectId(req.body.did)
          }, newvalues, function (err, result) {
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



app.post('/api/setEnabled', (req, res) => {

  var deviceId = req.body._id
  var toSetEnabled = req.body.enabled
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

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

      var newvalues = {
        $set: {
          enabled: toSetEnabled
        }
      };

      collection.updateOne({
        _id: ObjectId(deviceId)
      }, newvalues, (err, result) => {
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



  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})


app.post('/api/device/delete', (req, res) => {

  var deviceId = req.body._id
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

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


      collection.deleteOne({
        _id: ObjectId(deviceId)
      }, (err, result) => {
        if (err) res.send(err)
        else {
          res.send({
            "message": "Delete successful"
          })

        }
      })

      client.close();
    })



  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})




app.listen(3000, () => {
  console.log('Listening on port 3000!')
});

module.exports.updateHueToken = function (data, UID) {

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
      collection.deleteOne({
        uid: UID
      }, function (err, result) {
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

        var newvalues = {
          $set: {
            on: val
          }
        };

        collection.updateOne({
          _id: ObjectId(req.body.did)
        }, newvalues, function (err, result) {
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

function getHueCreds(uid) {
  return new Promise((resolve, reject) => {
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


      console.log("### Query 1 ###")
      collection.findOne({
        uid: uid
      }, (err, result) => {
        if (err) {
          reject(err);
          console.log(err)
        }
        console.log(result);
        resolve(result);
      })
      client.close();
    })
  })
}

function getLightfromDB(DeviceID) {

  return new Promise((resolve, reject) => {
    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        console.error(err)
        res.send(err)
      }
      const db = client.db(dbname)
      const collection = db.collection("devices")

      collection.findOne({
        DeviceID: Number(DeviceID)
      }, (err, result) => {
        if (err) {
          reject(err);
          console.log(err)
        }
        console.log("Result = " + result);
        resolve(result);
      })
      client.close();
    })
  })

}