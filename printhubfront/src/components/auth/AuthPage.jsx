import { useEffect, useState } from 'react'
import './AuthPage.css'

const API_BASE_URL = 'http://localhost:8080'

function AuthPage() {

    // Login or register
    const [activeTab, setActiveTab] = useState('login')

    // CSRF token
    const [csrfToken, setCsrfToken] = useState('')

    // Loading state
    const [loading, setLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)

    // Messages
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Authenticated user
    const [user, setUser] = useState(null)

    // Login form
    const [loginData, setLoginData] = useState({
        identifier: '',
        password: ''
    })

    // Register form
    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'BUYER'
    })

    // --------------------------------------------------
    // GET CSRF TOKEN
    // --------------------------------------------------

    const fetchCsrfToken = async () => {

        const response = await fetch(
            `${API_BASE_URL}/api/auth/csrf`,
            {
                method: 'GET',
                credentials: 'include'
            }
        )

        const data = await response.json()

        if (!response.ok) {
            throw new Error(
                data.message || 'Unable to fetch CSRF token'
            )
        }

        setCsrfToken(data.token)

        return data.token
    }

    // --------------------------------------------------
    // COMMON API REQUEST FUNCTION
    // --------------------------------------------------

    const apiRequest = async (endpoint, options = {}) => {

        const method = (options.method || 'GET').toUpperCase()

        const headers = {
            ...options.headers
        }

        if (options.body) {
            headers['Content-Type'] = 'application/json'
        }

        // Add CSRF token for unsafe HTTP methods
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {

            let token = csrfToken

            if (!token) {
                token = await fetchCsrfToken()
            }

            headers['X-XSRF-TOKEN'] = token
        }

        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                method,
                headers,
                credentials: 'include'
            }
        )

        const responseText = await response.text()

        let data = {}

        try {
            data = responseText
                ? JSON.parse(responseText)
                : {}
        } catch {
            data = {
                message: responseText || 'Unexpected server response'
            }
        }

        if (!response.ok) {

            throw new Error(
                data.message || `Request failed (${response.status})`
            )
        }

        return data
    }

    // --------------------------------------------------
    // CHECK CURRENT SESSION
    // --------------------------------------------------

    const checkCurrentSession = async () => {

        try {

            await fetchCsrfToken()

            const data = await apiRequest('/api/auth/me')

            setUser(data)

        } catch {

            setUser(null)

        } finally {

            setCheckingSession(false)

        }
    }

    useEffect(() => {
        checkCurrentSession()
    }, [])

    // --------------------------------------------------
    // LOGIN FORM CHANGE
    // --------------------------------------------------

    const handleLoginChange = (event) => {

        const { name, value } = event.target

        setLoginData(previous => ({
            ...previous,
            [name]: value
        }))
    }

    // --------------------------------------------------
    // REGISTER FORM CHANGE
    // --------------------------------------------------

    const handleRegisterChange = (event) => {

        const { name, value } = event.target

        setRegisterData(previous => ({
            ...previous,
            [name]: value
        }))
    }

    // --------------------------------------------------
    // LOGIN
    // --------------------------------------------------

    const handleLogin = async (event) => {

        event.preventDefault()

        setError('')
        setSuccess('')
        setLoading(true)

        try {

            // Make sure we have a CSRF token
            if (!csrfToken) {
                await fetchCsrfToken()
            }

            // Login request
            const data = await apiRequest(
                '/api/auth/login',
                {
                    method: 'POST',
                    body: JSON.stringify(loginData)
                }
            )

            setSuccess(data.message || 'Login successful')

            // Spring Security may clear the previous CSRF token
            // after authentication. Fetch a fresh token.
            await fetchCsrfToken()

            // Verify the authenticated session
            const currentUser = await apiRequest('/api/auth/me')

            setUser(currentUser)

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

    // --------------------------------------------------
    // REGISTER
    // --------------------------------------------------

    const handleRegister = async (event) => {

        event.preventDefault()

        setError('')
        setSuccess('')
        setLoading(true)

        try {

            if (!csrfToken) {
                await fetchCsrfToken()
            }

            const data = await apiRequest(
                '/api/auth/register',
                {
                    method: 'POST',
                    body: JSON.stringify(registerData)
                }
            )

            setSuccess(
                data.message || 'Registration successful. Please login.'
            )

            // Clear registration form
            setRegisterData({
                username: '',
                email: '',
                password: '',
                role: 'BUYER'
            })

            // Switch to login
            setActiveTab('login')

            // Put the registered username in the login field
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

    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------

    const handleLogout = async () => {

        setError('')
        setSuccess('')
        setLoading(true)

        try {

            await apiRequest(
                '/api/auth/logout',
                {
                    method: 'POST'
                }
            )

            setUser(null)

            setLoginData({
                identifier: '',
                password: ''
            })

            // Get a fresh CSRF token for the next login
            await fetchCsrfToken()

            setSuccess('You have logged out successfully.')

        } catch (err) {

            setError(err.message)

        } finally {

            setLoading(false)

        }
    }

    // --------------------------------------------------
    // SWITCH TAB
    // --------------------------------------------------

    const changeTab = (tab) => {

        setActiveTab(tab)

        setError('')
        setSuccess('')
    }

    // --------------------------------------------------
    // LOADING SCREEN
    // --------------------------------------------------

    if (checkingSession) {

        return (
            <div className="auth-loading">
                <div className="loading-spinner"></div>
                <p>Preparing PrintHub...</p>
            </div>
        )
    }

    // --------------------------------------------------
    // AUTHENTICATED USER
    // --------------------------------------------------

    if (user) {

        return (

            <div className="auth-page">

                <div className="auth-card authenticated-card">

                    <div className="brand">
                        <div className="brand-icon">P</div>
                        <span>Print<span>Hub</span></span>
                    </div>

                    <div className="authenticated-content">

                        <div className="success-icon">
                            ✓
                        </div>

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

    // --------------------------------------------------
    // LOGIN / REGISTER PAGE
    // --------------------------------------------------

    return (

        <div className="auth-page">

            <div className="auth-card">

                {/* BRAND */}

                <div className="brand">
                    <div className="brand-icon">P</div>
                    <span>Print<span>Hub</span></span>
                </div>

                {/* INTRO */}

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

                {/* TABS */}

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

                {/* ERROR MESSAGE */}

                {error && (

                    <div className="message error-message">
                        {error}
                    </div>

                )}

                {/* SUCCESS MESSAGE */}

                {success && (

                    <div className="message success-message">
                        {success}
                    </div>

                )}

                {/* LOGIN FORM */}

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

                {/* REGISTER FORM */}

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
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>

                    </form>

                )}

                {/* FOOTER */}

                <div className="auth-footer">

                    <p>
                        {activeTab === 'login'
                            ? "Don't have an account?"
                            : 'Already have an account?'}
                    </p>

                    <button
                        type="button"
                        onClick={() => changeTab(
                            activeTab === 'login' ? 'register' : 'login'
                        )}
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