import React, { useEffect, useState } from 'react'
import Button from '../components/Button';

import classNames from 'classnames';

import checkImg from '../assets/check.png'
import errorImg from '../assets/error.png'

import styled from 'styled-components'

import Footer from '../layout/Footer';
import MainArea from '../layout/MainArea';
import Header from '../layout/Header';
import { useNavigate, useParams } from 'react-router-dom';
import { IpcRendererEvent } from 'electron';
import SlideText from '../components/SlideText';
import Modal from '../components/Modal';
import { ModalNotice } from '../layout/ModalInfo';

function Complete(){
    let navigate = useNavigate()

    const [isError, setIsError] = useState<boolean>(false);
    const [errorModalVisible, seterrorModalVisible] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    return (
    <div>
        <FinishArea>
                <FinishImg src={isError ? errorImg : checkImg} width={60}/>
                <FinishText>{ isError ? "Wash Error!" : "Wash Compeleted!"}</FinishText>
        </FinishArea>
        <Footer>
                <Button color='gray' type='small' onClick={() => {
                    window.electronAPI.washStartRM();
                    navigate('/progress')
                }}> Wash again </Button>

                <Button color='blue' type='small' onClick={() => {
                    navigate('/') }}> Close </Button> 
        </Footer>
        <Modal visible={errorModalVisible} onBackClicked={() => {seterrorModalVisible(false)}} selectVisible={false}>
            <ModalNotice text={errorMessage}/>
        </Modal>
    </div>);
}

const FinishArea = styled.div`
    width           : 479px;
    height          : 260px;
    display         : flex;
    align-items     : center;
    justify-content : center;
    flex-direction  : column;
    row-gap         : 20px;
`
const FinishImg = styled.img``
const FinishText = styled.div`
    color     : black;
    font-size : 27px;
`

export default Complete;

