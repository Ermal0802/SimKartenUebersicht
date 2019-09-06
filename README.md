# Sim card view

![](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQD_itQ54sOwKCIMDvuvvNG-dZJWyyaLKFMRx_nTac4k9fXKAdKfQ)

------------


#### What does the program do?

This program generates an overview of several CSV files with monthly consumption data.


------------

#### Build
1. run in powershell
`npm i electron-builder`

1.  put in  **package.json** 
```
"build": {
    "appId": "com.github.ermal0802.sim-karten-uebersicht",
    "productName": "Sim card view",
    "extraFiles": ["Database/sim_db.sqlite"]
  },
```
1. and in **"scripts"** 
```
"dist": "electron-builder ."
```
1. after that run in powershell
`npm run dist`
1. go to the **dist** folder

1. start **Sim card view setup 1.0.0 .exe**
