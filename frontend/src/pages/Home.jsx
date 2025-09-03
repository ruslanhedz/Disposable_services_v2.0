import { useNavigate } from 'react-router-dom';
import './Home.css';
import cloudIcon from '../../public/cloud.svg';

function Home() {
    const navigate = useNavigate();

    return (
        <div className="main-container">
            <img src={cloudIcon} alt="Cloud Logo" className="cloud-icon" />
            <h1 className="main-title">Cloud Disposable Services</h1>
            <div className="button-group">
                <button className="btn login-btn" onClick={() => navigate('/login')}>Log In</button>
                <button className="btn signup-btn" onClick={() => navigate('/signup')}>Sign Up</button>
            </div>
        </div>
    );
}

export default Home;
