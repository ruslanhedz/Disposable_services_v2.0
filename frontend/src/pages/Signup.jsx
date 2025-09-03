import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Signup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        verifyEmail: '',
        password: '',
        verifyPassword: '',
    });

    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validate = () => {
        const newErrors = {};
        if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!form.username.trim()) newErrors.username = 'Username is required';

        if (!form.email.includes('@')) newErrors.email = 'Enter a valid email';
        if (form.email !== form.verifyEmail) newErrors.verifyEmail = 'Emails do not match';

        if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (form.password !== form.verifyPassword) newErrors.verifyPassword = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        console.log(form);

        try {
            const response = await fetch("http://localhost:8000/signup/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username:form.username,
                    first_name: form.firstName,
                    last_name: form.lastName,
                    email: form.email,
                    password: form.password,
                }),
                credentials: "include"
            });

            if (response.status === 201) {
                setSuccess("Account created successfully!")
                setTimeout(() => navigate("/login", 2000))
            } else {
                const data = await response.json();
                setErrors({general: data.error || "Signup failed"  });
            }
        } catch (error) {
            setErrors({general: "Something went wrong, please try again later"});
        }
    };

    return (
        <div className="auth-container">
            <h1>Sign Up</h1>
            {errors.general && <div className="alert error">{errors.general}</div>}
            {success && <div className="alert success">{success}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
                <input name="firstName" placeholder="First Name" onChange={handleChange} />
                {errors.firstName && <span className="error">{errors.firstName}</span>}

                <input name="lastName" placeholder="Last Name" onChange={handleChange} />
                {errors.lastName && <span className="error">{errors.lastName}</span>}

                <input name="username" placeholder="Username" onChange={handleChange} />
                {errors.username && <span className="error">{errors.username}</span>}

                <input name="email" type="email" placeholder="Email" onChange={handleChange} />
                {errors.email && <span className="error">{errors.email}</span>}

                <input name="verifyEmail" type="email" placeholder="Verify Email" onChange={handleChange} />
                {errors.verifyEmail && <span className="error">{errors.verifyEmail}</span>}

                <input name="password" type="password" placeholder="Password" onChange={handleChange} />
                {errors.password && <span className="error">{errors.password}</span>}

                <input name="verifyPassword" type="password" placeholder="Verify Password" onChange={handleChange} />
                {errors.verifyPassword && <span className="error">{errors.verifyPassword}</span>}

                <button type="submit">Sign Up</button>
            </form>
            <p className="switch-auth">
                Already have an account? <Link to="/login">Log In</Link>
            </p>
        </div>
    );
}

export default Signup;
