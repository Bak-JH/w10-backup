import { useEffect, useState } from 'react'
import Button from '../components/Button';
import ImageButton from '../components/ImageButton';
import settingImg from '../assets/play.png';
import styled from 'styled-components'

import { useNavigate } from 'react-router-dom';
import SetValue from '../components/SetValue';
import { electron } from 'process';

function Setting(){

    const navigate = useNavigate()

    const [version, setVersion] = useState<string>("")
    const [serial, setSerial] = useState<string>("")
    const [wifi, setWifi] = useState<string>("")
    const [ip, setIp] = useState<string[]>([])
    const [modalVisible,setModalVisible] = useState<boolean>(false)
    const [totalTime, setTotalTime] = useState<number>(100);
    const [motorSpeed, setMotorSpeed] = useState<number>(1);
    
    return (
    <HomeArea>
        <PageContainer style={{'rowGap': '30px', 'width': 255}}>
            <SetValue
                        title='Wash Time'
                        display='time'
                        value={totalTime}
                        minValue={80}
                        maxValue={120}
                        sumValue={10}
                        onValueChange={(v : number) => {
                            setTotalTime(v)
                        }}
                        />
            <SetValue
                        title='Motor Speed'
                        display='number'
                        value={motorSpeed}
                        minValue={0}
                        maxValue={10}
                        sumValue={1}
                        onValueChange={(v : number) => {
                            setMotorSpeed(v)
                        }}
                        />
        </PageContainer>
        <PageContainer>
            <ImageButton type="startBtn" src={settingImg} color="blue" onClick={() => {window.electronAPI.washStartRM();}}>Start</ImageButton>
            <Button type="cancelBtn" color="gray" onClick={() => {navigate('/home')}}>Cancel</Button>        
        </PageContainer>
    </HomeArea>);
}
const HomeArea = styled.div`
    display: flex;
    width: 480px;
    height: 320px;

    justify-content: center;
    align-items: center;
    column-gap: 15px;
`
const PageContainer = styled.div`
    display:grid;
    grid-template-rows: auto;
    row-gap: 10px;
    justify-content: center;
    align-items: center;
`
const InfoArea = styled.div`
    display: grid;
    grid-template-columns: 1fr 3fr;
    grid-template-rows: 1fr 1fr 1fr auto;
    justify-items: right;
    row-gap: 5px;
    column-gap: 5px;
    margin-top: 10px;
`
const TitleText = styled.div`
    font-size: 23px;
    color: #474747;
    background-color: #00000000;
`
const ValueText = styled.div`
    font-size: 23px;
    color: #474747;
    font-weight: bold;
`
export default Setting;

