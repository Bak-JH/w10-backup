import { Route, Routes, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Setting from '../pages/Setting';
import Progress from '../pages/Progress';
import Complete from '../pages/Complete';

const AppRoute = () => {
    return (
        <Routes>
            <Route path='/' element={
                <Navigate to='/home'/>
            }/>
            <Route path='/home' element={<Home/>}/>
            <Route path='/progress' element={<Progress/>}/>
            <Route path='/complete/:totalElapsedTime/:error' element={<Complete/>}/>
            <Route path='/setting' element={<Setting/>}/>
            
            
        </Routes>
        );
}

export default AppRoute;