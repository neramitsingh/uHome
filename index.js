const express = require('express')

const MongoClient = require("mongodb").MongoClient;
const dbname = "uHomeDB"
const uri = "mongodb+srv://uHomeB:uhome@uhome-bakds.mongodb.net/test?retryWrites=true&w=majority";
const ObjectId = require('mongodb').ObjectID;


const hue = require('./hue')
const noti = require('./notification')
const estimote = require('./estimote')
const routine = require('./routine')
const sun = require('./sun')
const authen = require('./authen')
const smart = require('./smartLearn')


const https = require('https');
const mysql = require('mysql');
const request = require('request');

const app = express();
const cors = require('cors')



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

app.post('/admin/getDevice/Estimote/Beacon', (req, res) => {

  var HomeID = req.body.HomeID
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var getEst = await getEstimoteKey(HomeID)


    var AppID = getEst[0].AppID
    var AppToken = getEst[0].AppToken

    var data = []

    var options = {
      uri: 'https://cloud.estimote.com/v3/devices',
      method: 'GET',
      //auth: 'uhome-g7u:edeae45dd50b1d0ff0f4efbe7f165a91',
      auth: {
          username: AppID,
          password: AppToken
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
        'Content-Type': 'application/json'
      }
    };

    request(options, async (err, resp, body) => {
        if (err) {
            res.send({
              message: error
            })
            return console.log(err);
        }
        console.log(JSON.parse(body));

        var k = JSON.parse(body)

        await Promise.all(k.data.map(async (elem) => {

          var exists = await compareEstimoteBeacon(elem.identifier).catch(function (reject) {
            res.send({
              message: "error"
            })
          })

          if (exists == false) {
            data.push(elem)
          }

        }))

        res.send({
          message: data
        })

    });

  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})

app.post('/getEstimoteKey', (req, res) => {

  var HomeID = req.body.HomeID
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var result = await getEstimoteKey(HomeID)

    if (result.length != 0) {
      res.send({
        AppID: result[0].AppID,
        AppToken: result[0].AppToken,
        EstimoteKeyExists: true
      })

    } else {
      res.send({
        message: "No AppID and AppToken in database.",
        EstimoteKeyExists: false
      })
    }

  }).catch(function (reject) {
    res.status(401).send(reject.error)
  });
})

