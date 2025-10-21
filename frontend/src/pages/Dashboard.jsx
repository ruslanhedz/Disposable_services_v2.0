import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Guacamole from 'guacamole-common-js'
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
    const guacContainerRef = useRef(null);
    const guacClientRef = useRef(null);


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
            const responce = await fetch(`/api/new_session/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
            });

            if (responce.ok) {
                const data = await responce.json();
                //console.log(session_url);
                setSessionUrl(data.ws_url);
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

    useEffect(() => {
        console.log("useEffect triggered, sessionUrl =", sessionUrl);
        if (!sessionUrl) return;

        console.log("Creating Guacamole tunnel to:", sessionUrl);

        const tunnel = new Guacamole.WebSocketTunnel(sessionUrl);
        const client = new Guacamole.Client(tunnel);

        const display = client.getDisplay().getElement();
        const container = guacContainerRef.current;

        container.innerHTML = "";
        container.appendChild(display);
        guacClientRef.current = client;


        display.style.width = "100%";
        display.style.height = "100%";
        display.style.outline = "none";
        display.tabIndex = 1;


        const mouse = new Guacamole.Mouse(client.getDisplay().getElement());
        mouse.onEach = (state) => client.sendMouseState(state);

// For scaled / touch input:
        const touch = new Guacamole.Touch(client.getDisplay().getElement());
        touch.onEach = (state) => client.sendTouchState(state);

        const keyboard = new Guacamole.Keyboard(document);
        keyboard.onkeydown = (keysym) => client.sendKeyEvent(1, keysym);
        keyboard.onkeyup = (keysym) => client.sendKeyEvent(0, keysym);

        // display.setAttribute("tabIndex", "-1");
        // display.style.outline = "none"; // Hides the blue focus ring
        // display.focus();

        display.addEventListener("mousedown", () => {
            display.focus();
        });
        setTimeout(() => display.focus(), 500);

        client.getDisplay().scale(1); // Ensure 1:1 mapping of coords

        client.connect("");

        client.onstatechange = (state) => {
            console.log("Guacamole state:", state);
        };

        // client.onstatechange = (state) => {
        //     console.log("Guac state:", state);
        //     if (state === 3) { // CONNECTED
        //         client.sendMessage("select", "Browser"); // safe now
        //     }
        // };

        return () => {
            console.log("Closing Guac client...");
            keyboard.reset();
            client.disconnect();
        };
    }, [sessionUrl]);

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


                {/*<div className="dashboard-card session-window">*/}
                {/*    <h2>Session Preview</h2>*/}
                {/*    {loading ? (*/}
                {/*        <div className="preview-box">Starting Chrome session...</div>*/}
                {/*    ) : sessionUrl ? (*/}
                {/*        <div*/}
                {/*            id="guac-display"*/}
                {/*            ref={guacContainerRef}*/}
                {/*            className="preview-box"*/}
                {/*            style={{ width: "100%", height: "600px", background: "#000" }}*/}
                {/*        ></div>*/}
                {/*    ) : (*/}
                {/*        <div className="preview-box empty">No session selected</div>*/}
                {/*    )}*/}
                {/*</div>*/}

                <div className="dashboard-card session-window">
                    <h2 style={{ zIndex: 1, position: "relative" }}>Session Preview</h2>
                    <div className="preview-container">
                        {loading ? (
                            <div className="preview-box">Starting Chrome session...</div>
                        ) : sessionUrl ? (
                            <div
                                id="guac-display"
                                ref={guacContainerRef}
                                style={{
                                    width: "100%",
                                    height: "600px",
                                    background: "#000",
                                    position: "relative",
                                    zIndex: 10,
                                }}
                            ></div>
                        ) : (
                            <div className="preview-box empty">No session selected</div>
                        )}
                    </div>
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