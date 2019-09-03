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
    header: [],
    zeilen: []
  },
  methods: {
    openFile: function() {
      ipcRenderer.send('openFile', {});
    },
    Reload: function() {
      ipcRenderer.send("Reload", {});
    }
  },
  created: function() {


    ipcRenderer.on('newData', function(event, args) {
      console.log(args);
      this.header = args.header;
      this.zeilen = args.content;
    }.bind(this));

    ipcRenderer.on('openFile', function(event, args) {
      ipcRenderer.send("Reload", {});
    }.bind(this));

  }
});