app.post('/admin/addDevice/Estimote/Beacon', (req, res) => {

  var EstObjs = req.body.message
  var HomeID = req.body.HomeID
  var Length = req.body.Length
  var Width = req.body.Width

  var size,power

  if(Length >= Width) size = Length
  else size = Width

  if(size <= 1) power = -40
  else if(size <= 3.5) power = -20
  else if(size <= 7) power = -16
  else if(size <= 15) power = -12
  else if(size <= 30) power = -8
  else if(size <= 40) power = -4
  else if(size <= 50) power = 0
  else if(size <= 70) power = 4
  else power = 20


  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    //var HueCred = await getHueCreds(uid)

    var EstimoteKey = await getEstimoteKey(HomeID)

    var AppID = EstimoteKey[0].AppID
    var AppToken = EstimoteKey[0].AppToken

    EstObjs.forEach(est => {


      var con = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "uhomesql"
      });

      con.connect(async function (err) {
        if (err) res.send({
          "message": error
        })

        var sql = `INSERT INTO device (Name, RoomID, Type) VALUES ("${est.Name}","${est.RoomID}","Estimote Beacon")`;

        con.query(sql, async function (err, result) {
          if (err) res.send({
            "message": error
          })
          else {
            var DeviceID = result.insertId

            // var LightHue = await hue.getLight(access, refresh, username, light.LightID);

            var obj = {
              "DeviceID": DeviceID,
              // "HomeID": HomeID,
              "Info": est.Info,
              "Enabled": true,
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
                //else console.log(result)
              })

              client.close();

            })
          }
        });

        ////////////////////////////////////////////////////////////////////

        await estimote.postSettings(AppID,AppToken,est.Info.identifier,power)

        await getEstimoteBeaconAttachments(AppID, AppToken).then(function (resolve) {

          var arr = []

          var attachments = resolve

          attachments.forEach(attachment => {

            if (attachment.identifier != null) {
              if (attachment.identifier == est.Info.identifier) {

                console.log("Found attachment")
                arr.push([attachment.identifier, attachment.id])

              }
            }
          })

          if (arr.length == 1) {

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

              var sql = `SELECT * FROM room WHERE RoomID = '${est.RoomID}' `

              con.query(sql, function (err, result) {
                if (err) res.send({
                  "message": err
                })
                else {

                  var body = JSON.stringify({

                    "data": {
                      "payload": {
                        "HomeID": result[0].HomeID.toString(),
                        "RoomID": est.RoomID.toString(),
                        "Name": result[0].Name,
                        "Type": result[0].Type
                      }
                    }
                  })

                  var options = {
                    hostname: 'cloud.estimote.com',
                    path: `/v3/attachments/${arr[0][1]}`,
                    method: 'PATCH',
                    //auth: 'uhome-g7u:edeae45dd50b1d0ff0f4efbe7f165a91',
                    auth: `${AppID}:${AppToken}`,
                    headers: {
                      'Access-Control-Allow-Origin': '*',
                      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
                      'Content-Type': 'application/json',
                      'Content-Length': body.length
                    }

                  };

                  var req = https.request(options, function (resp) {
                    console.log("statusCode: ", res.statusCode);
                    console.log("headers: ", res.headers);

                    resp.on('data', async function (d) {

                      var k = JSON.parse(d)

                      console.log("************** Response from Estimote API: ***********************")
                      console.log(JSON.stringify(k))


                    });
                  })
                  req.write(body);
                  req.end();

                  req.on('error', function (e) {
                    console.error(e);
                    //reject(e)
                  });


                }

              })
            })


          } else {

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

              var sql = `SELECT * FROM room WHERE RoomID = '${est.RoomID}' `

              con.query(sql, function (err, result) {
                if (err) res.send({
                  "message": err
                })
                else {

                  var body = JSON.stringify({

                    "data": {
                      "payload": {
                        "HomeID": result[0].HomeID.toString(),
                        "RoomID": est.RoomID.toString(),
                        "Name": result[0].Name,
                        "Type": result[0].Type
                      },
                      "identifier": est.Info.identifier,
                      "for": "device"
                    }
                  })

                  var options = {
                    hostname: 'cloud.estimote.com',
                    path: `/v3/attachments`,
                    method: 'POST',
                    //auth: 'uhome-g7u:edeae45dd50b1d0ff0f4efbe7f165a91',
                    auth: `${AppID}:${AppToken}`,
                    headers: {
                      'Access-Control-Allow-Origin': '*',
                      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
                      'Content-Type': 'application/json',
                      'Content-Length': body.length
                    }

                  };

                  var req = https.request(options, function (resp) {
                    console.log("statusCode: ", res.statusCode);
                    console.log("headers: ", res.headers);

                    resp.on('data', async function (d) {

                      var k = JSON.parse(d)

                      console.log("************** Response from Estimote API: ***********************")
                      console.log(JSON.stringify(k))


                    });
                  })
                  req.write(body);
                  req.end();

                  req.on('error', function (e) {
                    console.error(e);
                    //reject(e)
                  });


                }

              })
            })
          }

        }).catch(function (reject) {


        })

        ///////////////////////////////////////////////////////////////////

      })
    })

    res.send({
      "message": "Devices added"
    })


  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
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

        var check = `SELECT * FROM home_user WHERE HomeID = "${homeID}" AND  UserID = "${resolve}"`

        con.query(check, function (err, result) {
          console.log(result)
          if (err) res.send({
            "message": err
          })
          else {
            if (result.length == 0) {
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
            } else res.send({
              message: "The user you are trying to add already exists."
            })
          }

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

  var HomeID = req.body.HomeID
  var message = req.body.message
  var newValues = []

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    await Promise.all(message.map(async (elem) => {

      newValues.push([HomeID, elem.name, elem.type])

    }))

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

      //var sql = `INSERT INTO room (HomeID, Name, Type) VALUES ('${homeID}',"${name}","${type}") `
      var sql = `INSERT INTO room (HomeID, Name, Type) VALUES ? `

      con.query(sql, [newValues], function (err, result) {
        if (err) res.send({
          "message": err
        })
        else
          res.send({
            "message": "Records inserted"
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

        await Promise.all(resolve.map(async (elem) => {

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

app.post('/user/getDevices/Hue', (req, res) => {

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

      var sql = `SELECT DeviceID, Name FROM device WHERE RoomID = '${RoomID}' AND Type = "Hue";`

      con.query(sql, async function (err, result) {
        if (err) res.send({
          "message": err
        })
        else {

          await Promise.all(result.map(async (elem) => {

            var light = await getLightfromDB(elem.DeviceID)

            elem.on = light.On
            elem.status = light.Status

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

app.post('/user/getDevices/Estimote/Beacon/Show', (req, res) => {

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

      var sql = `SELECT DeviceID, Name FROM device WHERE RoomID = '${RoomID}' AND Type = "Estimote Beacon";`

      con.query(sql, async function (err, result) {
        if (err) res.send({
          "message": err
        })
        else {

          // await Promise.all(result.map(async (elem) => {

          //   var light = await getLightfromDB(elem.DeviceID)

          //   elem.on = light.On
          //   elem.status = light.Status

          // }))


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

  var HomeID = req.body.HomeID
  var RoomID = req.body.RoomID
  var Name = req.body.Name
  var Type = req.body.Type

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    console.log("-----------------------Starting Timer--------------------------")

    var date = new Date()

    var day = ('0' + date.getDate()).slice(-2)
    var month = ('0' + (date.getMonth() + 1)).slice(-2)
    var year = date.getFullYear()

    var dateString = `${day}/${month}/${year}`


    const timer = {
      uid: resolve.uid,
      RoomID: RoomID,
      HomeID: HomeID,
      Name: Name,
      Type: Type,
      StartTime: Date.now(),
      Date: dateString,
      current: true,
    }

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
      const collection2 = db.collection("setting")

      var timeOut = 1;

      collection2.find({HomeID: HomeID}).toArray((err, items) => {
        if (err) console.log(err)
        timeOut = items[0].NotiTime

        timeOut = Number(timeOut)
        timeOut = timeOut * 60000
      })

      collection.insertOne(timer, (err, result) => {
        if (err) res.send(err)
        else {
          objectid = timer._id
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

                  var con = mysql.createConnection({
                    host: "127.0.0.1",
                    user: "root",
                    password: "",
                    database: "uhomesql"
                });

                var sql = `SELECT user_noti.RegisID FROM home_user inner join user_noti on home_user.UserID = user_noti.UserID where HomeID = ${HomeID}`
                    
                    con.connect(async function(err) {
                      if (err) console.log(err)
                      con.query(sql,async function (err, result, fields) {
                        if (err) throw err;

                        noti.notifyUsers(result)
                        
                      })
                    })

                } else console.log('No Danger')
              }
            })
          }, timeOut); //Time in ms

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
        },
        $push: {
          StopTimer: Date.now()
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

app.post('/api/getUserActivity', (req, res) => {

  var date = req.body.date
  var HomeID = req.body.HomeID

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    let id = resolve.uid
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

      var query = {
        $and: [{
            uid: id
          },
          {
            current: false
          },
          {
            Date: date
          },
          {
            HomeID: HomeID
          }
        ]
      }

      collection.find(query).toArray(function (err, result) {
        if (err) throw err;

        // if(result.length != 0){
        var toSend = calculateUserActivity(result).then(function (resolve) {

          res.send({
            message: resolve
          })
        })
      });

      client.close();

    })

  }).catch(function (reject) {
    // console.log(reject)
    // console.log("I'm back catch")
    res.status(401).send(reject.error)
  });
});


app.post('/home/getUserLocations', (req, res) => {

  var arr = []

  var HomeID = req.body.HomeID

  var date = new Date()

  var day = ('0' + date.getDate()).slice(-2)
  var month = ('0' + (date.getMonth() + 1)).slice(-2)
  var year = date.getFullYear()

  var dateString = `${day}/${month}/${year}`
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(function (err) {
      if (err) throw err;

      var query = `SELECT * FROM home_user WHERE HomeID = ${HomeID}`

      con.query(query, async function (err, result, fields) {
        if (err) throw err;

        console.log(result)

        MongoClient.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }, async (err, client) => {
          if (err) {
            console.error(err)
            // res.send({
            //   error: err
            // })
          }
          const db = client.db(dbname)
          const collection = db.collection("timer")


        await Promise.all(result.map(async (elem) => {

          var user = await authen.getUser(elem.UserID);

            var query = {
              $and: [{
                  uid: elem.UserID
                },
                {
                  current: true
                },
                {
                  Date: dateString
                },
                {
                  HomeID: HomeID
                }
              ]
            }

            console.log("UID: " + elem.UserID)
            console.log(typeof(elem.UserID))
            console.log("Date: "+dateString)
            console.log("HomeID: "+HomeID)

            collection.find(query).toArray(function (err, result) {
              if (err) console.log(err);

              console.log("Result from Timer: ")

              console.log(result)

              console.log(result.length)

              if (result.length != 0) {
                var time = new Date(result[result.length-1].StartTime)

                var hours = ('0'+ (time.getHours())).slice(-2)
                var mins = ('0' + time.getMinutes()).slice(-2)

                var obj = {
                  UserID: elem.UserID,
                  RoomName: result[result.length-1].Name,
                  UserName: user.displayName,
                  EnterTime: `${hours}:${mins}`
                }

                arr.push(obj)
              }
              else{
                console.log("Nothing found")
                var obj = {
                  UserID: elem.UserID,
                  RoomName: "Unknown",
                  UserName: user.displayName,
                  EnterTime: "Unknown"
                }

                arr.push(obj)
     
              }

            });

        }))

        client.close();
        })

      });
    });

    // console.log("Array: ***")

    // console.log(arr)

    setTimeout(()=>{
      res.send({
        message: arr
      })
    },2000)

    // res.send({
    //   message: arr
    // })

  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})




//Below this line needs revision
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Add Device to uHome //TODO: implement individual insert to both DBs
app.post('/admin/addDevice/Hue', (req, res) => {

  //var HomeID = req.body.HomeID
  var LightObjs = req.body.message;

  console.log(LightObjs)

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid
    LightObjs.forEach(async light => {
      var HueCred = await getHueCreds(light.HomeID)

      var access = HueCred.tokens.access.value,
        refresh = HueCred.tokens.refresh.value,
        username = HueCred.username

      //var arr = [light.Name.toString(), light.RoomID.toString()]

      var con = mysql.createConnection({
        host: "127.0.0.1",
        user: "root",
        password: "",
        database: "uhomesql"
      });

      con.connect(function (err) {
        if (err) //res.send({
          //   "message": error
          // })
          console.log(err)

        var sql = `INSERT INTO device (Name, RoomID, Type) VALUES ("${light.Name}","${light.RoomID}","Hue")`;

        con.query(sql, async function (err, result) {
          if (err) // res.send({
            //   "message": error
            // })
            console.log(err)
          else {
            var DeviceID = result.insertId

            var LightHue = await hue.getLight(access, refresh, username, light.LightID);

            var obj = {
              "DeviceID": DeviceID,
              "Info": LightHue,
              "Enabled": true,
              "On": LightHue.state.on
            }

            console.log(obj)

            MongoClient.connect(uri, {
              useNewUrlParser: true,
              useUnifiedTopology: true
            }, (err, client) => {
              if (err) {
                // res.send({
                //   "message": error
                // })
                console.log(err)
                return
              }
              const db = client.db(dbname)
              const collection = db.collection("devices")

              collection.insertOne(obj, (err, result) => {
                if (err) //res.send(err)
                  console.log(err)
                // else res.send({
                //   message: result
                // })
              })

              client.close();

            })
          }
        });

      })

      res.send({
        "message": "Devices added"
      })

    })
    // .catch(function (reject) {
    //   res.send({
    //     message: reject
    //   })
    // })

  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})

app.post('/checkHueCred', (req, res) => {

  var HomeID = req.body.HomeID

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid


    var HueCred = getHueCreds(HomeID).then(async function (resolve) {
      console.log(resolve)

      if (resolve == null) {
        res.send({
          "hasHueCred": false
        })
      } else {
        res.send({

          "hasHueCred": true
        })
      }
    }).catch(function (reject) {
      res.send({
        "message": reject
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



app.post('/api/addHueUser/callback', (req, res) => {
  var code = req.body.code;
  var state = req.body.state
  var HomeID = req.body.HomeID;



  var obj = {
    "code": code,
    "state": state
  }

  console.log(obj)

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var uid = resolve.uid



    var resultcred = await hue.addHueUser(code)
      .catch(function (reject) {
        res.send({
          message: "Token retrieval failed",
          obj: reject
        })
      })

    console.log(resultcred)

    insertHueCred(resultcred, uid).then(function (resolve) {
      res.send({
        message: "Success",
        object: resolve

      })
    }).catch(function (reject) {
      res.send({
        message: "Failed",
        object: reject
      })
    })

    //Copy to home
    insertHueCredHome(resultcred, HomeID)

  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });


})


app.post('/switchLight', (req, res) => {

  // console.log("Body: ")
  // console.log(req.body)
  var DeviceID = req.body.DeviceID
  var HomeID = req.body.HomeID

  console.log("DeviceID = " + DeviceID)
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid

    var Light = await getLightfromDB(DeviceID)

    var LightID = Light.Info.id

    console.log(LightID);


    var HueCred = getHueCreds(HomeID).then(async function (resolve) {

      var access = resolve.tokens.access.value,
        refresh = resolve.tokens.refresh.value,
        username = resolve.username,
        expire = resolve.tokens.refresh.expiresAt
      var state = await hue.switchLight(access, refresh, username, LightID);

      console.log(state)

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
            On: state
          }
        };

        collection.updateOne({
          //_id: ObjectId("5e384705f372471f18d611f1")
          DeviceID: Number(DeviceID)
        }, newvalues, (err, result) => {
          if (err) res.send(err)
          else {
            res.send({
              "message": "Light switched",
              "current_state": state
            })

          }
        })
        client.close()
      })


      //console.log(resolve)


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
  var HomeID = req.body.HomeID

  var Hex = req.body.Hex

  var Hexval = "#" + Hex.substring(3, 9)
  var brightHex = Hex.substring(1, 3)

  var brightness = parseInt(brightHex, 16);

  console.log(brightness)

  if (brightness == 0) brightness = 1
  if (brightness == 255) brightness = 254

  //console.log("New Hex: "+Hexval)

  const hexToRgb = hex =>
    hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16))

  var RGB = hexToRgb(Hexval);


  console.log("DeviceID = " + DeviceID)
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid

    var Light = await getLightfromDB(DeviceID)

    var LightID = Light.Info.id

    console.log(LightID);


    var HueCred = getHueCreds(HomeID).then(async function (resolve) {

      var access = resolve.tokens.access.value,
        refresh = resolve.tokens.refresh.value,
        username = resolve.username,
        expire = resolve.tokens.refresh.expiresAt
      var state = hue.setLight(access, refresh, username, LightID, RGB, brightness);
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

app.post('/loopLight', (req, res) => {

  // console.log("Body: ")
  // console.log(req.body)
  var DeviceID = req.body.DeviceID
  var HomeID = req.body.HomeID

  var Hex = req.body.Hex

  var Hexval = "#" + Hex.substring(3, 9)
  var brightHex = Hex.substring(1, 3)

  var brightness = parseInt(brightHex, 16);

  console.log(brightness)

  if (brightness == 0) brightness = 1
  if (brightness == 255) brightness = 254

  //console.log("New Hex: "+Hexval)

  const hexToRgb = hex =>
    hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
    .substring(1).match(/.{2}/g)
    .map(x => parseInt(x, 16))

  var RGB = hexToRgb(Hexval);


  console.log("DeviceID = " + DeviceID)
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid

    var Light = await getLightfromDB(DeviceID)

    var LightID = Light.Info.id

    console.log(LightID);


    var HueCred = getHueCreds(HomeID).then(async function (resolve) {

      var access = resolve.tokens.access.value,
        refresh = resolve.tokens.refresh.value,
        username = resolve.username,
        expire = resolve.tokens.refresh.expiresAt
      var state = hue.LightLoop(access, refresh, username, LightID, RGB, brightness);
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


app.post('/LightOff', (req, res) => {

  // console.log("Body: ")
  // console.log(req.body)
  var DeviceID = req.body.DeviceID
  var HomeID = req.body.HomeID

  // var Hex = req.body.Hex

  // var Hexval = "#" + Hex.substring(3, 9)
  // var brightHex = Hex.substring(1, 3)

  // var brightness = parseInt(brightHex, 16);

  // console.log(brightness)

  // if (brightness == 0) brightness = 1
  // if (brightness == 255) brightness = 254

  // //console.log("New Hex: "+Hexval)

  // const hexToRgb = hex =>
  //   hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
  //   .substring(1).match(/.{2}/g)
  //   .map(x => parseInt(x, 16))

  // var RGB = hexToRgb(Hexval);


  console.log("DeviceID = " + DeviceID)
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid

    var Light = await getLightfromDB(DeviceID)

    var LightID = Light.Info.id

    console.log(LightID);


    var HueCred = getHueCreds(HomeID).then(async function (resolve) {

      var access = resolve.tokens.access.value,
        refresh = resolve.tokens.refresh.value,
        username = resolve.username,
        expire = resolve.tokens.refresh.expiresAt
      var state = hue.LightOff(access, refresh, username, LightID);
      //console.log(resolve)
      console.log(state)
      res.send({
        "message": "Light off"
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

  var HomeID = req.body.HomeID
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {
    var uid = resolve.uid

    var LightsAtHome = await getLightsAtHome(HomeID)

    await getHueCreds(HomeID).then(async function (resolve) {

      var access = resolve.tokens.access.value,
        refresh = resolve.tokens.refresh.value,
        username = resolve.username,
        expire = resolve.tokens.refresh.expiresAt

      var lights = await hue.getAllLights(access, refresh, username);
      //console.log(resolve)
      console.log(lights)

      var LightArr = []

      await Promise.all(lights.map(async (light) => {

        var result = await compareLights(light._id, LightsAtHome)

        if (result == false) {

          var obj = {
            "LightID": light._id,
            "Name": light.name,
            "Select": false
          }

          LightArr.push(obj)
        }

      }))
      res.send({
        "message": LightArr
      })
    }).catch(function (reject) {
      res.send(reject.err)
    })


  }).catch(function (reject) {
    res.status(401).send(reject.error)
  });

})

app.post('/searchLight', (req, res) => {

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

function getHueCreds(HomeID) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        console.error(err)
        reject(err)
      }
      const db = client.db(dbname)
      const collection = db.collection("HueCred")


      console.log("### Query 1 ###")
      collection.findOne({
        HomeID: Number(HomeID)
      }, (err, result) => {
        if (err) {
          reject(err);
          console.log(err)
        } else {
          console.log(result);
          resolve(result);
        }

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

app.post('/notification/addRegis', (req, res) => {
  var RegisID = req.body.RegisID

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var uid = resolve.uid


    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      var sql = `INSERT INTO user_noti (UserID, RegisID) VALUES ('${uid}', '${RegisID}')`;

      con.query(sql, function (err, result) {
        if (err) res.send({
          "message": err
        })
        res.send({
          message: "1 record inserted"
        })
        console.log("1 record inserted");

      });
    })

  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})


app.post('/admin/add/Estimote/App', (req, res) => {
  var AppID = req.body.AppID
  var AppToken = req.body.AppToken
  var HomeID = req.body.HomeID

  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      var sql = `INSERT INTO estimote_key (HomeID, AppID, AppToken) VALUES ('${HomeID}', '${AppID}', '${AppToken}')`;

      con.query(sql, function (err, result) {
        if (err) res.send({
          "message": err
        })
        res.send({
          message: "1 record inserted"
        })

      });
    })

  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})

function getEstimoteKey(HomeID) {
  return new Promise((resolve, reject) => {

    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    var sql = `SELECT * FROM estimote_key WHERE HomeID = ${HomeID}`

    con.connect(function (err) {
      if (err) reject(err)
      con.query(sql, function (err, result, fields) {
        if (err) reject(err)
        console.log(result)
        resolve(result)
      });
    });

  })
}

function compareEstimoteBeacon(identifier) {

  return new Promise((resolve, reject) => {
    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        console.error(err)
        reject(err)
      }
      const db = client.db(dbname)
      const collection = db.collection("devices")

      collection.findOne({
        'Info.identifier': identifier
      }, (err, result) => {
        if (err) {
          reject(err);
          console.log(err)
        }
        console.log("Result = " + result);
        if (result == null) {
          resolve(false)
        } else {
          resolve(true)
        }

      })
      client.close();
    })
  })
}

function insertHueCred(value, uid) {
  return new Promise((resolve, reject) => {


    if (!value) {
      console.log("no fucking value in here")
      reject(value)
    }
    value.uid = uid
    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        console.error(err)
        reject(err)
        return
      }
      const db = client.db(dbname)
      const collection = db.collection("HueCred")

      collection.insertOne(value, (err, result) => {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          console.log(err)
          resolve(result)
        }
      })

      client.close();
    })
  })
}

function insertHueCredHome(value, HomeID) {
  return new Promise((resolve, reject) => {


    if (!value) {
      console.log("no fucking value in here")
      reject(value)
    }
    value.HomeID = HomeID
    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        console.error(err)
        reject(err)
        return
      }
      const db = client.db(dbname)
      const collection = db.collection("HueCred")

      collection.insertOne(value, (err, result) => {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          console.log(err)
          resolve(result)
        }
      })

      client.close();
    })
  })
}

function getLightsAtHome(HomeID) {
  return new Promise((resolve, reject) => {

    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    var sql = `SELECT device.DeviceID, device.Name FROM ((device INNER JOIN room ON device.RoomID = room.RoomID) INNER JOIN home on room.HomeID = home.HomeID) where home.HomeID = ${HomeID} and device.Type = "Hue"`

    con.connect(function (err) {
      if (err) reject(err)
      con.query(sql, function (err, result, fields) {
        if (err) reject(err)
        console.log(result)
        resolve(result)
      });
    });

  })
}

function compareLights(LightID, LightsAtHome) {

  console.log("Comparing: **********************")

  return new Promise(async (resolve, reject) => {

    //let flag = false;

    var arr = []

    var loop = async () => {
      //return new Promise(async (resolve, reject) => {
      return await Promise.all(LightsAtHome.map((device) => {
        MongoClient.connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }, (err, client) => {
          if (err) {
            console.error(err)
            reject(err)
          }
          const db = client.db(dbname)
          const collection = db.collection("devices")

          collection.findOne({
            DeviceID: Number(device.DeviceID)
          }, (err, result) => {
            if (err) {
              reject(err);
              console.log(err)
            }
            //console.log("Result = " + JSON.stringify(result));
            if (result != null)
              if (result.Info.id == LightID) {
                //resolve(true) //Light already exist at home
                arr.push("true")
                console.log("Found a match: " + result.Info.id + "  =  " + LightID)
              }
            else {
              arr.push("false")
              console.log("Nope")
            }
          })
          client.close();
        })

        if (arr.length == LightsAtHome.length) {
          resolve(arr)
        }

      }))

      //})
    }



    var check = await loop().then(function () {
      setTimeout(function () {
        //console.log(check.toString())
        if (arr.includes("true")) {
          console.log("Found it")
          resolve(true)
        } else {
          console.log("Suckaaa")
          resolve(false)
        }

      }, 1000)
    })

  })

}

function getEstimoteBeaconAttachments(AppID, AppToken) {
  console.log(AppID + " : " + AppToken)
  console.log("Started getting attachments")
  return new Promise((resolve, reject) => {
    var options = {
      hostname: 'cloud.estimote.com',
      path: '/v3/attachments',
      method: 'GET',
      //auth: 'uhome-g7u:edeae45dd50b1d0ff0f4efbe7f165a91',
      auth: `${AppID}:${AppToken}`,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
        'Content-Type': 'application/json'
      },
      //ciphers: 'DES-CBC3-SHA'
    };

    var req = https.request(options, function (resp) {
      console.log("statusCode: ", resp.statusCode);
      console.log("headers: ", resp.headers);

      resp.on('data', async function (d) {

        //process.stdout.write(d)

        console.log("Response here")
        //console.log(d)
        var k = JSON.parse(d)
        console.log(JSON.stringify(k.data))
        resolve(k.data)

      });
    })

    req.end();

    req.on('error', function (e) {
      console.error(e);
      reject(e)
    });

  })
}

function calculateUserActivity(result) {
  return new Promise((resolve, reject) => {

    var arr = {}

    for (let i = 0; i < result.length; i++) {

      var stop = (result[i].StopTimer[0])

      if (!(`${result[i].Name}` in arr)) {

        var date1 = Number(result[i].StopTimer[0])
        var date2 = Number(result[i].StartTime)

        console.log(typeof date1)
        console.log(typeof date2)

        console.log("Date 1: " + date1)
        console.log("Date 2: " + date2)

        //arr[`${result[i].RoomID}`] = (result[i].StopTimer[0]) - result[i].StartTimer

        arr[`${result[i].Name}`] = date1 - date2;

        //console.log(arr[`${result[i].RoomID}`])
      } else {
        let temp = arr[`${result[i].Name}`]

        let dif = date1 - date2
        console.log(dif)

        arr[`${result[i].Name}`] = temp + dif
      }
    }

    console.log(arr)

    var arr2 = Object.entries(arr)

    setTimeout(resolve(arr2), 3000)

  })
}

app.post('/findPhone', (req, res) => {

  var UserID = req.body.UserID
  var auth = authen.isAuthenticated(req.body.idToken).then(async function (resolve) {

    uid = resolve.uid

    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });

    con.connect(function (err) {
      if (err) throw err;
      //console.log("Connected!");

      var sql = `SELECT RegisID FROM user_noti WHERE UserID = "${UserID}"`

      con.query(sql, function (err, result, fields) {
        if (err) throw err;
        console.log(result);

        var value = [result[result.length - 1].RegisID]

        console.log("Value : " + JSON.stringify(result[result.length - 1]))

        if (result.length != 0) {
          noti.findPhone(value)
          res.send({
            message: "Ringing..."
          })
        } else res.send({
          message: "No Regis Token Found"
        })


      });


    });




  }).catch(function (reject) {

    res.status(401).send(reject.error)
  });
})




app.post('/routine/add', (req, res) => {

  var DeviceID = req.body.DeviceID
  var HomeID  = req.body.HomeID
  var Hours = req.body.Hours
  var Minutes = req.body.Minutes
  var Action = req.body.Action
  var Sunrise = req.body.Sunrise
  var Sunset = req.body.Sunset
  var Lat = req.body.Lat
  var Long = req.body.Long

  var auth =  authen.isAuthenticated(req.body.idToken).then(async function(resolve){

    if(Sunrise == true){

      addSuntoRoutine("sunrise", DeviceID, HomeID, Action, Lat, Long, true, "sunrise")

      await insertSun(DeviceID, HomeID, true, false, Action, Lat, Long).then(
    
        res.send({
          message: "Routine added"
        })).catch( (reject) =>{
        res.send({
          message: reject
        })
      })



    }
    else if(Sunset == true){

      addSuntoRoutine("sunset", DeviceID, HomeID, Action, Lat, Long, true, "sunset")

      await insertSun(DeviceID, HomeID, false, true, Action, Lat, Long).then(

        res.send({
          message: "Routine added"
        })).catch( (reject) =>{
        res.send({
          message: reject
        })
      })

    }

    else{
      await insertRoutine(DeviceID, HomeID, Hours, Minutes, Action, false).then(
    
        res.send({
          message: "Routine added"
        })).catch( (reject) =>{
        res.send({
          message: reject
        })
      })
    }
  
  }).catch(function(reject){
    
    res.status(401).send(reject.error)
  });

})



app.post('/routine/get', (req, res) => {

  var HomeID  = req.body.HomeID

  var arr = []
  
  var auth =  authen.isAuthenticated(req.body.idToken).then(async function(resolve){

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
      const collection = db.collection("routine")

      var query = {
       HomeID: HomeID
      }

      collection.find(query).toArray(function (err, result) {
        if (err) throw err;

        var con = mysql.createConnection({
          host: "127.0.0.1",
          user: "root",
          password: "",
          database: "uhomesql"
        });
        
        con.connect(async function(err) {
          if (err) throw err;
          console.log("Connected!");

          await Promise.all(result.map(async (elem) => {
  
            var sql = `SELECT * FROM device WHERE DeviceID = ${elem.DeviceID};`
    
            con.query(sql, function (err, sqlresult) {
              if (err) res.send({
                message: err
              })

              console.log(sqlresult)

              elem.Name = sqlresult[0].Name

              console.log(elem)

              arr.push(elem)

            });

    
          }))

          setTimeout(()=>{
            res.send({
              message: arr
            })
          },2000)

          

        });

        
      });

      client.close();

    })
    

    
  
  }).catch(function(reject){
    
    res.status(401).send(reject.error)
  });

})



app.post('/routine/delete', (req, res) => {

  // var HomeID  = req.body.HomeID
  var objectid = req.body._id
  
  var auth =  authen.isAuthenticated(req.body.idToken).then(async function(resolve){

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
      const collection = db.collection("routine")

      var query = {
        _id: ObjectId(objectid)
      }

      collection.deleteOne(query, (err, result) => {
        if (err) reject(err)

        console.log("Deleted Routine")

        res.send({
          message: "Deleted Routine"
        })

      })

      client.close();

    })

    

    
  
  }).catch(function(reject){
    
    res.status(401).send(reject.error)
  });

})






app.post('/delete/home', (req, res) => {

  var HomeID = req.body.HomeID

  var auth =  authen.isAuthenticated(req.body.idToken).then(async function(resolve){

    var con = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "uhomesql"
    });
    
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `DELETE FROM home WHERE HomeID = '${HomeID}';`

      con.query(sql, function (err, result) {
        if (err) res.send({
          message: err
        })
        res.send({
          message: "Deleted"
        })
      });

    });

  }).catch(function(reject){
    
    res.status(401).send(reject.error)
  });
  })

    app.post('/delete/room', (req, res) => {

      var RoomID = req.body.RoomID
    
      var auth =  authen.isAuthenticated(req.body.idToken).then(async function(resolve){
    
        var con = mysql.createConnection({
          host: "127.0.0.1",
          user: "root",
          password: "",
          database: "uhomesql"
        });
        
        con.connect(function(err) {
          if (err) throw err;
          console.log("Connected!");
          var sql = `DELETE FROM room WHERE RoomID = '${RoomID}';`
    
          con.query(sql, function (err, result) {
            if (err) res.send({
              message: err
            })
            res.send({
              message: "Deleted"
            })
          });
    
        });
    
      }).catch(function(reject){
        
        res.status(401).send(reject.error)
      });
      })

      app.post('/delete/device', (req, res) => {

        var DeviceID = req.body.DeviceID
      
        var auth =  authen.isAuthenticated(req.body.idToken).then(async function(resolve){
      
          var con = mysql.createConnection({
            host: "127.0.0.1",
            user: "root",
            password: "",
            database: "uhomesql"
          });
          
          con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            var sql = `DELETE FROM device WHERE DeviceID = '${DeviceID}';`
      
            con.query(sql, function (err, result) {
              if (err){
                res.send({
                  message: err
                })
                return
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
          
          
                collection.deleteOne({
                  DeviceID: DeviceID
                }, (err, result) => {
                  if (err) res.send(err)
                  else {
                    res.send({
                      "message": "Device Deleted"
                    })
          
                  }
                })
          
                client.close();
              })
            });
      
          });
      
        }).catch(function(reject){
          
          res.status(401).send(reject.error)
        });
        })


        app.post('/delete/userfromhome', (req, res) => {

          var UserID = req.body.UserID
        
          var auth =  authen.isAuthenticated(req.body.idToken).then(async function(resolve){
        
            var con = mysql.createConnection({
              host: "127.0.0.1",
              user: "root",
              password: "",
              database: "uhomesql"
            });
            
            con.connect(function(err) {
              if (err) throw err;
              console.log("Connected!");
              var sql = `DELETE FROM home_user WHERE UserID = '${UserID}';`
        
              con.query(sql, function (err, result) {
                if (err) res.send({
                  message: err
                })
                res.send({
                  message: "Deleted"
                })
              });
        
            });
        
          }).catch(function(reject){
            
            res.status(401).send(reject.error)
          });
          })

          app.post('/getAllLightsRoutine', (req, res) => {

            var HomeID = req.body.HomeID
          
            var auth =  authen.isAuthenticated(req.body.idToken).then(async function(resolve){

              getLightsAtHome(HomeID).then((resolve)=>{
                
                res.send({
                  message: resolve
                })
              }).catch((reject)=>{
                res.send({
                  message: reject
                })
              })
          
            }).catch(function(reject){
              
              res.status(401).send(reject.error)
            });
            })







  
  function insertRoutine(DeviceID, HomeID, Hours, Minutes, Action, Sun, SunType)
  {

    return new Promise((resolve,reject)=>{

      if(SunType == "sunrise"){
        var obj = {
          DeviceID: DeviceID,
          HomeID: HomeID,
          Hours: Hours,
          Minutes: Minutes,
          Action: Action,
          Sun: Sun,
          Sunrise: true
        }
      }
      else if(SunType == "sunset"){
        var obj = {
          DeviceID: DeviceID,
          HomeID: HomeID,
          Hours: Hours,
          Minutes: Minutes,
          Action: Action,
          Sun: Sun,
          Sunset: true
        }
      }
      else{
        var obj = {
          DeviceID: DeviceID,
          HomeID: HomeID,
          Hours: Hours,
          Minutes: Minutes,
          Action: Action,
          Sun: Sun
        }
      }

      
  
      MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }, (err, client) => {
        if (err) {
          reject(err)
          return
        }
        const db = client.db(dbname)
        const collection = db.collection("routine")
  
        collection.insertOne(obj, (err, result) => {
          if (err) reject(err)
          console.log("Routine added")
          resolve(result)
          //else console.log(result)
        })
        client.close();
      })

    })
  }

  function insertSun(DeviceID, HomeID, Sunrise, Sunset, Action, Lat, Long)
  {

    return new Promise((resolve,reject)=>{

      var obj = {
        DeviceID: DeviceID,
        HomeID: HomeID,
        Sunrise: Sunrise,
        Sunset: Sunset,
        Action: Action,
        Lat: Lat,
        Long: Long
      }
  
      MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }, (err, client) => {
        if (err) {
          reject(err)
          return
        }
        const db = client.db(dbname)
        const collection = db.collection("sun")
  
        collection.insertOne(obj, (err, result) => {
          if (err) reject(err)
          console.log("Sun setting added")
          resolve(result)
          //else console.log(result)
        })
        client.close();
      })

    })
  }





  app.listen(3000, () => {
    console.log('Listening on port 3000!')
  });


