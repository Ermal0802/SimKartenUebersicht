const fs = require('fs');
const csv_parse = require('csv-parse');
const sqlite3 = require('sqlite3').verbose();

//exports = public
exports.aReadFile = async function(dateName) {
  let P = new Promise(function(resolve, reject) {

    fs.readFile(dateName, function(err, buf) {
      if (err) {
        reject(err);
        return;
      }
      resolve(buf.toString());
    });

  });

  return P;
};

exports.aCsvParse = async function(daten, optionen) {
  let P = new Promise(function(resolve, reject) {
    let parser = csv_parse(optionen);
    parser.on('error', function(err) {
      reject(err);
    });
    parser.on('readable', function() {

      let output = [];
      let spalten = null;
      let zeile;
      while (zeile = this.read()) {
        if (!spalten) {
          spalten = zeile;
        } else {
          output.push(zeile);
        }
      }
      resolve([spalten, output]);

    });
    parser.write(daten);
  });

  return P;
};

exports.aDb = function(conStr) {
  let db = new sqlite3.Database(conStr);

  this.aRun = async function(query, params) {
    let P = new Promise(function(resolve, reject) {
      db.serialize(function() {
        db.run(query, params, function(err) {
          if (err)
            reject(err);
          else
            resolve([this]);
        });
      });
    });
    return P;
  };

  this.aGet = async function(query, params) {
    let P = new Promise(function(resolve, reject) {
      db.serialize(function() {
        db.get(query, params, function(err, row) {
          if (err)
            reject(err);
          else
            resolve([row, this]);
        });
      });
    });
    return P;
  };

  this.aAll = async function(query, params) {
    let P = new Promise(function(resolve, reject) {
      db.serialize(function() {
        db.all(query, params, function(err, rows) {
          if (err)
            reject(err);
          else
            resolve([rows, this]);
        });
      });
    });
    return P;
  };
};









//
