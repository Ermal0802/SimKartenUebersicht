// Webseite

const electron = require('electron');
const {
  remote,
  ipcRenderer
} = electron;

var App = new Vue({
  el: "#app",
  vuetify: new Vuetify({
    theme: {
      dark: true
    }
  }),
  data: {
    header: [{
      text: "Custom",
      value: "custom"
    }, {
      text: "IP",
      value: "ip"
    }, {
      text: "Tel",
      value: "isdn"
    }, {
      text: "Total",
      value: "total"
    }],
    zeilen: []
  },
  methods: {
    openFile: function() {
      ipcRenderer.send('openFile', {});
    }
  },
  created: function() {

    ipcRenderer.on('openFile', function(event, args) {
      this.zeilen = args.content;
    }.bind(this));

  }
});

/*
function btn2_click() {
  ipcRenderer.send('dbTest', {});
}

function btn_Click() {

  ipcRenderer.send('openFile', {});
}
document.getElementById('btn').addEventListener('click', btn_Click);
document.getElementById('btn2').addEventListener('click', btn2_click);*/
