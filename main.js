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
const sqlite3 = require('sqlite3').verbose();

function createWindow() {
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

      db.run("UPDATE Customs SET Name = ? WHERE IP = ?",[gruppen[custom],gruppen[ip]]);

      db.each("SELECT * FROM Customs", function(err, row) {
        if (err) {
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
        fs.readFile(files[0], function(err, buf) {
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
            .on('readable', function() {

              let spalten = null;
              let zeile;
              while (zeile = this.read()) {
                if (!spalten) {
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
                for (var k in spalten) {
                  o[spalten[k]] = i[k];
                }
                liste.push(o);
              }

              var gruppen = {};

              for (var obj of liste) {
                if (obj["CUSTOM1"] in gruppen) {
                  gruppen[obj["CUSTOM1"]]["total"] += parseInt(obj["TOTAL_AMOUNT"]);
                } else {
                  gruppen[obj["CUSTOM1"]] = {
                    custom: obj["CUSTOM1"],
                    isdn: obj["MSISDN"],
                    ip: obj["CALLING_IP"],
                    total: parseInt(obj["TOTAL_AMOUNT"])
                  };
                }
              }
              console.log(gruppen);
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
app.on('ready', createWindow);
