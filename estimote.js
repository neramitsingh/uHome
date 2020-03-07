const https = require('https');

module.exports.postSettings = function (AppID, AppToken, identifier, power) {

    return new Promise((resolve,reject)=>{

        power = power.toString()

        var body = JSON.stringify({

            "identifier": identifier,
            "pending_settings": {
                "advertisers": {
                    "estimote_location": [{
                        "index": 1,
                        "power": power
                    }],
                    "connectivity": [{
                        "index": 1,
                        "power": power
                    }],
                    "estimote_telemetry": [{
                        "index": 1,
                        "power": power
                    }],
                }
            }
        })
    
        var options = {
            hostname: 'cloud.estimote.com',
            path: `/v3/devices/${identifier}`,
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
            console.log("statusCode: ", resp.statusCode);
            console.log("headers: ", resp.headers);
    
            resp.on('data', async function (d) {
    
                var k = JSON.parse(d)
    
                console.log("************** Response from Estimote API: ***********************")
                console.log(JSON.stringify(k))

                resolve(k)
    
    
            });
        })
        req.write(body);
        req.end();
    
        req.on('error', function (e) {
            console.error(e);
            reject(e)
        });

    })

    

}