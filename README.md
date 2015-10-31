# evasion

High Level Architecture:

* Port 1990 Web Socket: Both Prey and Hunter must connect to this port to received published gameplay
* Port 1991 Web Socket: Hunter's connection to Server
* Port 1992 Web Socket: Prey's connection to Server

Files:
  
  * server.js: node js file with all game logic
  * test.html : sample html5 + javascript websockets client

Folders:
  * evasion (dir) : eclipse maven project containing sample java websockets client
  * readme (dir) : documentation on bouncing rules, etc.

__Instructions:__

``````
    
    npm install websocket

    npm install express
    
``````

`````

    nodejs server.js

`````

or

`````

    node server.js
    
`````

^ if you are running on energon2 you have latter command. Test locally or change ports if you are running on energon to avoid conflicts


