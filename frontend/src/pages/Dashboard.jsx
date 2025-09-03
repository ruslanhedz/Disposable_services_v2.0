import { useState } from 'react';
import './Dashboard.css';
import Chrome_logo from '../../public/Chrome.svg';
import Firefox_logo from '../../public/Firefox.svg';
import Windows_logo from '../../public/Windows_11.svg';
import Ubuntu_logo from '../../public/Ubuntu.svg';
import Fedora_logo from '../../public/Fedora.svg';


function Dashboard() {
    const [selectedSession, setSelectedSession] = useState(null);

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Welcome to Cloud Disposable Services</h1>

            <div className="dashboard-grid">
                {/* Left column with Create and Manage Sessions */}
                <div className="left-column">
                    <div className="dashboard-card">
                        <h2>Create New Session</h2>
                        <div className="session-buttons">
                            <button onClick={() => setSelectedSession('Chrome')}><img src={Chrome_logo} alt="Chrome_logo" className="Chrome-logo" /></button>
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

                {/* Right column with wider Session Preview */}
                <div className="dashboard-card session-window">
                    <h2>Session Preview</h2>
                    {selectedSession ? (
                        <div className="preview-box">You selected: {selectedSession}</div>
                    ) : (
                        <div className="preview-box empty">No session selected</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
