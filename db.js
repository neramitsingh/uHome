const mongoClient = require("mongodb").MongoClient;
const dbname = "uHomeDB"
const url = "mongodb://localhost:27017/";
function openDB(){
    mongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }, (err, client) => {
    if (err) {
      console.error(err)
      return
    }
    
  })
}    

function closeDB(){
  client.close();
}

  

    module.exports.dbname = dbname
    module.exports.client = client
    module.exports.openDB = openDB
    module.exports.closeDB = closeDB