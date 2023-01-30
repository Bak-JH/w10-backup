import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { WorkerCH, ProductCH } from './commandChannels';
let _id = 0

interface EventListener{
    channel:string;
    id:string;
}
interface EventListenerArr{
    [key:string] : (...args : any[]) => void
}
let eventListnerArr : EventListenerArr = {}

function eventADD(channel : string,listner:(...args : any[]) => void) : EventListener{

    _id++
    eventListnerArr[_id.toString()] = listner
    ipcRenderer.on(channel,eventListnerArr[_id.toString()])

    // console.log("IPC EVENT ADD",channel,ipcRenderer.listenerCount(channel),Object.keys(eventListnerArr).length)

    return {channel:channel,id:_id.toString()}
}
function eventRemove(listener:EventListener){
    ipcRenderer.removeListener(listener.channel,eventListnerArr[listener.id])

    delete eventListnerArr[listener.id]

    // console.log("IPC EVENT REMOVE",listener.channel,"Listener Count : ",ipcRenderer.listenerCount(listener.channel),"Total Key Length : ",Object.keys(eventListnerArr).length)
}

interface electronApiInterface {
    washStartRM: () => void;
    washCommandRM: (cmd :string) => void;

    shutdownRM: () => void;
    factoryRestRM:()=>void;

    onShutDownEventMR: (callback:(event:IpcRendererEvent) => void) => EventListener;
    onProgressMR: (callback:(event:IpcRendererEvent,progress: number) => void) => EventListener;
    onSetTotalTimeMR: (callback:(event:IpcRendererEvent,value:number)=>void) => EventListener;
}

const exposedApi: electronApiInterface = {
    washStartRM: () => ipcRenderer.send(WorkerCH.startRM),
    washCommandRM: (cmd :string) => ipcRenderer.send(WorkerCH.commandRM,cmd),
    shutdownRM: () => ipcRenderer.send(WorkerCH.shutdownRM),
    factoryRestRM:() => ipcRenderer.send(WorkerCH.factoryResetRM),

    onShutDownEventMR: (callback:(event:IpcRendererEvent) => void) => {return eventADD(ProductCH.onShutDownEventMR,callback)},
    onProgressMR: (callback:(event:IpcRendererEvent,progress: number) => void) => {return eventADD(WorkerCH.onProgressMR,callback)},
    onSetTotalTimeMR: (callback:(event:IpcRendererEvent,value:number)=>void) =>{return eventADD(WorkerCH.onSetTotalTimeMR,callback)},
}
contextBridge.exposeInMainWorld('electronAPI', exposedApi)

export type {electronApiInterface}