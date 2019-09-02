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
      text: "Customer",
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
    }, {
      text: "Datum",
      value: "display"
    } , {
      text: "Start",
      value: "start"
    } , {
      text: "Ende",
      value: "ende"
    }
  ],
    zeilen: []
  },
  methods: {
    openFile: function() {
      ipcRenderer.send('openFile', {});
    },
    dbTest: function() {
      ipcRenderer.send('dbTest', {});
    }
  },
  created: function() {

    ipcRenderer.on('openFile', function(event, args) {
      this.zeilen = args.content;
      //console.log(zeilen);
    }.bind(this));


  }
});
