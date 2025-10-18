import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Chrome_logo from '../../public/Chrome.svg';
import Firefox_logo from '../../public/Firefox.svg';
import Windows_logo from '../../public/Windows_11.svg';
import Ubuntu_logo from '../../public/Ubuntu.svg';
import Fedora_logo from '../../public/Fedora.svg';

import { BASE_URL } from '../api'


function Dashboard() {
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionUrl, setSessionUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        console.log(cookieValue);
        return cookieValue;
    }

    const handleCreateChromeSession = async () => {
        setSelectedSession("Chrome");
        setLoading(true);
        setSessionUrl(null);

        try {
            const responce = await fetch(`${BASE_URL}/new_session/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
            });

            if (responce.ok) {
                const session_url = await responce.json();
                console.log(session_url);
                setSessionUrl(session_url);
            } else {
                const errorText = await responce.text();
                alert(`Failed to create session: ${errorText}`);
            }
        } catch (error) {
            console.error("Error creating Chrome session:", error);
            alert("Failed to create Chrome session");
        } finally {
            setLoading(false);
        }
    };


    const handleLogout = async () => {
        try {
            const response = await fetch(`${BASE_URL}/logout/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"), // must not be null
                },
            });

            if (response.ok) {
                navigate("/");
            } else {
                alert("Logout failed");
            }
        } catch (error) {
            alert("Logout failed");
            console.error(error);
        }
    };


    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Welcome to Cloud Disposable Services</h1>


            <div className="dashboard-grid">

                <div className="left-column">
                    <div className="dashboard-card">
                        <h2>Create New Session</h2>
                        <div className="session-buttons">
                            <button onClick={handleCreateChromeSession}><img src={Chrome_logo} alt="Chrome_logo" className="Chrome-logo" /></button>
                            <button onClick={() => setSelectedSession('Firefox')}><img src={Firefox_logo} alt="Firefox_logo" className="Firefox-logo" /></button>
                            <button onClick={() => setSelectedSession('Windows 11')}><img src={Windows_logo} alt="Windows_logo" className="Windows-logo" /></button>
                            <button onClick={() => setSelectedSession('Ubuntu')}><img src={Ubuntu_logo} alt="Ubuntu_logo" className="Ubuntu-logo" /></button>
                            <button onClick={() => setSelectedSession('Fedora')}><img src={Fedora_logo} alt="Fedora_logo" className="Fedora-logo" /></button>
                        </div>
                    </div>


                    <div className="dashboard-card">
                        <h2>Manage Sessions</h2>
                        <ul className="session-list">
                            <li>No active sessions yet...</li>
                        </ul>
                    </div>
                </div>


                <div className="dashboard-card session-window">
                    <h2>Session Preview</h2>
                    {loading ? (
                        <div className="preview-box">Starting Chrome session...</div>
                    ) : sessionUrl ? (
                        <iframe
                            src={sessionUrl}
                            title="Chrome Session"
                            className="preview-iframe"
                        ></iframe>
                    ) : selectedSession ? (
                        <div className="preview-box">You selected: {selectedSession}</div>
                    ) : (
                        <div className="preview-box empty">No session selected</div>
                    )}
                </div>
            </div>


            <div className="logout-footer">
                <button className="logout-button" onClick={handleLogout}>
                    Log Out
                </button>
            </div>
        </div>
    );
}

export default Dashboard;