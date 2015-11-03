require 'rubygems'
require 'websocket-client-simple'
require 'json'

def do_something
  [{ command: "M", direction: "N"  },
  { command: "M", direction: "E"  },
  { command: "M", direction: "W"  },
  { command: "M", direction: "S"  },
  { command: "M", direction: "NE"  },
  { command: "M", direction: "NW"  },
  { command: "M", direction: "SE"  },
  { command: "M", direction: "SW"  },
  { command: "M"}].sample
end

preySocket = WebSocket::Client::Simple.connect 'ws://localhost:1992'
publisherSocket = WebSocket::Client::Simple.connect 'ws://localhost:1990'

preySocket.on :message do |msg|
  puts msg.data
end

publisherSocket.on :message do |msg|
  puts msg.data
end

preySocket.on :close do |e|
  p e
  exit 1
end

preySocket.on :error do |e|
  p e
end

loop do
  sleep 0.5
  publisherSocket.send "stay alive"
  preySocket.send do_something.to_json
end
