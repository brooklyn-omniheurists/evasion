require 'rubygems'
require 'websocket-client-simple'
require 'json'

def do_something
  [{ command: "B" , wall: { length: Random.rand(300)+1, direction: ['E','N','W','S'].sample}  },
   { command: "M"},
   { command: "D", index: Random.rand(5)+1 }].sample
end

hunterSocket = WebSocket::Client::Simple.connect 'ws://localhost:1991'
publisherSocket = WebSocket::Client::Simple.connect 'ws://localhost:1990'

hunterSocket.on :message do |msg|
  puts msg.data
end

publisherSocket.on :message do |msg|
  puts msg.data
end

hunterSocket.on :close do |e|
  p e
  exit 1
end

hunterSocket.on :error do |e|
  p e
end

loop do
  dr = do_something
  sleep 0.5
  hunterSocket.send dr.to_json
end
