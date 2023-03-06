import React from 'react'
import './Footer.scss';

interface FooterProp{
    children : React.ReactNode
}

function Footer({children} : FooterProp){
    return (
        <footer>
            {children}
        </footer>
    );
}

export default Footer;

