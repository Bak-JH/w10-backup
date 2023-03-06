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

    return (
    <HomeArea>
        <HomeContainer>
            <ImageButton type="washBtn" src={waterImg} onClick={() => {navigate('/setting')}}>Wash</ImageButton>

            <ImageButton type="quickBtn" src={quickImg} color="gray" 
                         onClick={() => { window.electronAPI.washStartRM(true); navigate('/progress'); }}>
            Quick<br />Wash
            </ImageButton>
        </HomeContainer>
    </HomeArea>);
}
const HomeArea = styled.div`
    width           : 480px;
    height          : 320px;
    display         : flex;
    justify-content : center;
    align-items     : center;
`
const HomeContainer = styled.div`
    display               : grid;
    grid-template-columns : 3fr 2fr;
    grid-template-rows    : auto auto;
    justify-items         : center;
    align-items           : center;
    column-gap: 15px;
    
    > button:nth-child(1) {
        grid-row-start : 1;
        grid-row-end   : 3;
    }
    > button:nth-child(2) {
        align-self : flex-start;
    }
    > button:nth-child(3) {
        align-self : flex-end;
    }
`

export default Home;

