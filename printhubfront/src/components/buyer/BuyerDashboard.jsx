import { useEffect, useState } from 'react'
import './BuyerDashboard.css'
import BuyerOrderSection from './BuyerOrderSection'

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

    const [loading, setLoading] = useState(true)
    const [detailsLoading, setDetailsLoading] = useState(false)

    const [error, setError] = useState('')
    const [pricingMessage, setPricingMessage] = useState('')

    // Load all active stores
    useEffect(() => {

        let cancelled = false
        const objectUrls = []

        const loadStores = async () => {

            setLoading(true)
            setError('')

            try {

                const data = await apiRequest('/api/buyer/stores')

                if (cancelled) return

                setStores(data)

                // Load pictures for all stores
                const imageEntries = await Promise.all(

                    data
                        .filter(store => store.pictureName)
                        .map(async store => {

                            try {

                                const response = await fetch(
                                    `${API_BASE_URL}/api/buyer/stores/${store.id}/picture`,
                                    {
                                        credentials: 'include'
                                    }
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

                    setPictureUrls(
                        Object.fromEntries(imageEntries)
                    )

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

            objectUrls.forEach(url =>
                URL.revokeObjectURL(url)
            )

        }

        // Load stores once when the buyer dashboard opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, [])

    // Open individual store
    const openStore = async (store) => {

        setSelectedStore(store)
        setPricing(null)
        setPricingMessage('')
        setDetailsLoading(true)

        try {

            const [details, storePricing] = await Promise.all([

                apiRequest(
                    `/api/buyer/stores/${store.id}`
                ),

                apiRequest(
                    `/api/buyer/stores/${store.id}/pricing`
                ).catch(err => {

                    if (
                        err.message.toLowerCase().includes('pricing')
                    ) {

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

    // Search stores
    const filteredStores = stores.filter(store => {

        const search = searchTerm.trim().toLowerCase()

        return (
            !search ||
            store.name?.toLowerCase().includes(search) ||
            store.location?.toLowerCase().includes(search) ||
            store.description?.toLowerCase().includes(search)
        )

    })

    // Back to store listing
    const goBackToStores = () => {

        setSelectedStore(null)
        setPricing(null)
        setPricingMessage('')
        setError('')

    }

    return (

        <div className="buyer-page">

            {/* NAVBAR */}

            <header className="buyer-topbar">

                <a
                    className="buyer-brand"
                    href="#home"
                    onClick={goBackToStores}
                >

                    <span className="buyer-brand-icon">
                        P
                    </span>

                    <span>
                        Print<span>Hub</span>
                    </span>

                </a>

                <div className="buyer-user">

                    <div>
                        <strong>
                            {user?.username || 'Buyer'}
                        </strong>

                        <small>Buyer account</small>
                    </div>

                    <button
                        className="buyer-logout"
                        onClick={onLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>

            <main className="buyer-main">

                {/* ERROR MESSAGE */}

                {error && (

                    <div className="buyer-alert buyer-alert-error">

                        {error}

                        <button
                            onClick={() => setError('')}
                            aria-label="Dismiss"
                        >
                            ×
                        </button>

                    </div>

                )}

                {/* STORE LISTING */}

                {!selectedStore ? (

                    <>

                        <section className="buyer-hero">

                            <div>

                                <p className="buyer-eyebrow">
                                    PRINTING MADE SIMPLE
                                </p>

                                <h1>
                                    Find a print shop near you.
                                </h1>

                                <p className="buyer-hero-copy">
                                    Browse local printing shops, compare
                                    their services and prices, and get
                                    your documents printed without
                                    waiting in line.
                                </p>

                            </div>

                            <div
                                className="buyer-hero-art"
                                aria-hidden="true"
                            >

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

                                    {stores.length}

                                    {' '}

                                    {stores.length === 1
                                        ? 'shop'
                                        : 'shops'}

                                </span>

                            </div>

                            {/* SEARCH */}

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

                            {/* LOADING */}

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
                                            ? 'Please check again later. New printing shops will appear here.'
                                            : 'Try another shop name or location.'}
                                    </p>

                                </div>

                            ) : (

                                /* STORE CARDS */

                                <div className="buyer-store-grid">

                                    {filteredStores.map(store => (

                                        <article
                                            className="buyer-store-card"
                                            key={store.id}
                                        >

                                            <div className="buyer-store-image">

                                                {pictureUrls[store.id] ? (

                                                    <img
                                                        src={pictureUrls[store.id]}
                                                        alt={`${store.name} shop`}
                                                    />

                                                ) : (

                                                    <div className="buyer-store-placeholder">
                                                        P
                                                    </div>

                                                )}

                                                <span className="buyer-open-label">
                                                    Active shop
                                                </span>

                                            </div>

                                            <div className="buyer-store-card-content">

                                                <h3>
                                                    {store.name}
                                                </h3>

                                                <p className="buyer-store-location">

                                                    <span>⌖</span>

                                                    {store.location ||
                                                        'Location not provided'}

                                                </p>

                                                <p className="buyer-store-description">

                                                    {store.description ||
                                                        'Printing and document services.'}

                                                </p>

                                                <div className="buyer-card-footer">

                                                    <span>
                                                        View shop details
                                                    </span>

                                                    <button
                                                        onClick={() =>
                                                            openStore(store)
                                                        }
                                                    >
                                                        Explore
                                                        <span>→</span>
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

                    /* INDIVIDUAL STORE DETAILS */

                    <section className="buyer-details-page">

                        <button
                            className="buyer-back-button"
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

                                {/* STORE HEADER */}

                                <div className="buyer-details-header">

                                    <div className="buyer-details-image">

                                        {pictureUrls[selectedStore.id] ? (

                                            <img
                                                src={pictureUrls[selectedStore.id]}
                                                alt={`${selectedStore.name} shop`}
                                            />

                                        ) : (

                                            <div className="buyer-store-placeholder">
                                                P
                                            </div>

                                        )}

                                    </div>

                                    <div className="buyer-details-title">

                                        <span className="buyer-open-label inline-label">
                                            Active shop
                                        </span>

                                        <h1>
                                            {selectedStore.name}
                                        </h1>

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

                                <div className="buyer-details-grid">

                                    {/* CONTACT INFORMATION */}

                                    <section className="buyer-info-panel">

                                        <p className="buyer-eyebrow">
                                            SHOP INFORMATION
                                        </p>

                                        <h2>
                                            Contact & opening hours
                                        </h2>

                                        <div className="buyer-info-list">

                                            <div>
                                                <span>Email</span>

                                                <strong>
                                                    {selectedStore.email ||
                                                        'Not provided'}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Phone</span>

                                                <strong>
                                                    {selectedStore.phoneNumber ||
                                                        'Not provided'}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Opens</span>

                                                <strong>
                                                    {formatTime(
                                                        selectedStore.openingTime
                                                    )}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Closes</span>

                                                <strong>
                                                    {formatTime(
                                                        selectedStore.closingTime
                                                    )}
                                                </strong>
                                            </div>

                                        </div>

                                    </section>

                                    {/* PRINTING PRICES */}

                                    <section className="buyer-info-panel">

                                        <p className="buyer-eyebrow">
                                            PRINTING SERVICES
                                        </p>

                                        <h2>
                                            Printing prices
                                        </h2>

                                        {pricingMessage ? (

                                            <p className="buyer-pricing-message">
                                                {pricingMessage}
                                            </p>

                                        ) : pricing ? (

                                            <div className="buyer-price-list">

                                                <div>
                                                    <span>
                                                        B/W · Single side
                                                    </span>

                                                    <strong>
                                                        {formatPrice(
                                                            pricing.blackAndWhiteSingleSideCost
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        B/W · Double side
                                                    </span>

                                                    <strong>
                                                        {formatPrice(
                                                            pricing.blackAndWhiteDoubleSideCost
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Colour · Single side
                                                    </span>

                                                    <strong>
                                                        {formatPrice(
                                                            pricing.colourSingleSideCost
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Colour · Double side
                                                    </span>

                                                    <strong>
                                                        {formatPrice(
                                                            pricing.colourDoubleSideCost
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Binding</span>

                                                    <strong>
                                                        {formatPrice(
                                                            pricing.bindingCost
                                                        )}
                                                    </strong>
                                                </div>

                                            </div>

                                        ) : (

                                            <p className="buyer-pricing-message">
                                                Pricing information is unavailable.
                                            </p>

                                        )}

                                        <p className="buyer-price-note">
                                            Prices are provided by the shop.
                                            Final order pricing will be
                                            calculated when print ordering
                                            is implemented.
                                        </p>

                                    </section>

                                </div>

                                <BuyerOrderSection
                                    storeId={selectedStore.id}
                                    storeName={selectedStore.name}
                                    pricing={pricing}
                                    apiRequest={apiRequest}
                                />

                                <div className="buyer-coming-soon">

                                    <div>

                                        <span className="buyer-coming-icon">
                                            ＋
                                        </span>

                                        <div>

                                            <strong>
                                                Want to print a document here?
                                            </strong>

                                            <p>
                                                Online document upload and
                                                print ordering are coming
                                                in the next phase.
                                            </p>

                                        </div>

                                    </div>

                                    <span className="buyer-coming-tag">
                                        Coming next
                                    </span>

                                </div>

                            </>

                        )}

                    </section>

                )}

            </main>

        </div>

    )
}

export default BuyerDashboard