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

  var d = new Date(jahre + "-" + monate + "-" + tag);


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
  win.setMenu(null);
  win.maximize();
  win.loadFile('index.html');


  ipcMain.on('dbTest', function(event, args) {

  });
  ipcMain.on('Reload', function(event, args) {
    console.log('test1');
    let db = new sqlite3.Database('./Database/sim_db.sqlite');
    db.serialize(function() {
      console.log("test2");
      db.all(
        "SELECT ID, Name, IP, Tel FROM Customs",
        [],
        function(err, customersRows) {
          if (err) {
            console.log(err);
            return;
          }

          let header = {};

          for (let k in customersRows[0]) {
            header[k] = {
              text: k,
              value: k
            };
          }

          header['Spark'] = {
            text: 'Spark',
            value: 'spark'
          };

          let customers = {};

          for (let cust of customersRows) {
            customers[cust.ID] = cust;
            customers[cust.ID]['spark'] = [0];
          }

          db.all(
            "SELECT CID, Datum, Werte FROM Monate ORDER BY Start",
            [],
            function(err, monate) {
              if (err) {
                console.log(err);
                return;
              }

              for (let monat of monate) {
                if (!(monat.Datum in header)) {
                  header[monat.Datum] = {
                    text: monat.Datum,
                    value: monat.Datum
                  };
                }
                if (monat.CID in customers) {
                  customers[monat.CID][monat.Datum] = monat.Werte;
                  customers[monat.CID]['spark'].push(monat.Werte);
                }
              }

              console.log(customers);

              win.webContents.send("newData", {
                header: Object.values(header),
                content: Object.values(customers)
              });

            });
        }
      );

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
                var o = [];
                for (var k in spalten) {
                  o[spalten[k]] = i[k];
                }
                liste.push(o);
              }

              var gruppen = {};

              for (let obj of liste) {
                if (obj["CUSTOM1"] in gruppen) {
                  gruppen[obj["CUSTOM1"]].total += parseInt(obj["TOTAL_AMOUNT"]);
                  if (gruppen[obj["CUSTOM1"]].start > dateDE(obj["USAGE_RECORD_START_TIMESTAMP"])) {
                    gruppen[obj["CUSTOM1"]].start = dateDE(obj["USAGE_RECORD_START_TIMESTAMP"]);
                    gruppen[obj["CUSTOM1"]].display = dateName(gruppen[obj["CUSTOM1"]].start);
                  }
                  if (gruppen[obj["CUSTOM1"]].ende < dateDE(obj["USAGE_RECORD_END_TIMESTAMP"])) {
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

              let ObjectCount = Object.keys(gruppen).length;
              let WorkedObjects = 0;
              let FailedObjects = 0;


              let db = new sqlite3.Database('./Database/sim_db.sqlite');
              db.serialize(function() {
                for (var name in gruppen) {

                  db.get(
                    "SELECT (SELECT ID FROM Customs WHERE Name = ?) as ID",
                    [name],
                    function(cname, err, row) {
                      if (err) {
                        console.log(err);
                        FailedObjects += 1;
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
                            FailedObjects += 1;
                            return;
                          }

                          if (CID === null) {
                            CID = this.lastID;
                          }


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
                                FailedObjects += 1;
                                return;
                              }

                              WorkedObjects += 1;

                              if ((FailedObjects + WorkedObjects) == ObjectCount) {
                                win.webContents.send("openFile", {});
                              }
                            }
                          );
                        });
                    }.bind(null, name)
                  );
                }
              });
            });
        });
      }
    }
  });
}
app.on('ready', createWindow);
