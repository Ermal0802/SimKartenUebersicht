// Webseite

const electron = require('electron');
const {
  remote,
  ipcRenderer
} = electron;

new Vue({
  el: "#app",
  vuetify: new Vuetify({
    theme: {
      dark: true
    }
  })
});

ipcRenderer.on('openFile', function(event, args) {


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

});

function btn2_click() {
  ipcRenderer.send('dbTest', {});
}

function btn_Click() {

  ipcRenderer.send('openFile', {});
}
document.getElementById('btn').addEventListener('click', btn_Click);
document.getElementById('btn2').addEventListener('click', btn2_click);
