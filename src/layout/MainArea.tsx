import React from 'react';
import styled from 'styled-components'

interface MainAreaProp{
    children: React.ReactNode
}

function MainArea({children} : MainAreaProp){
    return (
        <MainAreaDIV>
            {children}
        </MainAreaDIV>
    );
}

const MainAreaDIV = styled.div`
    width           : 479px;
    height          : 210px;
    display         : flex;
    align-items     : center;
    justify-content : center;
    flex-direction  : column;
`

export default MainArea;

