import React from 'react'
import ReactModal from 'react-modal'
import styled from 'styled-components'
import Footer from '../layout/Footer'
import Button from './Button'

const customStyles = {
  content: {
    top          : '50%',
    left         : '50%',
    transform    : 'translate(-50%, -50%)',
    width        : "420px",
    height       : "280px",
    outline      : 'none',
    padding      : "0px",
    borderRadius : '8px',
  },

  overlay: {
    background   : "#00000050",
    padding      : "0px"
  }
};

interface ModalProps{
    className?       : string,
    visible          : boolean,
    children?        : React.ReactNode,
    backVisible?     : boolean,
    selectVisible?   : boolean,
    backString?      : string,
    selectString?    : string,
    btnEnable?       : boolean,

    onBackClicked?   : () => void,
    onSelectClicked? : () => void,
}
function Modal({ className, visible, children, backVisible, backString, onBackClicked, selectVisible, selectString, onSelectClicked, btnEnable } : ModalProps) {
  return (
    <ReactModal isOpen={visible} style={customStyles} ariaHideApp={false}>
      <ModalMainArea height={backVisible || selectVisible ? 220 : 280}>
        {children}
      </ModalMainArea>
        <Footer>
          <Button color='gray' type='modal' enable={btnEnable} onClick={() => {onBackClicked && onBackClicked()}} visible={backVisible}>{backString}</Button>
          <Button color='blue' type='modal' enable={btnEnable} onClick={() => {onSelectClicked && onSelectClicked()}} visible={selectVisible}>{selectString}</Button>
        </Footer>
    </ReactModal>
  )
}

const ModalMainArea = styled.div<{height:number}>`
  width           : 100%;
  height          : ${(props) => (props.height)}px;
  display         : flex;
  justify-content : center;
  align-items     : center;
`
Modal.defaultProps = {
  visible       : true,
  backVisible   : true,
  backString    : "Back",
  selectVisible : true,
  selectString  : "Select",
};

export default Modal;