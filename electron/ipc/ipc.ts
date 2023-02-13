import { ipcMain } from "electron"

import { getUSBPath, readDir } from "./filesystem"

import { factoryReset } from './factoryReset'
function ipcHandle(){
    ipcMain.on("factoryReset",factoryReset)
}

export {ipcHandle}