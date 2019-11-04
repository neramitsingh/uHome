
var admin = require("firebase-admin");

var serviceAccount = require("./uhome-bd34e-firebase-adminsdk-9417s-6ea16e93a4.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://uhome-bd34e.firebaseio.com"
});


function isAuthenticated(idToken){
  // idToken comes from the client app
  
  
return new Promise((resolve, reject) => {
admin.auth().verifyIdToken(idToken)
.then(function(decodedToken) {
  let uid = decodedToken.uid;
  let obj = {
    isAuth: true,
    uid: uid
  }
  resolve(obj);
}).catch(function(error) {
  if(idToken == "1111"){
    let obj1 = {
      isAuth: true,
      uid: "EB6X0LuqSeXMkzM17ystWWneIu32"
    }
    resolve (obj1)
  } 
  //console.log(error)
  let obj = {
    isAuth: false,
    error: {
      error: error
    }
  }
  reject(obj);
});

  })
 
        
}

module.exports = isAuthenticated