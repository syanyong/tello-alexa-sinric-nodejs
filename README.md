# Tello-Alexa-Sinric
Control the Tello drone from Amazon Alexa (Echodot).
I used [https://sinric.com](https://sinric.com) to be the bridge. I adapted from [jsolderitsch/tello-nodejs](https://github.com/jsolderitsch/tello-nodejs) to control the Tello and [kakopappa/sinric](https://github.com/kakopappa/sinric) to command the Alexa.


# Operation
1. Talk to Alexa Echodot
2. Alexa echodot push the information to Sinric
3. Sinric send command to this script using WebSocket
4. Ours script command the Tello drone using UDP Socket


# Prerequisite
* Node v12.14.1
