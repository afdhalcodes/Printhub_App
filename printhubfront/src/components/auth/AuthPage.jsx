
import { useEffect, useState } from 'react'
import SellerDashboard from '../seller/SellerDashboard'
import './AuthPage.css'

const API_BASE_URL = 'http://localhost:8080'

function AuthPage() {
    const [activeTab, setActiveTab] = useState('login')
    const [csrfToken, setCsrfToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [user, setUser] = useState(null)

    const [loginData, setLoginData] = useState({
        identifier: '',
        password: ''
    })

    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'BUYER'
    })

    const fetchCsrfToken = async () => {
        const response = await fetch(`${API_BASE_URL}/api/auth/csrf`, {
            method: 'GET',
            credentials: 'include'
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.message || 'Unable to fetch CSRF token')
        }

        setCsrfToken(data.token)

        return data.token
    }

    const apiRequest = async (endpoint, options = {}) => {
        const method = (options.method || 'GET').toUpperCase()
        const headers = { ...options.headers }

        const isFormData = options.body instanceof FormData

        if (options.body && !isFormData) {
            headers['Content-Type'] = 'application/json'
        }

        if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            const token = csrfToken || await fetchCsrfToken()
            headers['X-XSRF-TOKEN'] = token
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            method,
            headers,
            credentials: 'include'
        })

        if (response.status === 204) {
            return null
        }

        const responseText = await response.text()

        let data = {}

        try {
            data = responseText ? JSON.parse(responseText) : {}
        } catch {
            data = {
                message: responseText || 'Unexpected server response'
            }
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.detail ||
                `Request failed (${response.status})`
            )
        }

        return data
    }

    const checkCurrentSession = async () => {
        try {
            await fetchCsrfToken()
            setUser(await apiRequest('/api/auth/me'))
        } catch {
            setUser(null)
        } finally {
            setCheckingSession(false)
        }
    }

    useEffect(() => {
        checkCurrentSession()

        // Check the existing login session once when the page opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleLoginChange = (event) => {
        const { name, value } = event.target

        setLoginData(previous => ({
            ...previous,
            [name]: value
        }))
    }

    const handleRegisterChange = (event) => {
        const { name, value } = event.target

        setRegisterData(previous => ({
            ...previous,
            [name]: value
        }))
    }

    const handleLogin = async (event) => {
        event.preventDefault()

        setError('')
        setSuccess('')
        setLoading(true)

        try {
            if (!csrfToken) {
                await fetchCsrfToken()
            }

            const data = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(loginData)
            })

            setSuccess(data.message || 'Login successful')

            await fetchCsrfToken()

            setUser(await apiRequest('/api/auth/me'))

            setLoginData({
                identifier: '',
                password: ''
            })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (event) => {
        event.preventDefault()

        setError('')
        setSuccess('')
        setLoading(true)

        try {
            if (!csrfToken) {
                await fetchCsrfToken()
            }

            const data = await apiRequest('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(registerData)
            })

            setSuccess(
                data.message || 'Registration successful. Please login.'
            )

            setRegisterData({
                username: '',
                email: '',
                password: '',
                role: 'BUYER'
            })

            setActiveTab('login')

            setLoginData({
                identifier: data.username,
                password: ''
            })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            await apiRequest('/api/auth/logout', {
                method: 'POST'
            })

            setUser(null)

            setLoginData({
                identifier: '',
                password: ''
            })

            await fetchCsrfToken()

            setSuccess('You have logged out successfully.')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const changeTab = (tab) => {
        setActiveTab(tab)
        setError('')
        setSuccess('')
    }

    if (checkingSession) {
        return (
            <div className="auth-loading">
                <div className="loading-spinner"></div>
                <p>Preparing PrintHub...</p>
            </div>
        )
    }

    if (
        user?.role === 'ROLE_SELLER' ||
        user?.role === 'SELLER'
    ) {
        return (
            <SellerDashboard
                user={user}
                apiRequest={apiRequest}
                onLogout={handleLogout}
            />
        )
    }

    if (user) {
        return (
            <div className="auth-page">
                <div className="auth-card authenticated-card">
                    <div className="brand">
                        <div className="brand-icon">P</div>
                        <span>Print<span>Hub</span></span>
                    </div>

                    <div className="authenticated-content">
                        <div className="success-icon">✓</div>

                        <h1>Welcome back!</h1>

                        <p className="auth-subtitle">
                            You are successfully authenticated.
                        </p>

                        <div className="user-details">
                            <div className="detail-item">
                                <span>Username</span>
                                <strong>{user.username}</strong>
                            </div>

                            <div className="detail-item">
                                <span>Role</span>
                                <strong>
                                    {user.role?.replace('ROLE_', '')}
                                </strong>
                            </div>
                        </div>

                        <button
                            className="auth-button"
                            onClick={handleLogout}
                            disabled={loading}
                        >
                            {loading ? 'Logging out...' : 'Logout'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="brand">
                    <div className="brand-icon">P</div>
                    <span>Print<span>Hub</span></span>
                </div>

                <div className="auth-heading">
                    <h1>
                        {activeTab === 'login'
                            ? 'Welcome back'
                            : 'Create your account'}
                    </h1>

                    <p>
                        {activeTab === 'login'
                            ? 'Sign in to continue to PrintHub.'
                            : 'Join PrintHub and get started today.'}
                    </p>
                </div>

                <div className="auth-tabs">
                    <button
                        type="button"
                        className={activeTab === 'login' ? 'active' : ''}
                        onClick={() => changeTab('login')}
                    >
                        Login
                    </button>

                    <button
                        type="button"
                        className={activeTab === 'register' ? 'active' : ''}
                        onClick={() => changeTab('register')}
                    >
                        Register
                    </button>
                </div>

                {error && (
                    <div className="message error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="message success-message">
                        {success}
                    </div>
                )}

                {activeTab === 'login' && (
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="identifier">
                                Username or Email
                            </label>

                            <input
                                type="text"
                                id="identifier"
                                name="identifier"
                                placeholder="Enter your username or email"
                                value={loginData.identifier}
                                onChange={handleLoginChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="login-password">
                                Password
                            </label>

                            <input
                                type="password"
                                id="login-password"
                                name="password"
                                placeholder="Enter your password"
                                value={loginData.password}
                                onChange={handleLoginChange}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                )}

                {activeTab === 'register' && (
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label htmlFor="username">
                                Username
                            </label>

                            <input
                                type="text"
                                id="username"
                                name="username"
                                placeholder="Choose a username"
                                value={registerData.username}
                                onChange={handleRegisterChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                Email Address
                            </label>

                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter your email"
                                value={registerData.email}
                                onChange={handleRegisterChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="register-password">
                                Password
                            </label>

                            <input
                                type="password"
                                id="register-password"
                                name="password"
                                placeholder="Create a password"
                                value={registerData.password}
                                onChange={handleRegisterChange}
                                required
                                minLength="6"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">
                                Register As
                            </label>

                            <select
                                id="role"
                                name="role"
                                value={registerData.role}
                                onChange={handleRegisterChange}
                            >
                                <option value="BUYER">Buyer</option>
                                <option value="SELLER">Seller</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading
                                ? 'Creating account...'
                                : 'Create Account'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>
                        {activeTab === 'login'
                            ? "Don't have an account?"
                            : 'Already have an account?'}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            changeTab(
                                activeTab === 'login'
                                    ? 'register'
                                    : 'login'
                            )
                        }
                    >
                        {activeTab === 'login'
                            ? 'Create an account'
                            : 'Sign in'}
                    </button>
                </div>
            </div>

            <p className="page-footer">
                © 2026 PrintHub. All rights reserved.
            </p>
        </div>
    )
}

export default AuthPage
