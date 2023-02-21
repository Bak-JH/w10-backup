import {app, BrowserWindow, ipcMain, IpcMainEvent, Menu, screen, session} from 'electron';

import path from 'path';
import url from 'url';
import isDev from 'electron-is-dev';

import { Process } from './mainProcess';
import { WorkerCH } from './ipc/cmdChannels';

function createWindow() {

    // create pi window
    const mainWin = new BrowserWindow({
        width:479,
        height:320,
        backgroundColor: "#EEF5F9",
        titleBarStyle: process.platform === "win32" ? "default":"hidden",
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          sandbox: false,
        },
    });
    
    // set menu item disable
    const template : Array<(Electron.MenuItem)> = []; 
    const menu = Menu.buildFromTemplate(template); 
    Menu.setApplicationMenu(menu);
    
    /*
    * ELECTRON_START_URL을 직접 제공할경우 해당 URL을 로드합니다.
    * 만일 URL을 따로 지정하지 않을경우 (프로덕션빌드) React 앱이
    * 빌드되는 build 폴더의 index.html 파일을 로드합니다.
    * */
    const mainUrl = 
        isDev ? "http://localhost:3000" : 
        process.env.ELECTRON_START_URL || url.format({
        pathname: path.join(__dirname, '/../index.html'),
        protocol: 'file:',
        slashes: true
    }); 
    /*
    * startUrl에 배정되는 url을 맨 위에서 생성한 BrowserWindow에서 실행시킵니다.
    * */

    mainWin.loadURL(mainUrl);
    
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit()
      });

    if (!app.isPackaged) {
        mainWin.webContents.openDevTools();

        require('electron-reload')(__dirname, {
            electron: path.join(__dirname,
                '..',
                '..',
                'node_modules',
                '.bin',
                'electron' + (process.platform === "win32" ? ".cmd" : "")),
            forceHardReset: true,
            hardResetMethod: 'exit',
        });
    }
    
    const mainProcess = new Process(mainWin);

    ipcMain.on(WorkerCH.startRM, (event:IpcMainEvent, quick?:boolean) => {
        mainProcess.run(quick);
    })
}

app.whenReady().then(() => {
    createWindow()
})
