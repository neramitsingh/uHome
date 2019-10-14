const express = require('express')
const mongoClient = require("mongodb").MongoClient;
const dbname = "uHomeDB"
const url = "mongodb://localhost:27017/";
const { ExpressAdapter } = require('ask-sdk-express-adapter');

const app = express();
app.use(express.json());

const skillBuilder = Alexa.SkillBuilders.custom();
const skill = skillBuilder.create();
const adapter = new ExpressAdapter(skill, true, true);

//app.post('/', adapter.getRequestHandlers());


app.get('/', (req, res) => {
  res.send('uHome')
});

app.post('/api/device',(req,res)=>{
    
    const device = {
        uid: 1,
        name: req.body.name,
        status: "connected"
    };

    mongoClient.connect(url, {
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
  mongoClient.connect(url, {
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
  let id = parseInt(req.params.id);
  collection.find({uid: id}).toArray((err, items) => {
    if(err) res.send(err)
    else res.send(items)
  })
  client.close();
})
});


app.listen(3000, () => {
  console.log('Listening on port 3000!')
});