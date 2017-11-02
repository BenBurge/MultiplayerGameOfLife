// Game of life Multiplayer Setup

//Required Files
var http = require('http');
var path = require('path');
var socketio = require('socket.io');
var express = require('express');

//Global Variables
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

//Express Setup
router.use(express.static(path.resolve(__dirname, 'client')));
var port = 9999
var sockets = [];

//Game Variables
var gameBoard = [];
var gridSize = 10; //Size = size * size. Ex. 10x10 = 100 cells
var nGeneration = 0
var secondPerStep = 2500; //Speed in miliseconds for interval

/*
    This method is run every time a new socket is connected
    to the application.
*/
io.on('connection', function (socket) {
    //Push current board to new socket
    socket.on('requestBoard', function(){
        socket.emit('updateClient', gameBoard);
    });

    //Add socket to list of sockets
    sockets.push(socket);
    
    //On disconnect remove socket from list of sockets
    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
    });
    
    //The recieve event when a client sends an update
    socket.on('updateServer', function(data){
        gameBoard = data;
        io.emit('updateClient', gameBoard); //io.emit used to push to all connected sockets
    });
  });

//Creates a new blank board based on the given size
function newBoard(){
    var tempBoard = [];
    for(var row = 0; row < gridSize; row++){
        tempBoard[row] = [];
        for (var col = 0; col < gridSize; col++){
            tempBoard[row][col] = 0;
        }
    }
    return tempBoard;
}

function step(arr) {
    var newArr = newBoard();
    for(var row = 0; row < arr.length; row++) {
            for(var col = 0; col < arr[row].length; col++) {
                    var cell = arr[row][col];
                    var alives = aliveNeighbors(arr, row,col);

                    if(cell == 1) {
                            if(alives < 2) {
                                    newArr[row][col] = 0;
                            } else if(alives == 2 || alives == 3) {
                                    newArr[row][col] = 1;
                            } else if(alives > 3) {
                                    newArr[row][col] = 0;
                            }
                    } else if(cell == 0 && alives == 3) {
                            newArr[row][col] = 1;
                    }
            }
    }
    return newArr;
}

function aliveNeighbors(arr, row, col) {
    if(row > 0 && col > 0 && row < gridSize - 1 && col < gridSize - 1) {
            var totalAlive = 
                    arr[row-1][col-1]+
                    arr[row][col-1]+
                    arr[row+1][col-1]+
                    arr[row-1][col]+
                    arr[row+1][col]+
                    arr[row-1][col+1]+
                    arr[row][col+1]+
                    arr[row+1][col+1];
            return totalAlive;
    } else {
            return 0;
    }
}

server.listen(process.env.PORT || port, process.env.IP || "0.0.0.0", function(){
    var addr = server.address();
    console.log("Server running on port " + addr.port);
    console.log("Press ctrl+c to shtudown server manually.\n");

    //Setup new board on server start
    gameBoard = newBoard();
    //Game Loop
      setInterval(function(){
        //Get the next gen
        console.log("Generation #" + nGeneration);
        nGeneration++;
        gameBoard = step(gameBoard);
        io.emit('updateClient', gameBoard);
    }, 2500);
});
