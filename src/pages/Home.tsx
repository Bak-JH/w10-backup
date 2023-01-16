import React, { useEffect, useState } from 'react'
import ImageButton from '../components/ImageButton';
import fileImg from '../assets/file.png';
import settingImg from '../assets/settings.png';
import infoImg from '../assets/info.png';
import waterImg from '../assets/wash.png'
import quickImg from '../assets/quick-2.png'
import styled from 'styled-components'

import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

function Home(){

    const navigate = useNavigate()

    const [version, setVersion] = useState<string>("")
    const [serial, setSerial] = useState<string>("")
    const [wifi, setWifi] = useState<string>("")
    const [ip, setIp] = useState<string[]>([])
    const [modalVisible,setModalVisible] = useState<boolean>(false)
    
    
    useEffect(() => {
        window.electronAPI.getProductInfoTW().then(
            (value : string[]) => { //0:version,1:serial,2:wifi,3:ip,
                setVersion(value[0])
                setSerial(value[1])
                setWifi(value[2])
                if(value.length > 3){   
                    let a : string[] = []
                    for (let i = 3; i < value.length; i++) {
                        a.push(value[i])
                    }
                    setIp(a)
                }
            })
    }, [modalVisible])
    
    return (
    <HomeArea>
        <HomeContainer>
            <ImageButton type="washBtn" src={waterImg} onClick={() => {navigate('/setting')}}>Wash</ImageButton>
            <ImageButton type="quickBtn" src={quickImg} color="gray" onClick={() => {navigate('/progress')}}>Quick<br />Wash</ImageButton>
        </HomeContainer>
    </HomeArea>);
}
const HomeArea = styled.div`
    display: flex;
    width: 480px;
    height: 320px;

    justify-content: center;
    align-items: center;
`
const HomeContainer = styled.div`
    display: grid;
    grid-template-columns: 3fr 2fr;
    grid-template-rows: auto auto;

    justify-items: center;
    align-items: center;

    column-gap: 15px;
    
    > button:nth-child(1){
        grid-row-start: 1;
        grid-row-end: 3;
    }
    > button:nth-child(2){
        align-self: flex-start;

    }
    > button:nth-child(3){
        align-self: flex-end;

    }
`

export default Home;

