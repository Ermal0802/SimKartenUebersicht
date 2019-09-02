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

function dateDE(str) {

  var tag = str.substr(0, 2);
 	var monate = str.substr(3, 2);
  var jahre = str.substr(6, 4);

  var d = new Date(jahre+ "-" + monate + "-" +tag );


  return d;
}

function dateName(d) {
  var tage = d.getDate();
  var monat = d.getMonth();

  d.setDate(tage + 5);

  var namen = [
    'Jan.', 'Feb.', 'Mar.', 'Apr.', 'Mai.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'
  ];

  tag = namen[monat] + ' ' + d.getFullYear().toString().substr(2, 2);
  return tag;
}



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
  if (process.argv.indexOf('debug') != -1) {
    win.webContents.openDevTools();
  }
  win.loadFile('index.html');



  ipcMain.on('dbTest', function(event, args) {
    /*
        let db = new sqlite3.Database('./Database/sim_db.sqlite');

        db.serialize(function() {

          let cname = "LOl";
          let CID;

          db.get(
            "SELECT (SELECT ID FROM Customs WHERE Name = ?) as ID",
            [cname],
            function(err, row) {
              if (err) {
                console.log(err);
                return;
              }

              CID = row.ID;

              db.run(
                "INSERT OR IGNORE INTO Customs(Name,Tel,IP) VALUES(?,?,?);",
                [cname, '321', '12343'],
                function(err) {
                  if (err) {
                    console.log(err);
                    return;
                  }

                  if (CID === null) {
                    CID = this.lastID;
                  }



                });
            }
          );
        });*/
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

              for (let obj of liste) {
                if (obj["CUSTOM1"] in gruppen) {
                  gruppen[obj["CUSTOM1"]].total += parseInt(obj["TOTAL_AMOUNT"]);
                  if(gruppen[obj["CUSTOM1"]].start > dateDE(obj["USAGE_RECORD_START_TIMESTAMP"])) {
                    gruppen[obj["CUSTOM1"]].start = dateDE(obj["USAGE_RECORD_START_TIMESTAMP"]);
                    gruppen[obj["CUSTOM1"]].display = dateName(gruppen[obj["CUSTOM1"]].start);
                  }
                  if(gruppen[obj["CUSTOM1"]].ende < dateDE(obj["USAGE_RECORD_END_TIMESTAMP"])) {
                    gruppen[obj["CUSTOM1"]].ende = dateDE(obj["USAGE_RECORD_END_TIMESTAMP"]);
                  }
                } else {
                  gruppen[obj["CUSTOM1"]] = {
                    custom: obj["CUSTOM1"],
                    isdn: obj["MSISDN"],
                    ip: obj["CALLING_IP"],
                    total: parseInt(obj["TOTAL_AMOUNT"]),
                    start: dateDE(obj["USAGE_RECORD_START_TIMESTAMP"]),
                    ende: dateDE(obj["USAGE_RECORD_END_TIMESTAMP"]),
                    display: dateName(dateDE(obj["USAGE_RECORD_START_TIMESTAMP"]))
                  };
                }
              }



              let db = new sqlite3.Database('./Database/sim_db.sqlite');
              db.serialize(function() {
                for (var name in gruppen) {

                  db.get(
                    "SELECT (SELECT ID FROM Customs WHERE Name = ?) as ID",
                    [name],
                    function(cname, err, row) {
                      if (err) {
                        console.log(err);
                        return;
                      }

                      let CID = row.ID;

                      db.run(
                        "INSERT OR IGNORE INTO Customs(Name,Tel,IP) VALUES(?,?,?);",
                        [
                          cname,
                          gruppen[cname]["isdn"],
                          gruppen[cname]["ip"]
                        ],
                        function(err) {
                          if (err) {
                            console.log(err);
                            return;
                          }

                          if (CID === null) {
                            CID = this.lastID;
                          }

                          console.log(CID);
                          console.log(gruppen[cname]["display"]);
                          console.log(gruppen[cname]["total"]);
                          console.log(gruppen[cname]["start"]);
                          console.log(gruppen[cname]["ende"]);

                          //////////////////////////////
                          db.run(
                            "INSERT OR IGNORE INTO Monate(CID,Datum,Werte,Start,Ende) VALUES(?,?,?,?,?);",
                            [
                              CID,
                              gruppen[cname]["display"],
                              gruppen[cname]["total"],
                              gruppen[cname]["start"],
                              gruppen[cname]["ende"]
                            ],
                            function(err) {
                              if (err) {
                                console.log(err);
                              }
                            }
                          );
                        });
                    }.bind(null, name)
                  );
                }
              });

              console.log(gruppen);
              win.webContents.send("openFile", {
                content: Object.values(gruppen)
              });
            });
        });
      }
    }

  });
}
app.on('ready', createWindow);
