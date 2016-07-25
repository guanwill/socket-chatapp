//backend server
var express = require('express'),
app = express(),
server = require('http').createServer(app),
io = require('socket.io').listen(server),
users = {}; //to store nicknames connected to the chat. nickname would be key, and socket would be the value to the nickname.

server.listen(3000);

app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html');
})

io.sockets.on('connection', function(socket){   //this is like jquery's document.ready. all the socket events go inside this function

  //-----NEW USER EVENT-----
  socket.on('new user', function(data, callback){
    //put validation here, whether someone has taken this username already or not by checking if it exists in the array we defined above 'nicknames'
    if (data in users){ //if nickname exists inside the array
      callback(false); //send to the callback false
    }
    else{
      socket.nickname = data; //add nickname to socket.nickname so socket has a property nickname
      // nicknames.push(socket.nickname); //push this nickname into the nicknames array
      users[socket.nickname] = socket; //assigning socket as a value to socket.nickname key
      updateNicknames(); //emit to front-end list of nicknames
      callback(true);
    }
  })

  //-----NEW MESSAGE EVENT-----
  socket.on('send message', function(data, callback){  //give it an action name - this should be exactly the same as what you have defined it in index.htmt/front-end, and grab the data that we received from the front-end and do something with it.
    var msg = data.trim();
    if(msg.substr(0,3)=== '/w '){ //if the first 3 characters of msg is '/w '
      msg = msg.substr(3); //cut the first three letters off
      var ind = msg.indexOf(' '); //after cutting the first 3 letters, find the first space available

      if(ind !== -1) { //if a space exists...
        var name = msg.substr(0, ind) //then from index of 0 to that space would be the name of the user
        var msg = msg.substr(ind + 1)

        //-----WHISPERING EVENT-----
        if (name in users){ //if var name exists in users?....
          users[name].emit('whisper', {msg: msg, nick: socket.nickname});
          console.log('whisper');
        }
        else{
          callback('Error! Please enter a valid user!')
        }
      }
      else {
        callback('Error! Please enter a message for your whisper')
      }
    }
    else {
      io.sockets.emit('new message', {msg: data, nick: socket.nickname}); //we will broadecast that data to everyone including sender. creating properties of data such as data.msg and data.nick for their own socket
      // socket.broadecast.emit('new message', data); //instead of the line above, using this line will broad cast it to everyone except for the sender.
    }

  })


  //-----DISCONNECTING A USER-----
  socket.on('disconnect', function(data){
    if(!socket.nickname) return; //if user never had a nickname, just return and do nothing
    delete users[socket.nickname];
    // nicknames.splice(nicknames.indexOf(socket.nickname), 1); //on disconnect, finds the nickname in the nicknames array, then cut it out
    updateNicknames();
  })

  function updateNicknames(){
    io.sockets.emit('usernames', Object.keys(users));
  }



})
