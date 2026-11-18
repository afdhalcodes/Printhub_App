import { useEffect, useState } from 'react'
import './BuyerDashboard.css'
import BuyerOrderSection from './BuyerOrderSection'
import NotificationCenter from '../notifications/NotificationCenter'

const API_BASE_URL = 'http://localhost:8080'

function formatTime(value) {
    if (!value) return 'Not specified'

    const [hours, minutes] = value.split(':')
    const date = new Date()

    date.setHours(Number(hours), Number(minutes), 0, 0)

    return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    })
}

function formatPrice(value) {
    if (value === null || value === undefined) return '—'
    return `₹${Number(value).toFixed(2)}`
}

function BuyerDashboard({ user, apiRequest, onLogout }) {

    const [stores, setStores] = useState([])
    const [selectedStore, setSelectedStore] = useState(null)

    const [pricing, setPricing] = useState(null)
    const [pictureUrls, setPictureUrls] = useState({})

    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('shops')

    const [loading, setLoading] = useState(true)
    const [detailsLoading, setDetailsLoading] = useState(false)

    const [error, setError] = useState('')
    const [pricingMessage, setPricingMessage] = useState('')

    // =====================================================
    // LOAD AVAILABLE STORES
    // =====================================================

    useEffect(() => {

        let cancelled = false
        const objectUrls = []

        const loadStores = async () => {

            setLoading(true)
            setError('')

            try {

                const data = await apiRequest('/api/buyer/stores')

                if (cancelled) return

                const availableStores = Array.isArray(data) ? data : []
                setStores(availableStores)

                const imageEntries = await Promise.all(
                    availableStores
                        .filter(store => store.pictureName)
                        .map(async store => {

                            try {

                                const response = await fetch(
                                    `${API_BASE_URL}/api/buyer/stores/${store.id}/picture`,
                                    { credentials: 'include' }
                                )

                                if (!response.ok) {
                                    return [store.id, '']
                                }

                                const blob = await response.blob()
                                const url = URL.createObjectURL(blob)

                                objectUrls.push(url)

                                return [store.id, url]

                            } catch {
                                return [store.id, '']
                            }
                        })
                )

                if (!cancelled) {
                    setPictureUrls(Object.fromEntries(imageEntries))
                }

            } catch (err) {

                if (!cancelled) {
                    setError(err.message)
                }

            } finally {

                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadStores()

        return () => {

            cancelled = true

            objectUrls.forEach(url => URL.revokeObjectURL(url))
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, [])

    // =====================================================
    // OPEN STORE DETAILS
    // =====================================================

    const openStore = async store => {

        setSelectedStore(store)
        setPricing(null)
        setPricingMessage('')
        setError('')
        setDetailsLoading(true)

        try {

            const [details, storePricing] = await Promise.all([

                apiRequest(`/api/buyer/stores/${store.id}`),

                apiRequest(`/api/buyer/stores/${store.id}/pricing`)
                    .catch(err => {

                        if (err.message.toLowerCase().includes('pricing')) {

                            setPricingMessage(
                                'This shop has not configured its printing prices yet.'
                            )

                            return null
                        }

                        throw err
                    })
            ])

            setSelectedStore(details)
            setPricing(storePricing)

        } catch (err) {

            setError(err.message)

        } finally {

            setDetailsLoading(false)
        }
    }

    // =====================================================
    // BACK TO SHOPS
    // =====================================================

    const goBackToStores = () => {

        setSelectedStore(null)
        setPricing(null)
        setPricingMessage('')
        setError('')
    }

    // =====================================================
    // SEARCH
    // =====================================================

    const filteredStores = stores.filter(store => {

        const search = searchTerm.trim().toLowerCase()

        return (
            !search ||
            store.name?.toLowerCase().includes(search) ||
            store.location?.toLowerCase().includes(search) ||
            store.description?.toLowerCase().includes(search)
        )
    })

    // =====================================================
    // NAVIGATION
    // =====================================================

    const openShopsTab = () => {
        setActiveTab('shops')
        setSelectedStore(null)
        setError('')
    }

    const openOrdersTab = () => {
        setActiveTab('orders')
        setSelectedStore(null)
        setError('')
    }

    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="buyer-page">

            {/* NAVBAR */}

            <header className="buyer-topbar">

                <div className="buyer-topbar-left">

                    <a
                        className="buyer-brand"
                        href="#home"
                        onClick={event => {
                            event.preventDefault()
                            openShopsTab()
                        }}
                    >
                        <img src="/logo.svg" alt="PrintHub Logo" className="buyer-brand-icon" />

                        <span>
                            Print<span>Hub</span>
                        </span>
                    </a>

                    {/* INLINE NAV TABS */}
                    <nav className="buyer-topbar-nav">

                        <button
                            type="button"
                            className={activeTab === 'shops' ? 'active' : ''}
                            onClick={openShopsTab}
                        >
                            <span>⌂</span>
                            Explore Shops
                        </button>

                        <button
                            type="button"
                            className={activeTab === 'orders' ? 'active' : ''}
                            onClick={openOrdersTab}
                        >
                            <span>▤</span>
                            My Orders
                        </button>

                    </nav>

                </div>

                <div className="buyer-user">

                    <NotificationCenter
                        role="BUYER"
                        userKey={user?.id || user?.username}
                        onOpenOrders={openOrdersTab}
                    />

                    <div>
                        <strong>
                            {user?.username || user?.email || 'Buyer'}
                        </strong>

                        <small>Buyer account</small>
                    </div>

                    <button
                        type="button"
                        onClick={onLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>

            <main className="buyer-main">

                {/* ERROR */}

                {error && (

                    <div className="buyer-alert buyer-alert-error">

                        {error}

                        <button
                            type="button"
                            onClick={() => setError('')}
                        >
                            ×
                        </button>

                    </div>

                )}

                {/* =================================================
                    MY ORDERS TAB
                ================================================= */}

                {activeTab === 'orders' ? (

                    <section className="buyer-my-orders-page">

                        <div className="buyer-section-heading">

                            <div>
                                <p className="buyer-eyebrow">
                                    YOUR PRINTING ACTIVITY
                                </p>

                                <h1>My Orders</h1>

                                <p>
                                    Track all your print requests and see
                                    which orders are ready for collection.
                                </p>
                            </div>

                        </div>

                        <BuyerOrderSection
                            apiRequest={apiRequest}
                            mode="all"
                        />

                    </section>

                ) : (

                    /* =================================================
                       EXPLORE SHOPS TAB
                    ================================================= */

                    !selectedStore ? (

                        <>

                            {/* HERO */}
                            <section className="buyer-hero">

                                {/* Diagonal stripe SVG pattern on right half */}
                                <div className="buyer-hero-pattern" aria-hidden="true">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="100%"
                                        height="100%"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <pattern
                                                id="diag-stripes"
                                                x="0"
                                                y="0"
                                                width="20"
                                                height="20"
                                                patternUnits="userSpaceOnUse"
                                                patternTransform="rotate(45)"
                                            >
                                                <line
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="20"
                                                    stroke="#BAFF39"
                                                    strokeWidth="1.5"
                                                />
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#diag-stripes)" />
                                    </svg>
                                </div>

                                <div>

                                    <p className="buyer-eyebrow">
                                        PRINTING MADE SIMPLE
                                    </p>

                                    <h1>
                                        Find a print shop<br />near you.
                                    </h1>

                                    <p className="buyer-hero-copy">
                                        Browse local printing shops, compare
                                        their services and prices, and get
                                        your documents printed without
                                        waiting in line.
                                    </p>

                                </div>

                                <div className="buyer-hero-art" aria-hidden="true">

                                    <div className="paper paper-back"></div>

                                    <div className="paper paper-front">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>

                                    <div className="printer-icon">
                                        ▤
                                    </div>

                                </div>

                            </section>

                            {/* STORE LIST */}
                            <section className="buyer-store-section">

                                <div className="buyer-section-heading">

                                    <div>
                                        <p className="buyer-eyebrow">
                                            EXPLORE PRINT SHOPS
                                        </p>

                                        <h2>Available shops</h2>

                                        <p>
                                            Choose a shop to view its details
                                            and printing prices.
                                        </p>
                                    </div>

                                    <span className="buyer-store-count">
                                        {stores.length}{' '}
                                        {stores.length === 1 ? 'shop' : 'shops'}
                                    </span>

                                </div>

                                <div className="buyer-search-wrap">

                                    <span>⌕</span>

                                    <input
                                        type="search"
                                        placeholder="Search by shop name or location..."
                                        value={searchTerm}
                                        onChange={event =>
                                            setSearchTerm(event.target.value)
                                        }
                                    />

                                </div>

                                {loading ? (

                                    <div className="buyer-state">
                                        Loading available shops...
                                    </div>

                                ) : filteredStores.length === 0 ? (

                                    <div className="buyer-empty-state">

                                        <div className="buyer-empty-icon">
                                            ⌕
                                        </div>

                                        <h3>
                                            {stores.length === 0
                                                ? 'No shops available yet'
                                                : 'No matching shops'}
                                        </h3>

                                        <p>
                                            {stores.length === 0
                                                ? 'Please check again later.'
                                                : 'Try another shop name or location.'}
                                        </p>

                                    </div>

                                ) : (

                                    <div className="buyer-store-grid">

                                        {filteredStores.map(store => (

                                            <article
                                                className="buyer-store-card"
                                                key={store.id}
                                                onClick={() => openStore(store)}
                                            >

                                                <div className="buyer-store-image">

                                                    {pictureUrls[store.id] ? (

                                                        <img
                                                            src={pictureUrls[store.id]}
                                                            alt={`${store.name} shop`}
                                                        />

                                                    ) : (

                                                        <div className="buyer-store-placeholder">
                                                            <img src="/logo.svg" alt="PrintHub" className="buyer-placeholder-logo" />
                                                        </div>

                                                    )}

                                                    <span className="buyer-open-label">
                                                        Active shop
                                                    </span>

                                                    {/* HOVER OVERLAY */}
                                                    <div className="buyer-store-overlay">
                                                        <div className="buyer-store-overlay-btn">
                                                            View Shop →
                                                        </div>
                                                    </div>

                                                </div>

                                                <div className="buyer-store-card-content">

                                                    <h3>{store.name}</h3>

                                                    <p className="buyer-store-location">
                                                        <span>⌖</span>
                                                        {store.location || 'Location not provided'}
                                                    </p>

                                                    <p className="buyer-store-description">
                                                        {store.description ||
                                                            'Printing and document services.'}
                                                    </p>

                                                    <div className="buyer-card-footer">

                                                        <span>View shop details</span>

                                                        <button
                                                            type="button"
                                                            onClick={event => {
                                                                event.stopPropagation()
                                                                openStore(store)
                                                            }}
                                                        >
                                                            Explore <span>→</span>
                                                        </button>

                                                    </div>

                                                </div>

                                            </article>

                                        ))}

                                    </div>

                                )}

                            </section>

                        </>

                    ) : (

                        /* =================================================
                           INDIVIDUAL STORE DETAILS
                        ================================================= */

                        <section className="buyer-details-page">

                            <button
                                className="buyer-back-button"
                                type="button"
                                onClick={goBackToStores}
                            >
                                ← Back to shops
                            </button>

                            {detailsLoading ? (

                                <div className="buyer-state">
                                    Loading shop details...
                                </div>

                            ) : (

                                <>

                                    <div className="buyer-details-header">

                                        <div className="buyer-details-image">

                                            {pictureUrls[selectedStore.id] ? (

                                                <img
                                                    src={pictureUrls[selectedStore.id]}
                                                    alt={`${selectedStore.name} shop`}
                                                />

                                            ) : (

                                                <div className="buyer-store-placeholder">
                                                    <img src="/logo.svg" alt="PrintHub" className="buyer-placeholder-logo" />
                                                </div>

                                            )}

                                        </div>

                                        <div className="buyer-details-title">

                                            <span className="buyer-open-label inline-label">
                                                Active shop
                                            </span>

                                            <h1>{selectedStore.name}</h1>

                                            <p>
                                                ⌖ {selectedStore.location ||
                                                    'Location not provided'}
                                            </p>

                                            <p>
                                                {selectedStore.description ||
                                                    'Printing and document services.'}
                                            </p>

                                        </div>

                                    </div>

                                    {/* 2-COL INFO PANELS GRID */}
                                    <div className="buyer-details-grid">

                                        <section className="buyer-info-panel">

                                            <p className="buyer-eyebrow">
                                                SHOP INFORMATION
                                            </p>

                                            <h2>Contact & opening hours</h2>

                                            <div className="buyer-info-list">

                                                <div>
                                                    <span>Email</span>
                                                    <strong>
                                                        {selectedStore.email || 'Not provided'}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Phone</span>
                                                    <strong>
                                                        {selectedStore.phoneNumber || 'Not provided'}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Opens</span>
                                                    <strong>
                                                        {formatTime(selectedStore.openingTime)}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Closes</span>
                                                    <strong>
                                                        {formatTime(selectedStore.closingTime)}
                                                    </strong>
                                                </div>

                                            </div>

                                        </section>

                                        <section className="buyer-info-panel">

                                            <p className="buyer-eyebrow">
                                                PRINTING SERVICES
                                            </p>

                                            <h2>Printing prices</h2>

                                            {pricingMessage ? (

                                                <p className="buyer-pricing-message">
                                                    {pricingMessage}
                                                </p>

                                            ) : pricing ? (

                                                <div className="buyer-price-list">

                                                    <div>
                                                        <span>B/W · Single side</span>
                                                        <strong>
                                                            {formatPrice(pricing.blackAndWhiteSingleSideCost)}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>B/W · Double side</span>
                                                        <strong>
                                                            {formatPrice(pricing.blackAndWhiteDoubleSideCost)}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>Colour · Single side</span>
                                                        <strong>
                                                            {formatPrice(pricing.colourSingleSideCost)}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>Colour · Double side</span>
                                                        <strong>
                                                            {formatPrice(pricing.colourDoubleSideCost)}
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>Binding</span>
                                                        <strong>
                                                            {formatPrice(pricing.bindingCost)}
                                                        </strong>
                                                    </div>

                                                </div>

                                            ) : (

                                                <p className="buyer-pricing-message">
                                                    Pricing information is unavailable.
                                                </p>

                                            )}

                                            <p className="buyer-price-note">
                                                The backend calculates your final
                                                order price using the uploaded PDF
                                                page count and selected print options.
                                            </p>

                                        </section>

                                    </div>

                                    <BuyerOrderSection
                                        storeId={selectedStore.id}
                                        storeName={selectedStore.name}
                                        pricing={pricing}
                                        apiRequest={apiRequest}
                                        mode="store"
                                    />

                                </>

                            )}

                        </section>

                    )

                )}

            </main>

        </div>

    )
}

export default BuyerDashboard