//////// Check every minute to get routine ///////
MongoClient.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, async (err, client) => {
  if (err) {
    console.error(err)
    return
  }
setInterval(()=>{
  var time = new Date()

  var hours = ('0'+ (time.getHours())).slice(-2)
  var mins = ('0' + time.getMinutes()).slice(-2)

  console.log("Time: "+ hours + ":" + mins)

  if(hours == "00" && mins == "00")
  {

    deleteSunfromRoutine()

    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        console.error(err)
        return
      }
  
      const db = client.db(dbname)
      const collection = db.collection("sun")
      
      //res.send(req.params.id)
      collection.find({}).toArray(async (err, items) => {
        if (err) console.log(err)
  
        console.log("Query result")
        console.log(items)
  
        await Promise.all(items.map(async (elem) => {
  
          if(elem.Sunrise == true)
          {

            addSuntoRoutine("sunrise", elem.DeviceID, elem.HomeID, elem.Action, elem.Lat, elem.Long)
            
          }
          else if(elem.Sunset == true)
          {

            addSuntoRoutine("sunset", elem.DeviceID, elem.HomeID, elem.Action, elem.Lat, elem.Long)
            
          }
  
        }))
  
        
      })
      client.close();
    })
  }

  if(hours == "21")
  {

    //smartLearning()

  }



  ////////////////////////////////////////////////////////////////


  

    var query = {
      $and: [{
          Hours: hours
        },
        {
          Minutes: mins
        }
      ]
    }

    const db = client.db(dbname)
    const collection = db.collection("routine")
    
    //res.send(req.params.id)
    collection.find(query).toArray(async (err, items) => {
      if (err) console.log(err)

      console.log("Query result")
      console.log(items)

      await Promise.all(items.map(async (elem) => {

        if(elem.Action == "On")
        {
          routine.setLightAPI(elem.DeviceID,elem.HomeID)
        }
        else if(elem.Action == "Off")
        {
          routine.LightOffAPI(elem.DeviceID,elem.HomeID)
        }

      }))
 
    })
    
  
},60000)

})

