import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./Auth.css";

import { BASE_URL } from "../api"

function ActivateAccount() {
    const { uid, token } = useParams();
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const activate = async () => {
            try {
                const response = await fetch(
                    `${BASE_URL}/activate/${uid}/${token}/`
                );

                if (response.ok) {
                    setStatus("success");
                    setMessage("Your account has been activated! You can now log in.");
                } else {
                    const data = await response.json();
                    setStatus("error");
                    setMessage(data.detail || "Activation link is invalid or expired.");
                }
            } catch (error) {
                setStatus("error");
                setMessage("Something went wrong. Please try again later.");
            }
        };

        activate();
    }, [uid, token]);

    return (
        <div className="auth-container">
            <h1>Account Activation</h1>
            {status === "loading" && (
                <div className="alert">Activating your account...</div>
            )}
            {status === "success" && (
                <div className="alert success">
                    {message} <br />
                    <Link to="/login">Go to Login</Link>
                </div>
            )}
            {status === "error" && (
                <div className="alert error">
                    {message} <br />
                    <Link to="/signup">Sign Up Again</Link>
                </div>
            )}
        </div>
    );
}

export default ActivateAccount;