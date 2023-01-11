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
    display: flex;
    align-items: center;
    justify-content: center;

    flex-direction: column;
    
    width: 479px;
    height: 210px;
`

export default MainArea;

