/*
 *
 *   @brief: Control Tello
 *
 */
const readline = require('readline'),
  rl = readline.createInterface(process.stdin, process.stdout),
  prefix = 'Tello Mission> ';
const trimNewlines = require('trim-newlines');
const fs = require('fs')
const commandErr = new Error('Tello Command Error');
const WebSocket = require('ws'); // Used by Sinric


const TELLO_PORT = 8889;
const TELLO_HOST = '192.168.10.1';
const SINRIC_API_KEY = "PUT_YOUR_API_KEY_HERE";


var commandDelays = new Map([
  ['command', 500],
  ['takeoff', 5000],
  ['land', 5000],
  ['up', 7000],
  ['down', 7000],
  ['left', 5000],
  ['go', 7000],
  ['right', 5000],
  ['forward', 5000],
  ['back', 5000],
  ['cw', 5000],
  ['ccw', 5000],
  ['flip', 3000],
  ['speed', 3000],
  ['battery?', 500],
  ['speed?', 500],
  ['time?', 500]
]);

var dgram = require('dgram');

function telloMessage (message) {
    return new Promise(resolve => {
    let rx;
    var client = dgram.createSocket({type: 'udp4', reuseAddr: true}).bind(8001);
    
    client.send(message, 0, message.length, TELLO_PORT, TELLO_HOST, function(err, bytes) {
	  if (err) throw err;  
	});
	
    client.on('error', function(e) {
      throw e;
    });

	client.on('message', (msg,info) => {
		rx = trimNewlines (msg.toString());
		console.log('Data received from server: ' + rx);
		resolve(rx);
		client.close()
	});	
	});							
}

async function doTelloCommand (commandStr) {

  try {
     var result = await telloMessage(commandStr);
     console.log('Resolved to ' + result + ' for command ' + commandStr);
     if (result === 'error') { throw commandErr; }
     return result;
  } catch (err) {
      throw err;
  }

}

function wait (timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

async function doTelloCommandWithRetry (command) {
  const MAX_RETRIES = 3;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      if (i === 0) {
        console.log('Trying', command); } else {
        console.log('Re-Trying', command, i);
        }
      var message = await doTelloCommand(new Buffer(command));
//      console.log(message);
      break;
    } catch (err) {
      console.log(err.message);
      const timeout = 500 * Math.pow(2, i);
      console.log('Waiting', timeout, 'ms');
      await wait(timeout);
    }
  }  
}


/*
 *
 *   @brief: Control Alexa
 *
 */
const options = {
    headers: {
        "Authorization" : Buffer.from("apikey:" + SINRIC_API_KEY).toString('base64')
    }
};

 // Keep live and detect disconnection
 function heartbeat() {
    clearTimeout(this.pingTimeout);
  
    this.pingTimeout = setTimeout(() => {
      console.log("No Connection. Killing node...")
      this.terminate();
    }, 30000 + 1000);
  }

const ws = new WebSocket('ws://iot.sinric.com', options);

ws.on('open', heartbeat);
ws.on('ping', heartbeat);
ws.on('close', function clear() {
  clearTimeout(this.pingTimeout);
});

ws.on('open', function open() {
   console.log("Connected. waiting for commands..");
});

/*
 *  This function will be called when you ask Alexa to do something.
 *  I classified the command using devicedId
 *
 */
ws.on('message', function incoming(data) {
   console.log("Request : " + data)
   let cmdObj = JSON.parse(data);

   console.log(JSON.stringify(cmdObj))
   if (cmdObj.deviceId == "5e4d335f0aa6af0700841572") {
        console.log("Alexa set drone up")
        doTelloCommandWithRetry("takeoff")
        console.log("Done takeoff")

    } else if (cmdObj.deviceId == "5e4d33890aa6af0700841580") {
        console.log("Alexa set drone down")
        doTelloCommandWithRetry("land")
        console.log("Done landing")
        
    }

});



setTimeout(doTelloCommandWithRetry, "500", "command");
console.log("Done")