async function addSuntoRoutine(ss, DeviceID, HomeID, Action, Lat, Long){

            var sunCall = await sun.getSun(Lat, Long)
            var value

            if(ss == "sunrise"){
              value = sunCall.sunrise
              var timeArray = await sun.getTime(value).then(async (resolve)=>{
                await insertRoutine(DeviceID, HomeID, resolve[0], resolve[1], Action, true, ss)
              })
            } 
            else if(ss == "sunset"){
              value = sunCall.sunset
              var timeArray = await sun.getTime(value).then(async (resolve)=>{
                await insertRoutine(DeviceID, HomeID, resolve[0], resolve[1], Action, true, ss)
              })
            } 

            

}

function deleteSunfromRoutine()
{

  return new Promise((resolve,reject)=>{

    var query = {
      Sun: true
    }

    MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
      if (err) {
        reject(err)
        return
      }
      const db = client.db(dbname)
      const collection = db.collection("routine")

      collection.deleteMany(query, (err, result) => {
        if (err) reject(err)
        console.log("Deleted all sun routine")
        resolve(result)
        //else console.log(result)
      })
      client.close();
    })

  })
}


async function smartLearning(){

  var date = getDateString()

  var weekArray = await smart.getWeekArray(date)

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
    const collection2 = db.collection("setting")


    var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "uhomesql"
});
    
    con.connect(async function(err) {
      if (err) console.log(err)
      con.query("SELECT * FROM home",async function (err, result, fields) {
        if (err) throw err;
        console.log(result);

        await Promise.all(result.map(async (elem) => {

          console.log(elem.HomeID)

          var query2 = {
            $and: [
              {
                HomeID: elem.HomeID.toString()
              },
              {
                Learn: true
              }
            ]
          }
      
          collection2.find(query2).toArray(async function (err, result2) {
            if (err) console.log(err)

            console.log(result2)
      
            await Promise.all(result2.map(async (elem2) => {

              var query = {
                $and: [{
                    uid: elem2.UserID
                  },
                  {
                    current: false
                  },
                  // {
                  //   $or: weekArray
                  // },
                  {
                    HomeID: elem2.HomeID
                  },
                  {
                    Type: "Bathroom"
                  }
                ]
              }
        
              collection.find(query).toArray(async function (err, result3) {
                if (err) throw err;

                var times = result3.length
        
                //console.log(result3)
                var totalTime = await calculateUserActivity(result3).then(async function (resolve) {
        
                var resultAvg = await smart.calculateAvg(resolve, times)                 
                //console.log(resultAvg/60000)

                var data = await smart.sdDataPrep(result3)

                var sd = await smart.calculateSD(data)

                console.log(sd)


                //var sd = await smart.calculateSD(result3, resultAvg, times)
                })
              });

            }))

            
          });


        }))

      });
    });
  });

    
}




function getDateString(){
  var date = new Date()

  var day = ('0' + date.getDate()).slice(-2)
  var month = ('0' + (date.getMonth() + 1)).slice(-2)
  var year = date.getFullYear()

  var dateString = `${day}/${month}/${year}`

  return dateString
}

smartLearning()







