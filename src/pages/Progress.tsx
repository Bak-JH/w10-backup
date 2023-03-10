import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components'
import Button from '../components/Button';
import Footer from '../layout/Footer';
import Modal from '../components/Modal';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import MainArea from '../layout/MainArea';
import Header from '../layout/Header';
import { useNavigate } from 'react-router-dom';
import { IpcRendererEvent } from 'electron';
import { ModalNotice } from '../layout/ModalInfo';
import { Stopwatch } from 'ts-stopwatch'

function Progress(){
    const navigate = useNavigate();

    const [totalTime, setTotalTime] = useState(0)

    const [quitModalVisible,setQuitModalVisible] = useState<boolean>(false)

    const isError = useRef("false")
    const [elaspedTime, setelaspedTime] = useState(0)
    const [isPaused, setIsPaused] = useState<boolean>(false);

    useEffect(()=>{
        window.electronAPI.pageChangedRM();

        let stopWatch = setInterval(() => {
            setelaspedTime((elaspedTime) => elaspedTime + 1000)
        }, 1000);

        const setTotalTimeListener = window.electronAPI.onSetTotalTimeMR((event:IpcRendererEvent,time:number)=>{
            console.log("ui - " + time)
            setTotalTime(time)
        })

        const workingStateListener = window.electronAPI.onWorkingStateChangedMR((event:IpcRendererEvent,state:string,message?:string)=>{
            if (state == "stop")
            {
                clearInterval(stopWatch)
                navigate('/complete/'+isError.current);
            }
            else if (state == "pause")
                clearInterval(stopWatch)
            else if (state == "resume")
                stopWatch = setInterval(() => {
                    setelaspedTime((elaspedTime) => elaspedTime + 1000)
                }, 1000);
        })

        return () => {
            window.electronAPI.removeListener(setTotalTimeListener);
            window.electronAPI.removeListener(workingStateListener);

            clearInterval(stopWatch);
        }
    },[]);


    let timeC = totalTime - elaspedTime;
    let time = timeC < 0 ? new Date(-timeC) : new Date(timeC);
    let progressValue = Math.floor((elaspedTime/totalTime)*100);

    return (
        <div>
            <Header>

            </Header>
            <MainArea>
                <CircularProgressArea>
                    <div style={{gridRow:2, marginTop: '35px'}}>
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
                    </div>
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
                { isPaused ?
                    <Button color='blue' type='small' onClick={() => {
                        window.electronAPI.washCommandRM("resume"); setIsPaused(false);}}> Resume </Button>
                    :
                    <Button color='gray' type='small' onClick={() => {
                        window.electronAPI.washCommandRM("pause"); setIsPaused(true);}}> Pause </Button>
                }
                <Button color='blue' type='small'
                onClick={() => {setQuitModalVisible(true)}}> Quit </Button>
            </Footer>
            <Modal visible={quitModalVisible} selectString="Quit" backString="Resume"
                onBackClicked={() => setQuitModalVisible(false)}
                onSelectClicked={() => { window.electronAPI.washCommandRM("stop"); navigate('/complete/'+isError.current); }}>
                    <ModalNotice text="Are you sure to quit?"/>
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

    /* width: 360px; */
    // height: px;

    margin-top: 50px;
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
