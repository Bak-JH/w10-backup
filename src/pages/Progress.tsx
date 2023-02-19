import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import styled from 'styled-components'

import Button from '../components/Button';
import Footer from '../layout/Footer';

import Modal from '../components/Modal';

import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import MainArea from '../layout/MainArea';
import Header from '../layout/Header';
import { useNavigate } from 'react-router-dom';
import { ipcRenderer, IpcRendererEvent } from 'electron';

import { ModalInfoMainArea, ModalInfoTitle, ModalInfoValue, ModalNotice } from '../layout/ModalInfo';

import { Stopwatch } from 'ts-stopwatch'
import SlideText from '../components/SlideText';

function Progress(){

    const navigate = useNavigate()

    const [progressValue, setProgressValue] = useState<number>(45)
    const [filename, setFilename] = useState<string>("")
    const [totalTime, setTotalTime] = useState(0)

    const [quitModalVisible,setQuitModalVisible] = useState<boolean>(false)
    const [quitModalBtnEnable,setQuitModalBtnEnable] = useState<boolean>(true)
    const [quitWork,setQuitWork] = useState<boolean>(false)

    const isError = useRef("false")
    const stopwatchRef = useRef(new Stopwatch)
    const [elaspedTime, setelaspedTime] = useState(0)

    useEffect(()=>{
        const progressListener = window.electronAPI.onProgressMR((event:IpcRendererEvent, progress:number) => {
            setProgressValue(Number((progress*100).toFixed()))
        })
        const setTotalTimeListener = window.electronAPI.onSetTotalTimeMR((event:IpcRendererEvent,time:number)=>{
            console.log(time)
            setTotalTime(time)
        })

        const workingStateListener = window.electronAPI.onWorkingStateChangedMR((event:IpcRendererEvent,state:string,message?:string)=>{
            if (state == "stop")
            {
                stopwatchRef.current.stop();
                navigate('/complete/'+stopwatchRef.current.getTime()+"/"+isError.current);
            }
            else if (state == "pause")
                stopwatchRef.current.stop();
            else if (state == "resume")
                stopwatchRef.current.start();
        })

        stopwatchRef.current.start();
        const id = setInterval(() => {
            setelaspedTime(stopwatchRef.current.getTime())
        }, 100);

        return () => {
            window.electronAPI.removeListener(progressListener);
            window.electronAPI.removeListener(setTotalTimeListener);
            window.electronAPI.removeListener(workingStateListener);
            
            clearInterval(id);
        }
    },[]);
    
    let timeC = totalTime - elaspedTime;
    let time = timeC < 0 ? new Date(-timeC) : new Date(timeC);

    return (
        <div>
            <Header>
                
            </Header>
            <MainArea>
                <CircularProgressArea>
                    <TitleText>
                        Remaining time
                    </TitleText>
                    <ValueText>
                        {
                            timeC < 0 ?
                            totalTime == 0 ? "Calculating" : -time.getMinutes() +"min " + -time.getSeconds() + "sec"
                            : totalTime == 0 ? "Calculating" : time.getMinutes() +"min " + time.getSeconds() + "sec"
                        }
                    </ValueText>

                    <TitleText>
                        Status
                    </TitleText>
                    <ValueText>
                        {filename}
                    </ValueText>


                    <CircleProgress>
                        <CircularProgressbarWithChildren value={progressValue} maxValue={100} minValue={0} strokeWidth={7}
                            styles={buildStyles({
                                strokeLinecap: "round",
                                pathColor: `#00C6EA`,
                                trailColor: '#DCEAF3',
                            })}>
                            <ProgressBarText>
                                Progress
                            </ProgressBarText>
                            <ProgressValue>
                                {`${progressValue}%`}
                            </ProgressValue>
                        </CircularProgressbarWithChildren>
                    </CircleProgress>
                </CircularProgressArea>
            </MainArea>
            <Footer>
                <Button color='gray' type='small' onClick={() => {
                    window.electronAPI.washCommandRM("pause")}}> Pause </Button>
                <Button color='blue' type='small' 
                onClick={() => {setQuitModalVisible(true)}}> Quit </Button> 
            </Footer>
            <Modal visible={quitModalVisible} btnEnable={quitModalBtnEnable} selectString="Quit" backString="Resume"
                onBackClicked={() => setQuitModalVisible(false)}
                onSelectClicked={() => { window.electronAPI.washCommandRM("stop"); navigate('/complete/'+stopwatchRef.current.getTime()+"/"+isError.current); }}
                backVisible={!quitWork} selectVisible={!quitWork}>
                    <ModalNotice text={
                        quitWork ? "wait for movement" : "Are you sure to quit?"
                    }/>
            </Modal>
        </div>
    );
}
const CircularProgressArea = styled.div`
    display: grid;

    align-items: center;
    justify-content: center;
    align-content: center;

    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr;

    /* width: 360px; */
    // height: px;

    margin-top: 25px;
    column-gap: 30px;

`
const ProgressBarText = styled.div`
    color: #474747;
    font-size: 20px;
`
const ProgressValue = styled.div`
    color: #474747;
    font-size: 40px;
    font-weight: bold;
`
const TitleText = styled.div`
    color: #474747;
    font-size: 18px;
    justify-self: start;
    align-self: end;
        
`
const ValueText = styled.div`
    color: #474747;
    font-size: 30px;
    font-weight: bold;
    justify-self: start;
    align-self: start;
    max-width: 210px;
`
const CircleProgress = styled.div`
    grid-column-start: 2;
    grid-column-end: 3;

    grid-row-start: 1;
	grid-row-end: 5;

    align-self: center;
    justify-self: center;

    width: 180px;
    height: 180px;
`


export default Progress;