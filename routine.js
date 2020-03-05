const http = require('http');

module.exports.setLightAPI = function (DeviceID,HomeID)
{
            var data = JSON.stringify({
              idToken: "1111",
              DeviceID: DeviceID,
              HomeID: HomeID,
              Hex: "#FFFFFFFF"
            })

            //console.log("Light API started" + data + " Type: " + typeof(data))
              var options = {
                host: 'localhost',
                port: 3000,
                path: '/setLight',
                method: 'POST',
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
                  
}

module.exports.LightOffAPI = function (DeviceID,HomeID)
{
            var data = JSON.stringify({
              idToken: "1111",
              DeviceID: DeviceID,
              HomeID: HomeID,
            })

            //console.log("Light API started" + data + " Type: " + typeof(data))
              var options = {
                host: 'localhost',
                port: 3000,
                path: '/LightOff',
                method: 'POST',
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
                  
}