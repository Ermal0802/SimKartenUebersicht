// Hintergrund

const electron = require('electron');
const process = require('process');
const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog
} = electron;
const fs = require('fs');
const csv_parse = require('csv-parse');
const sqlite3 = require('sqlite3').verbose();;

/*ipcMain.on('asynchronous-message', (event, arg) => {
    /*if(arg === 'ping')
        event.sender.send('asynchronous-reply', 'pong');
    else
        event.sender.send('asynchronous-reply', 'unrecognized arg');

    if(arg.action == 'openFile') {
      fs.readFile('./textdatei.txt', function(err, data) {
        if(err) {
          console.log(err)
          return;
        }
        event.sender.send('asynchronous-reply',{
          action: 'fileContent',
          content: data
        })
      })
    }
})*/


function createWindow () {
  // Erstelle das Browser-Fenster.
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
    nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  win.webContents.openDevTools();
  win.loadFile('index.html');


  ipcMain.on('dbTest', function(event, args) {
    let db = new sqlite3.Database('./Database/sim_db.sqlite');

    db.serialize(function() {

      db.each("SELECT * FROM Example", function(err, row) {
        if(err) {
          console.log(err);
          return;
        }
        console.log(row);
      });

    });
  });

  //Fenster für Datei Öffnen
  ipcMain.on('openFile', function(event, args) {

    var files = dialog.showOpenDialogSync(win, {
      properties: ['openFile']
    });

    if (files != undefined) {
      if (files.length > 0) {
        fs.readFile(files[0],function(err, buf) {
          if (err) {
            console.log(err);
            return;
          }

          var output = [];

          csv_parse(buf.toString(), {
            trim: true,
            skip_empty_lines: true,
            delimiter: ";"
          })
          .on('readable', function(){

            let spalten = null;
            let zeile;
            while(zeile = this.read()){
              if(!spalten) {
                spalten = zeile;
              } else {
                output.push(zeile);
              }
            }

            var liste = [];
            // 'of' Werte von der liste
            // 'in' position von der Liste
            for (var i of output) {
            	//Erstellt für jede zahl ein Objekt.
            	var o = {};
                for(var k in spalten) {
                	o[spalten[k]] = i[k];
                }
                liste.push(o);
            }

            var gruppen = {};

            for (var obj of liste) {
              if (obj["CUSTOM1"] in gruppen) {
                gruppen[obj["CUSTOM1"]]["total"] += parseInt(obj["TOTAL_AMOUNT"]);
              }else {
                gruppen[obj["CUSTOM1"]] = {
                  custom: obj["CUSTOM1"],
                  isdn: obj["MSISDN"],
                  ip: obj["CALLING_IP"],
                  total: parseInt(obj["TOTAL_AMOUNT"])
                };
              }
            }

            win.webContents.send("openFile", {
              fileName: files[0],
              content: Object.values(gruppen)
            });
          });
        });
      }
    }

  });
}

/*
var content;
// First I want to read the file
fs.readFile('./textdatei.txt', function read(err, data) {
    if (err) {
        throw err;
    }
    content = data;

    // Invoke the next step here however you like
    console.log(content);   // Put all of the code here (not the best solution)
    processFile();          // Or put the next step in a function and invoke it
});
*/



app.on('ready', createWindow);
