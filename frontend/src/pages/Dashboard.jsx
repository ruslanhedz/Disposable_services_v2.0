import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Guacamole from 'guacamole-common-js'
import './Dashboard.css';
import Chrome_logo from '../../public/Chrome.svg';
import Windows_logo from '../../public/Windows_wordmark.svg';
import Ubuntu_logo from '../../public/Ubuntu.svg';


function Dashboard() {
    const sessionTypes = {
        'browser': 'Chrome',
        'windows': 'Windows',
        'ubuntu': 'Ubuntu',
    };
    const [activeSessions, setActiveSessions] = useState([])
    const [selectedSession, setSelectedSession] = useState(null);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [sessionUrl, setSessionUrl] = useState(null);
    const [loading, setLoading] = useState(null);
    const navigate = useNavigate();
    const guacContainerRef = useRef(null);
    const guacClientRef = useRef(null);
    const [expiredSessionIds, setExpiredSessionIds] = useState(new Set());
    const wsRef = useRef(null);
    const fetchingRef = useRef(false);
    const currentIdRef = useRef(null);
    useEffect(() => { currentIdRef.current = currentSessionId; }, [currentSessionId]);


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
        return cookieValue;
    }

    const fetchSessions = useCallback(async () => {
        try {
            const response = await fetch('/api/all_sessions/', {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
            });
            if (response.ok) {
                const data = await response.json();
                setActiveSessions(data);
            } else {
                console.error("Failed to fetch sessions");
            }
        } catch (error) {
            console.error("Error fetching sessions", error);
        }
    }, []);

    useEffect(() => {
        fetchSessions()
    }, [fetchSessions]);

    const refreshSessions = useCallback(() => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        fetchSessions().finally(() => {fetchingRef.current = false; });
    }, [fetchSessions]);

    const handleCreateSession = async (backendType) => {
        const sessionName = sessionTypes[backendType] || backendType;

        setSelectedSession(sessionName);
        setLoading("Starting " + sessionName + " session");
        setSessionUrl(null);

        try {
            const responce = await fetch(`/api/new_session/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
                body: JSON.stringify({ type: backendType })
            });

            if (responce.ok) {
                const data = await responce.json();
                setCurrentSessionId(data.id);
                setSessionUrl('wss://api.disposable-services.online/guacamole' + data.ws_url);
                //setSessionUrl(data.ws_url);
                setTimeout(() => { refreshSessions(); }, 0);
            } else {
                const errorText = await responce.text();
                // Updated alert to be more specific
                alert(`Failed to create ${sessionName} session: ${errorText}`);
            }
        } catch (error) {
            console.error(`Error creating ${sessionName} session:`, error);
            alert(`Failed to create ${sessionName} session`);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSession = async (sessionId) => {
        const sessiontype = activeSessions.find(s => s.id === sessionId)?.session_type ?? null;
        setLoading("Opening " + sessiontype + " session");
        setSessionUrl(null);
        try {
            const response = await fetch(`/api/open_session/${sessionId}/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentSessionId(sessionId);
                setSessionUrl('wss://api.disposable-services.online/guacamole' + data.ws_url);
                //setSessionUrl(data.ws_url);
            } else {
                const err = await response.text();
                alert(`Failed to open session: ${err}`);
            }
        } catch (e) {
            console.error("Error opening session:", e);
            alert("Failed to open session");
        } finally {
            setLoading(null);
        }
    };

    const handleDeleteSession = async (sessionId) => {
        try {
            if (currentIdRef.current && sessionId === currentIdRef.current) {
                try { guacClientRef.current?.disconnect(); } catch {}
                setSessionUrl(null);
                setCurrentSessionId(null);
                const sessiontype = activeSessions.find(s => s.id === sessionId)?.session_type ?? null;
                setLoading("deleting " + sessiontype + " session");
            }

            const response = await fetch(`/api/delete_session/${sessionId}/`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie("csrftoken"),
                },
            });

            if (response.ok) {
                setLoading(null);
                setTimeout(() => { refreshSessions(); }, 0);
            } else {
                const err = await response.text();
                alert(`Failed to delete session: ${err}`);
            }
        } catch (e) {
            console.error(`Error deleting session: ${e}`);
            alert('Failed to delete session');
        } finally {
            setLoading(null);
        }
    }

    useEffect(() => {
        console.log("useEffect triggered, sessionUrl =", sessionUrl);
        if (!sessionUrl) return;

        // Ensure previous client is fully torn down
        try { guacClientRef.current?.disconnect(); } catch {}

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
        mouse.onmousemove = (mouseState) => {
            if (navigator.userAgent.indexOf('Firefox') === -1) {
                mouseState.x;
                mouseState.y;
            }
            client.sendMouseState(mouseState);
        }

        mouse.onmousedown = (mouseState) => {
            client.sendMouseState(mouseState);
        };

        mouse.onmouseup = (mouseState) => {
            client.sendMouseState(mouseState);
        };

        mouse.onmousewheel = (mouseState) => {
            client.sendMouseState(mouseState);
        };

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

    useEffect(() => {
        const handler = () => {
            try { guacClientRef.current?.disconnect(); } catch {}
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    useEffect(() => {
        const wsProto = window.location.protocol === "https:" ? "wss" : "ws";
        const ws = new WebSocket(`${wsProto}://${window.location.host}/ws/notifications/`);
        wsRef.current = ws;

        ws.onopen = () => console.log("notif WS open");
        ws.onmessage = (evt) => {
            let msg; try { msg = JSON.parse(evt.data); } catch { return; }
            if (msg.type !== "session_expired" && msg.type !== "session.expired") return;
            const expiredId = msg.session_id;
            setExpiredSessionIds(prev => new Set(prev).add(expiredId));
            console.log(expiredSessionIds)
            if (currentIdRef.current && expiredId === currentIdRef.current) {
                try { guacClientRef.current?.disconnect(); } catch {}
                setSessionUrl(null);
                setCurrentSessionId(null);
            }
        };
        ws.onerror = (e) => console.warn("notif WS error", e);
        ws.onclose = () => { if (wsRef.current === ws) wsRef.current = null; };
        return () => { try { ws.close(); } catch {} };
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch(`/api/logout/`, {
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
                            <button onClick={() => handleCreateSession('browser')}><img src={Chrome_logo} alt="Chrome_logo" className="Chrome-logo" /></button>
                            {/*<button onClick={() => setSelectedSession('Firefox')}><img src={Firefox_logo} alt="Firefox_logo" className="Firefox-logo" /></button>*/}
                            <button onClick={() => handleCreateSession('windows')}><img src={Windows_logo} alt="Windows_logo" className="Windows-logo" /></button>
                            <button onClick={() => handleCreateSession('ubuntu')}><img src={Ubuntu_logo} alt="Ubuntu_logo" className="Ubuntu-logo" /></button>
                            {/*<button onClick={() => setSelectedSession('Fedora')}><img src={Fedora_logo} alt="Fedora_logo" className="Fedora-logo" /></button>*/}
                        </div>
                    </div>


                    <div className="dashboard-card">
                        <h2>Manage Sessions</h2>
                        <ul className="session-list">
                            {activeSessions.length > 0 ? (
                                activeSessions.map(session => (
                                    <li key={session.id}>
                                        <strong>{sessionTypes[session.session_type] || session.session_type}</strong>
                                        <span>Expires: {new Date(session.dispose_time).toLocaleTimeString()}</span>
                                        {expiredSessionIds.has(session.id) && (
                                            <span style={{ color: "crimson", marginLeft: 8 }}>Session is expired</span>
                                        )}
                                        <button className="session-open-btn" /*style={{ marginTop: 8 }}*/ onClick={() => handleOpenSession(session.id)} disabled={expiredSessionIds.has(session.id)}>
                                            Open
                                        </button>
                                        <button className="session-delete-btn" onClick={() => handleDeleteSession(session.id)} disabled={expiredSessionIds.has(session.id)}>
                                            Delete
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li>No active sessions yet...</li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="dashboard-card session-window">
                    <h2 style={{ zIndex: 1, position: "relative" }}>Session Preview</h2>
                    <div className="preview-container">
                        {typeof loading === "string" && loading.trim() ? (
                            <div className="preview-box">{loading}</div>
                        ) : sessionUrl ? (
                            <div id="guac-display" ref={guacContainerRef} style={{
                                width: "1280px",
                                height: "800px",
                                background: "#000",
                                position: "relative",
                                zIndex: 10
                            }} />
                        ) : expiredSessionIds.size > 0 ? (
                            <div className="preview-box">Session is expired</div>
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