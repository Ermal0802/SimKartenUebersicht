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
    loadingDB: false,
    loadingFiles: false,
    search: '',
    header: [],
    zeilen: [],
    selected: []
  },
  methods: {
    openFile: function() {
      this.loadingFiles = true;
      ipcRenderer.send('openFile', {});
    },
    Reload: function() {
      this.loadingDB = true;
      ipcRenderer.send("Reload", {});
    },
    Delete: function() {
      //console.log(this.selected[0].ID);
      //??????????????
      ipcRenderer.send("Delete", {ID:this.selected[0].ID});
    }
  },
  created: function() {
    ipcRenderer.on('Delete', function(event, args) {
      //?????????????
      ipcRenderer.send("Delete", {});
    }.bind(this));

    ipcRenderer.on('newData', function(event, args) {
      this.loadingFiles = false;
      this.loadingDB = false;
      this.header = args.header;
      this.zeilen = args.content;
    }.bind(this));

    ipcRenderer.on('openFile', function(event, args) {
      this.loadingFiles = false;
      ipcRenderer.send("Reload", {});
    }.bind(this));

    this.loadingDB = true;
    ipcRenderer.send("Reload", {});
  }
});
