import {useState, useEffect} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

import { BASE_URL } from '../api'

function Login() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username_or_email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(`${BASE_URL}/auth/status/`, {
                    credentials: "include",
                });

                const data = await res.json();

                if (data.authenticated) {
                    navigate("/dashboard");
                }
            } catch (err) {
                console.error(err);
                navigate("/login");
            }
        };

        checkAuth();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${BASE_URL}/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({
                    username_or_email: form.username_or_email,
                    password: form.password,
                }),
                credentials: "include"
            });

            if (response.status === 200) {
                setSuccess("Login successful!")
                setTimeout(() => navigate("/dashboard"), 1500);
            } else {
                const data = await response.json();
                setError(data.error || "Invalid Credentials");
            }
        } catch (error) {
            setError("Something went wrong");
        }
    };

    return (
        <div className="auth-container">
            <h1>Log In</h1>
            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
                <input name="username_or_email" type="text" placeholder="username_or_email" onChange={handleChange} />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} />
                {error && <span className="error">{error}</span>}
                <button type="submit">Log In</button>
            </form>
            <p className="switch-auth">
                Don’t have an account? <Link to="/signup">Sign Up</Link>
            </p>
        </div>
    );
}

export default Login;
