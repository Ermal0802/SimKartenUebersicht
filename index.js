// Webseite

const electron = require('electron');
const {
  remote,
  ipcRenderer
} = electron;

/*function callAgent(args) {
    return new Promise(resolve => {
        ipcRenderer.send('asynchronous-message', args)
    });
}

ipcRenderer.on('asynchronous-reply', (event, result) => {
    if(result.action == 'fileContent') {
      document.getElementById('testText').innerText = result.content;
    }
})*/
ipcRenderer.on('openFile', function(event, args) {
  /*  console.log(args.content);

    document.getElementById("txa").innerHTML = JSON.stringify(args.content,null,"    ");

    //Datei wird auf App übertragen
    var eing = args.content;
    var lines = eing.split("\n");

    for (var i = 0; i < lines.length; i++) {
      if (lines[i].length <= 0) {
        continue;
      }

      var cells = lines[i].split(";");
      var tr = document.createElement("tr");

      for (var y = 0; y < cells.length; y++) {
        /*if (cells[y].replace('\r','').replace('\n','').length <= 0) {
          continue;
        }

        var td = document.createElement("td");
        td.innerText = cells[y];

        tr.appendChild(td);

      }
      */

  var tab = document.getElementById("testText");
  tab.innerHTML = "";
  for (var z of args.content) {
    var tr = document.createElement("tr");
    var td1 = document.createElement("td");
    td1.innerText = z.custom;
    tr.appendChild(td1);
    var td2 = document.createElement("td");
    td2.innerText = z.ip;
    tr.appendChild(td2);
    var td3 = document.createElement("td");
    td3.innerText = z.isdn;
    tr.appendChild(td3);
    var td4 = document.createElement("td");
    td4.innerText = z.total;
    tr.appendChild(td4);
    tab.appendChild(tr);
  }


  //console.log(tr);
  //document.getElementById('testText').appendChild(tr);


  /*
  var text = eing.split(";");
  var list = document.createElement("tr");

  //schrittweise auflisten.
  for (var i = 0; i < text.length; i++) {
    var itm = document.createElement("th");
    itm.innerText = text[i];
    list.appendChild(itm);
  }
  //document.getElementById('testText').innerText = text;
  console.log(list);
*/
});

function btn2_click() {
  ipcRenderer.send('dbTest', {});
}

function btn_Click() {
  //console.log("test1");
  //callAgent({action:'openFile'});

  ipcRenderer.send('openFile', {});
}

document.getElementById('btn').addEventListener('click', btn_Click);
document.getElementById('btn2').addEventListener('click', btn2_click);
