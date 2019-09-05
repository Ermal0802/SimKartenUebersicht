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
const {
  aReadFile,
  aCsvParse,
  aDb
} = require('./asyncs.js');

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

  ipcMain.on('Reload', async function(event, args) {


    let db = new aDb('./Database/sim_db.sqlite');


    let customersRows;
    try {
      [customersRows] = await db.aAll("SELECT ID, Name, IP, Tel FROM Customs", []);
    } catch (e) {
      console.log(e);
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

    let monate;
    try {
      [monate] = await db.aAll("SELECT CID, Datum, Werte FROM Monate ORDER BY Start", []);
    } catch (e) {
      console.log(e);
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



    win.webContents.send("newData", {
      header: Object.values(header),
      content: Object.values(customers)
    });

  });


  //Fenster für Datei Öffnen
  ipcMain.on('openFile', async function(event, args) {

    //Datei erfrgen
    var files = dialog.showOpenDialogSync(win, {
      properties: ['openFile']
    });

    // checken ob datei gewählt wurde
    if (files != undefined) {
      if (files.length > 0) {

        // Datei Lesen
        let buf;
        try {
          buf = await aReadFile(files[0]);
        } catch (e) {
          console.log(e);
          return;
        }

        //CSV Lesen/Interpretieren
        let spalten;
        let output;
        try {
          [spalten, output] = await aCsvParse(buf.toString(), {
            trim: true,
            skip_empty_lines: true,
            delimiter: ";"
          });
        } catch (e) {
          console.log(e);
          return;
        }

        // CSV Daten ordnen (liste zu object) und berechnen
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

        //berechnen
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

        // in DB schreiben
        let db = new aDb('./Database/sim_db.sqlite');

        //für jeden customer
        for (var cname in gruppen) {

          // custommer ID abfragen
          let CID;
          try {
            [{
              CID
            }] = await db.aGet(
              "SELECT (SELECT ID FROM Customs WHERE Name = ?) as CID",
              [cname]);
          } catch (e) {
            console.log(e);
            FailedObjects += 1;
            continue;
          }

          // custommer einfügen oder auch nicht
          let lastID;
          try {
            [{
              lastID
            }] = await db.aRun(
              "INSERT OR IGNORE INTO Customs(Name,Tel,IP) VALUES(?,?,?);",
              [
                cname,
                gruppen[cname]["isdn"],
                gruppen[cname]["ip"]
              ]);
          } catch (e) {
            console.log(e);
            FailedObjects += 1;
            continue;
          }

          //echte customer ID ermitteln
          if (CID === null) {
            CID = lastID;
          }

          //Monat einfügen
          try {
            await db.aRun(
              "INSERT OR IGNORE INTO Monate(CID,Datum,Werte,Start,Ende) VALUES(?,?,?,?,?);",
              [
                CID,
                gruppen[cname]["display"],
                gruppen[cname]["total"],
                gruppen[cname]["start"],
                gruppen[cname]["ende"]
              ]);
          } catch (e) {
            console.log(e);
            FailedObjects += 1;
            continue;
          }

          // ein object ist fertig
          WorkedObjects += 1;

          //Wenn alle Objecte fertig sind reload in webseite auslösen
          if ((FailedObjects + WorkedObjects) == ObjectCount) {
            win.webContents.send("openFile", {});
          }
        }
      }
    }
  });
}

app.on('ready', createWindow);
