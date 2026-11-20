import { useEffect, useState } from 'react'

import SellerDashboard from '../seller/SellerDashboard'
import BuyerDashboard from '../buyer/BuyerDashboard'

import './AuthPage.css'

import API_BASE_URL from '../../config/api'

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

    // Fetch CSRF token
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

    // Common API request function
    const apiRequest = async (endpoint, options = {}) => {

        const method = (
            options.method || 'GET'
        ).toUpperCase()

        const headers = {
            ...options.headers
        }

        const isFormData =
            options.body instanceof FormData

        if (options.body && !isFormData) {
            headers['Content-Type'] = 'application/json'
        }

        if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {

            const token = csrfToken || await fetchCsrfToken()

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

        if (response.status === 204) {
            return null
        }

        const responseText = await response.text()

        let data = {}

        try {

            data = responseText
                ? JSON.parse(responseText)
                : {}

        } catch {

            data = {
                message: responseText ||
                    'Unexpected server response'
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

    // Check existing login session
    const checkCurrentSession = async () => {

        try {

            await fetchCsrfToken()

            setUser(
                await apiRequest('/api/auth/me')
            )

        } catch {

            setUser(null)

        } finally {

            setCheckingSession(false)

        }
    }

    useEffect(() => {

        checkCurrentSession()

        // Check the existing session once.
        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, [])

    // Login input changes
    const handleLoginChange = (event) => {

        const { name, value } = event.target

        setLoginData(previous => ({
            ...previous,
            [name]: value
        }))
    }

    // Registration input changes
    const handleRegisterChange = (event) => {

        const { name, value } = event.target

        setRegisterData(previous => ({
            ...previous,
            [name]: value
        }))
    }

    // Login
    const handleLogin = async (event) => {

        event.preventDefault()

        setError('')
        setSuccess('')
        setLoading(true)

        try {

            if (!csrfToken) {
                await fetchCsrfToken()
            }

            const data = await apiRequest(
                '/api/auth/login',
                {
                    method: 'POST',
                    body: JSON.stringify(loginData)
                }
            )

            setSuccess(
                data.message || 'Login successful'
            )

            await fetchCsrfToken()

            setUser(
                await apiRequest('/api/auth/me')
            )

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

    // Register
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
                data.message ||
                'Registration successful. Please login.'
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

    // Logout
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

            await fetchCsrfToken()

            setSuccess(
                'You have logged out successfully.'
            )

        } catch (err) {

            setError(err.message)

        } finally {

            setLoading(false)

        }
    }

    // Change login/register tab
    const changeTab = (tab) => {

        setActiveTab(tab)

        setError('')
        setSuccess('')

    }

    // ── LOADING SCREEN ───────────────────────────────────────
    if (checkingSession) {

        return (

            <div className="auth-loading">

                <div className="auth-loading-brand">
                    <img src="/logo.svg" alt="PrintHub Logo" className="brand-icon-box" />
                    <span>Print<span>Hub</span></span>
                </div>

                <div className="loading-spinner"></div>

                <p className="auth-loading-text">Preparing PrintHub...</p>

            </div>

        )
    }

    // ── SELLER DASHBOARD ─────────────────────────────────────
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

    // ── BUYER DASHBOARD ──────────────────────────────────────
    if (
        user?.role === 'ROLE_BUYER' ||
        user?.role === 'BUYER'
    ) {

        return (

            <BuyerDashboard
                user={user}
                apiRequest={apiRequest}
                onLogout={handleLogout}
            />

        )
    }

    // ── LOGIN / REGISTER PAGE ────────────────────────────────
    return (

        <div className="auth-page">

            {/* ── LEFT: BRAND PANEL ── */}
            <div className="auth-brand-panel">

                {/* Wordmark */}
                <div className="auth-brand-wordmark">
                    <img
                        src="/logo.svg"
                        alt="PrintHub Logo"
                        className="auth-plane-logo"
                    />

                    <span className="wordmark-text">
                        Print<span>Hub</span>
                    </span>
                </div>

                {/* Headline */}
                <h1 className="auth-brand-headline">
                    Print <span className="lime">smarter.</span><br />
                    Order <span className="lime">faster.</span>
                </h1>

                {/* Tagline */}
                <p className="auth-brand-tagline">
                    The modern platform connecting print buyers<br />
                    with trusted local print shops.
                </p>

                {/* 3 benefit bullets */}
                <ul className="auth-brand-benefits">

                    <li>
                        <span className="benefit-bullet">
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="2 6 5 9 10 3" />
                            </svg>
                        </span>
                        <span>
                            <span className="benefit-title">Upload & order in minutes</span><br />
                            <span className="benefit-desc">Drop your file, pick your specs, place the order. Done.</span>
                        </span>
                    </li>

                    <li>
                        <span className="benefit-bullet">
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="2 6 5 9 10 3" />
                            </svg>
                        </span>
                        <span>
                            <span className="benefit-title">Track every order live</span><br />
                            <span className="benefit-desc">Real-time status from placed → printing → ready to collect.</span>
                        </span>
                    </li>

                    <li>
                        <span className="benefit-bullet">
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="2 6 5 9 10 3" />
                            </svg>
                        </span>
                        <span>
                            <span className="benefit-title">Manage your print shop</span><br />
                            <span className="benefit-desc">Sellers get a full dashboard to list services and manage jobs.</span>
                        </span>
                    </li>

                </ul>

            </div>

            {/* ── RIGHT: FORM PANEL ── */}
            <div className="auth-form-panel">

                <div className="auth-form-card">

                    {/* Card heading */}
                    <div className="auth-form-heading">
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

                    {/* PILL TABS */}
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

                    {/* MESSAGES */}

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

                    {/* REGISTRATION FORM */}

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

                    {/* FOOTER LINK */}
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

        </div>

    )
}

export default AuthPage
