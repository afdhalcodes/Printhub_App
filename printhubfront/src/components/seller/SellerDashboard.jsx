import { useEffect, useState } from 'react'
import './SellerDashboard.css'
import SellerOrders from './SellerOrders'
import NotificationCenter from '../notifications/NotificationCenter'

const emptyStore = {
    name: '',
    location: '',
    email: '',
    phoneNumber: '',
    description: '',
    openingTime: '09:00',
    closingTime: '18:00'
}

const emptyPricing = {
    bindingCost: '0.00',
    blackAndWhiteSingleSideCost: '2.00',
    blackAndWhiteDoubleSideCost: '3.00',
    colourSingleSideCost: '10.00',
    colourDoubleSideCost: '15.00'
}

function SellerDashboard({ user, apiRequest, onLogout }) {
    const [stores, setStores] = useState([])
    const [selectedStore, setSelectedStore] = useState(null)
    const [storeForm, setStoreForm] = useState(emptyStore)
    const [pricingForm, setPricingForm] = useState(emptyPricing)

    const [editingStore, setEditingStore] = useState(false)
    const [pricingExists, setPricingExists] = useState(false)

    const [pictureFile, setPictureFile] = useState(null)
    const [picturePreview, setPicturePreview] = useState('')

    const [loading, setLoading] = useState(true)
    const [savingStore, setSavingStore] = useState(false)
    const [savingPricing, setSavingPricing] = useState(false)
    const [uploadingPicture, setUploadingPicture] = useState(false)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Dashboard navigation
    const [activeView, setActiveView] = useState('stores')

    // Number of new orders received through SSE
    const [newOrderCount, setNewOrderCount] = useState(0)

    const showError = (message) => {
        setError(message)
        setSuccess('')
    }

    const showSuccess = (message) => {
        setSuccess(message)
        setError('')
    }

    // =====================================================
    // LOAD SELLER STORES
    // =====================================================

    const loadStores = async () => {
        setLoading(true)

        try {
            const data = await apiRequest('/api/seller/stores')
            setStores(data)

            if (data.length > 0) {
                const current =
                    data.find(item => item.id === selectedStore?.id) || data[0]

                await selectStore(current)
            } else {
                setSelectedStore(null)
            }
        } catch (err) {
            showError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStores()

        // Load the seller's stores once when the dashboard opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // =====================================================
    // UNREAD BADGE ON THE "INCOMING ORDERS" TAB
    // The notification bell receives the server events and
    // forwards each new order here.
    // =====================================================

    useEffect(() => {

        const handleNewOrder = () => {

            // No badge needed when the seller is already on the orders tab.
            if (activeView !== 'orders') {
                setNewOrderCount(previous => previous + 1)
            }
        }

        window.addEventListener('printhub:new-order', handleNewOrder)

        return () => {
            window.removeEventListener('printhub:new-order', handleNewOrder)
        }

    }, [activeView])

    // =====================================================
    // CLEAN UP PICTURE PREVIEW
    // =====================================================

    useEffect(() => {
        return () => {
            if (picturePreview.startsWith('blob:')) {
                URL.revokeObjectURL(picturePreview)
            }
        }
    }, [picturePreview])

    // =====================================================
    // LOAD STORE PICTURE
    // =====================================================

    const loadStorePicture = async (store) => {
        if (!store?.pictureName) {
            setPicturePreview('')
            return
        }

        try {
            const response = await fetch(
                `http://localhost:8080/api/seller/stores/${store.id}/picture`,
                {
                    credentials: 'include'
                }
            )

            if (!response.ok) {
                setPicturePreview('')
                return
            }

            const blob = await response.blob()
            setPicturePreview(URL.createObjectURL(blob))
        } catch {
            setPicturePreview('')
        }
    }

    // =====================================================
    // SELECT STORE
    // =====================================================

    const selectStore = async (store) => {
        setSelectedStore(store)

        setStoreForm({
            name: store.name || '',
            location: store.location || '',
            email: store.email || '',
            phoneNumber: store.phoneNumber || '',
            description: store.description || '',
            openingTime: store.openingTime?.slice(0, 5) || '09:00',
            closingTime: store.closingTime?.slice(0, 5) || '18:00'
        })

        setPictureFile(null)

        await loadStorePicture(store)

        try {
            const pricing = await apiRequest(
                `/api/seller/stores/${store.id}/pricing`
            )

            setPricingExists(true)

            setPricingForm({
                bindingCost: String(pricing.bindingCost ?? 0),

                blackAndWhiteSingleSideCost:
                    String(pricing.blackAndWhiteSingleSideCost ?? 0),

                blackAndWhiteDoubleSideCost:
                    String(pricing.blackAndWhiteDoubleSideCost ?? 0),

                colourSingleSideCost:
                    String(pricing.colourSingleSideCost ?? 0),

                colourDoubleSideCost:
                    String(pricing.colourDoubleSideCost ?? 0)
            })
        } catch {
            setPricingExists(false)
            setPricingForm(emptyPricing)
        }
    }

    // =====================================================
    // STORE FORM HANDLERS
    // =====================================================

    const handleStoreChange = (event) => {
        const { name, value } = event.target

        setStoreForm(previous => ({
            ...previous,
            [name]: value
        }))
    }

    const handlePricingChange = (event) => {
        const { name, value } = event.target

        setPricingForm(previous => ({
            ...previous,
            [name]: value
        }))
    }

    // =====================================================
    // RESET STORE FORM
    // =====================================================

    const resetStoreForm = () => {
        setStoreForm(emptyStore)
        setEditingStore(false)
        setSelectedStore(null)
        setPictureFile(null)
        setPicturePreview('')
        setPricingForm(emptyPricing)
        setPricingExists(false)

        setActiveView('stores')
        setError('')
        setSuccess('')
    }

    // =====================================================
    // CREATE / UPDATE STORE
    // =====================================================

    const handleStoreSubmit = async (event) => {
        event.preventDefault()

        setSavingStore(true)
        setError('')
        setSuccess('')

        try {
            const payload = {
                ...storeForm,
                openingTime: `${storeForm.openingTime}:00`,
                closingTime: `${storeForm.closingTime}:00`
            }

            const saved = await apiRequest(
                editingStore
                    ? `/api/seller/stores/${selectedStore.id}`
                    : '/api/seller/stores',
                {
                    method: editingStore ? 'PUT' : 'POST',
                    body: JSON.stringify(payload)
                }
            )

            const updated = editingStore
                ? stores.map(store =>
                    store.id === saved.id ? saved : store
                )
                : [...stores, saved]

            setStores(updated)
            setSelectedStore(saved)
            setEditingStore(false)

            await selectStore(saved)

            showSuccess(
                editingStore
                    ? 'Store details updated.'
                    : 'Store created. Now set its pricing and upload a picture.'
            )
        } catch (err) {
            showError(err.message)
        } finally {
            setSavingStore(false)
        }
    }

    // =====================================================
    // SAVE STORE PRICING
    // =====================================================

    const handlePricingSubmit = async (event) => {
        event.preventDefault()

        if (!selectedStore) return

        setSavingPricing(true)
        setError('')
        setSuccess('')

        try {
            const payload = Object.fromEntries(
                Object.entries(pricingForm).map(([key, value]) => [
                    key,
                    Number(value)
                ])
            )

            await apiRequest(
                `/api/seller/stores/${selectedStore.id}/pricing`,
                {
                    method: pricingExists ? 'PUT' : 'POST',
                    body: JSON.stringify(payload)
                }
            )

            setPricingExists(true)

            showSuccess(
                pricingExists
                    ? 'Store pricing updated.'
                    : 'Store pricing saved.'
            )
        } catch (err) {
            showError(err.message)
        } finally {
            setSavingPricing(false)
        }
    }

    // =====================================================
    // STORE PICTURE HANDLERS
    // =====================================================

    const handlePictureSelect = (event) => {
        const file = event.target.files?.[0]

        if (!file) return

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            showError('Please choose a JPG or PNG image.')
            event.target.value = ''
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            showError('Image size must be 5 MB or less.')
            event.target.value = ''
            return
        }

        setPictureFile(file)
        setPicturePreview(URL.createObjectURL(file))
        setError('')
        setSuccess('')
    }

    const handlePictureUpload = async () => {
        if (!selectedStore || !pictureFile) return

        setUploadingPicture(true)
        setError('')
        setSuccess('')

        try {
            const formData = new FormData()
            formData.append('picture', pictureFile)

            await apiRequest(
                `/api/seller/stores/${selectedStore.id}/picture`,
                {
                    method: 'POST',
                    body: formData
                }
            )

            setPictureFile(null)

            const refreshed = await apiRequest(
                `/api/seller/stores/${selectedStore.id}`
            )

            setStores(previous =>
                previous.map(store =>
                    store.id === refreshed.id ? refreshed : store
                )
            )

            setSelectedStore(refreshed)

            await loadStorePicture(refreshed)

            showSuccess('Store picture uploaded successfully.')
        } catch (err) {
            showError(err.message)
        } finally {
            setUploadingPicture(false)
        }
    }

    // =====================================================
    // DELETE STORE
    // =====================================================

    const handleDeleteStore = async () => {
        if (!selectedStore) return

        if (!window.confirm(
            `Delete "${selectedStore.name}"? This cannot be undone.`
        )) return

        try {
            await apiRequest(
                `/api/seller/stores/${selectedStore.id}`,
                { method: 'DELETE' }
            )

            const remaining = stores.filter(
                store => store.id !== selectedStore.id
            )

            setStores(remaining)
            resetStoreForm()

            if (remaining.length > 0) {
                await selectStore(remaining[0])
            }

            showSuccess('Store deleted.')
        } catch (err) {
            showError(err.message)
        }
    }

    // =====================================================
    // EDIT STORE
    // =====================================================

    const startEditing = () => {
        if (!selectedStore) return

        setEditingStore(true)

        setStoreForm({
            name: selectedStore.name || '',
            location: selectedStore.location || '',
            email: selectedStore.email || '',
            phoneNumber: selectedStore.phoneNumber || '',
            description: selectedStore.description || '',
            openingTime: selectedStore.openingTime?.slice(0, 5) || '09:00',
            closingTime: selectedStore.closingTime?.slice(0, 5) || '18:00'
        })
    }

    // =====================================================
    // LOADING SCREEN
    // =====================================================

    if (loading) {
        return (
            <div className="seller-loading">
                <img src="/logo.svg" alt="PrintHub Logo" style={{ width: 48, height: 48, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }} />
                <span className="loading-spinner" />
                <span>Loading your stores...</span>
            </div>
        )
    }

    // =====================================================
    // SELLER DASHBOARD
    // =====================================================

    return (
        <div className="seller-page">

            {/* TOP NAVIGATION */}

            <header className="seller-topbar">

                <a
                    className="seller-brand"
                    href="/"
                    aria-label="PrintHub home"
                >
                    <img src="/logo.svg" alt="PrintHub Logo" className="seller-brand-icon" />
                    <span>Print<span>Hub</span></span>
                </a>

                <div className="seller-user">

                    <NotificationCenter
                        role="SELLER"
                        userKey={user.id || user.username}
                        onOpenOrders={() => {
                            setActiveView('orders')
                            setNewOrderCount(0)
                            setError('')
                            setSuccess('')
                        }}
                    />

                    <div>
                        <strong>{user.username}</strong>
                        <small>Seller account</small>
                    </div>

                    <button
                        className="logout-button"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
                </div>

            </header>

            <main className="seller-main">

                {/* WELCOME SECTION */}

                <section className="seller-welcome">

                    <div>
                        <p className="eyebrow">SELLER WORKSPACE</p>

                        <h1>
                            Manage your print store
                        </h1>

                        <p>
                            Create your store, configure print prices and add
                            a picture customers can recognise.
                        </p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={resetStoreForm}
                    >
                        ＋ Add a store
                    </button>

                </section>

                {/* GLOBAL ALERTS */}

                {(error || success) && (
                    <div
                        className={`seller-alert ${
                            error
                                ? 'seller-alert-error'
                                : 'seller-alert-success'
                        }`}
                    >
                        {error || success}
                    </div>
                )}

                {/* DASHBOARD NAVIGATION */}

                <div className="seller-view-tabs">

                    <button
                        type="button"
                        className={
                            activeView === 'stores' ? 'active' : ''
                        }
                        onClick={() => {
                            setActiveView('stores')
                            setError('')
                            setSuccess('')
                        }}
                    >
                        Store Management
                    </button>

                    <button
                        type="button"
                        className={
                            activeView === 'orders' ? 'active' : ''
                        }
                        onClick={() => {
                            setActiveView('orders')

                            // Clear the unread badge when seller opens orders.
                            setNewOrderCount(0)

                            setError('')
                            setSuccess('')
                        }}
                    >
                        <span className="seller-orders-nav-label">
                            Incoming Orders

                            {newOrderCount > 0 && (
                                <span className="seller-new-order-badge">
                                    {newOrderCount > 99 ? '99+' : newOrderCount}
                                </span>
                            )}
                        </span>
                    </button>

                </div>

                {/* SWITCH BETWEEN DASHBOARD VIEWS */}

                {activeView === 'orders' ? (

                    <SellerOrders apiRequest={apiRequest} />

                ) : (

                    /* =================================================
                       STORE MANAGEMENT
                    ================================================= */

                    <div className="seller-layout">

                        {/* STORE SIDEBAR */}

                        <aside className="store-sidebar">

                            <div className="section-heading">
                                <div>
                                    <h2>Your stores</h2>

                                    <span>
                                        {stores.length}{' '}
                                        {stores.length === 1
                                            ? 'store'
                                            : 'stores'}
                                    </span>
                                </div>
                            </div>

                            {stores.length === 0 ? (

                                <div className="empty-stores">

                                    <div className="empty-icon">
                                        ⌂
                                    </div>

                                    <strong>No stores yet</strong>

                                    <p>
                                        Add your first print store to get started.
                                    </p>

                                </div>

                            ) : (

                                <div className="store-list">

                                    {stores.map(store => (

                                        <button
                                            key={store.id}
                                            className={`store-list-item ${
                                                selectedStore?.id === store.id
                                                    ? 'selected'
                                                    : ''
                                            }`}
                                            onClick={() => {
                                                setError('')
                                                setSuccess('')
                                                setEditingStore(false)
                                                selectStore(store)
                                            }}
                                        >

                                            <span className="store-avatar">
                                                {store.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || 'S'}
                                            </span>

                                            <span className="store-list-copy">
                                                <strong>{store.name}</strong>
                                                <small>{store.location}</small>
                                            </span>

                                            <span className="store-chevron">
                                                ›
                                            </span>

                                        </button>

                                    ))}

                                </div>

                            )}

                        </aside>

                        {/* STORE MANAGEMENT CONTENT */}

                        <section className="seller-content">

                            {/* STORE DETAILS PANEL */}

                            <div className="panel">

                                <div className="panel-heading">

                                    <div>
                                        <p className="eyebrow">
                                            STORE DETAILS
                                        </p>

                                        <h2>
                                            {selectedStore
                                                ? editingStore
                                                    ? 'Edit store'
                                                    : selectedStore.name
                                                : 'Create your store'}
                                        </h2>
                                    </div>

                                    {selectedStore && !editingStore && (

                                        <button
                                            className="secondary-button"
                                            onClick={startEditing}
                                        >
                                            Edit details
                                        </button>

                                    )}

                                </div>

                                <form onSubmit={handleStoreSubmit}>

                                    <div className="seller-form-grid">

                                        <label className="seller-field">
                                            <span>Store name *</span>

                                            <input
                                                name="name"
                                                value={storeForm.name}
                                                onChange={handleStoreChange}
                                                placeholder="e.g. A1 Prints"
                                                required
                                            />
                                        </label>

                                        <label className="seller-field">
                                            <span>Location / Address *</span>

                                            <input
                                                name="location"
                                                value={storeForm.location}
                                                onChange={handleStoreChange}
                                                placeholder="Street, area, city"
                                                required
                                            />
                                        </label>

                                        <label className="seller-field">
                                            <span>Store email *</span>

                                            <input
                                                type="email"
                                                name="email"
                                                value={storeForm.email}
                                                onChange={handleStoreChange}
                                                placeholder="store@example.com"
                                                required
                                            />
                                        </label>

                                        <label className="seller-field">
                                            <span>Phone number *</span>

                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={storeForm.phoneNumber}
                                                onChange={handleStoreChange}
                                                placeholder="Contact number"
                                                required
                                            />
                                        </label>

                                        <label className="seller-field">
                                            <span>Opening time *</span>

                                            <input
                                                type="time"
                                                name="openingTime"
                                                value={storeForm.openingTime}
                                                onChange={handleStoreChange}
                                                required
                                            />
                                        </label>

                                        <label className="seller-field">
                                            <span>Closing time *</span>

                                            <input
                                                type="time"
                                                name="closingTime"
                                                value={storeForm.closingTime}
                                                onChange={handleStoreChange}
                                                required
                                            />
                                        </label>

                                        <label className="seller-field seller-field-wide">
                                            <span>Description</span>

                                            <textarea
                                                name="description"
                                                value={storeForm.description}
                                                onChange={handleStoreChange}
                                                placeholder="Tell customers about your store and printing services."
                                                rows="3"
                                            />
                                        </label>

                                    </div>

                                    <div className="form-actions">

                                        {editingStore && (

                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={() => {
                                                    setEditingStore(false)

                                                    if (selectedStore) {
                                                        selectStore(selectedStore)
                                                    }
                                                }}
                                            >
                                                Cancel
                                            </button>

                                        )}

                                        <button
                                            type="submit"
                                            className="primary-button"
                                            disabled={savingStore}
                                        >
                                            {savingStore
                                                ? 'Saving...'
                                                : editingStore
                                                    ? 'Save changes'
                                                    : 'Create store'}
                                        </button>

                                    </div>

                                </form>

                            </div>

                            {/* STORE PICTURE PANEL */}

                            {selectedStore && !editingStore && (

                                <>

                                    <div className="panel">

                                        <div className="panel-heading">

                                            <div>
                                                <p className="eyebrow">
                                                    STORE IMAGE
                                                </p>

                                                <h2>
                                                    Main store picture
                                                </h2>

                                                <p className="panel-subtitle">
                                                    Upload one JPG or PNG image,
                                                    up to 5 MB.
                                                </p>
                                            </div>

                                        </div>

                                        <div className="picture-upload-area">

                                            <div className="picture-preview">

                                                {picturePreview ? (

                                                    <img
                                                        src={picturePreview}
                                                        alt={`${selectedStore.name} store`}
                                                    />

                                                ) : (

                                                    <div className="picture-placeholder">
                                                        <span>▧</span>
                                                        <small>
                                                            Store picture preview
                                                        </small>
                                                    </div>

                                                )}

                                            </div>

                                            <div className="picture-controls">

                                                <label className="file-picker">
                                                    Choose image

                                                    <input
                                                        type="file"
                                                        accept="image/png,image/jpeg"
                                                        onChange={handlePictureSelect}
                                                    />
                                                </label>

                                                <p>
                                                    {pictureFile
                                                        ? pictureFile.name
                                                        : 'No new image selected'}
                                                </p>

                                                <button
                                                    className="primary-button"
                                                    onClick={handlePictureUpload}
                                                    disabled={
                                                        !pictureFile ||
                                                        uploadingPicture
                                                    }
                                                >
                                                    {uploadingPicture
                                                        ? 'Uploading...'
                                                        : 'Upload picture'}
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                    {/* STORE PRICING PANEL */}

                                    <div className="panel">

                                        <div className="panel-heading">

                                            <div>
                                                <p className="eyebrow">
                                                    PRINT SERVICES
                                                </p>

                                                <h2>
                                                    Store pricing
                                                </h2>

                                                <p className="panel-subtitle">
                                                    Enter the amount you charge
                                                    in Indian rupees (₹).
                                                </p>
                                            </div>

                                            <span
                                                className={`pricing-status ${
                                                    pricingExists ? 'is-set' : ''
                                                }`}
                                            >
                                                {pricingExists
                                                    ? 'Pricing configured'
                                                    : 'Not configured'}
                                            </span>

                                        </div>

                                        <form onSubmit={handlePricingSubmit}>

                                            <div className="pricing-grid">

                                                <label className="seller-field">

                                                    <span>
                                                        Binding cost (₹)
                                                    </span>

                                                    <div className="price-input">
                                                        <b>₹</b>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            name="bindingCost"
                                                            value={pricingForm.bindingCost}
                                                            onChange={handlePricingChange}
                                                            required
                                                        />
                                                    </div>

                                                </label>

                                                <label className="seller-field">

                                                    <span>
                                                        B/W · Single side (₹)
                                                    </span>

                                                    <div className="price-input">
                                                        <b>₹</b>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            name="blackAndWhiteSingleSideCost"
                                                            value={pricingForm.blackAndWhiteSingleSideCost}
                                                            onChange={handlePricingChange}
                                                            required
                                                        />
                                                    </div>

                                                </label>

                                                <label className="seller-field">

                                                    <span>
                                                        B/W · Double side (₹)
                                                    </span>

                                                    <div className="price-input">
                                                        <b>₹</b>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            name="blackAndWhiteDoubleSideCost"
                                                            value={pricingForm.blackAndWhiteDoubleSideCost}
                                                            onChange={handlePricingChange}
                                                            required
                                                        />
                                                    </div>

                                                </label>

                                                <label className="seller-field">

                                                    <span>
                                                        Colour · Single side (₹)
                                                    </span>

                                                    <div className="price-input">
                                                        <b>₹</b>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            name="colourSingleSideCost"
                                                            value={pricingForm.colourSingleSideCost}
                                                            onChange={handlePricingChange}
                                                            required
                                                        />
                                                    </div>

                                                </label>

                                                <label className="seller-field">

                                                    <span>
                                                        Colour · Double side (₹)
                                                    </span>

                                                    <div className="price-input">
                                                        <b>₹</b>

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            name="colourDoubleSideCost"
                                                            value={pricingForm.colourDoubleSideCost}
                                                            onChange={handlePricingChange}
                                                            required
                                                        />
                                                    </div>

                                                </label>

                                            </div>

                                            <div className="form-actions">

                                                <button
                                                    type="submit"
                                                    className="primary-button"
                                                    disabled={savingPricing}
                                                >
                                                    {savingPricing
                                                        ? 'Saving...'
                                                        : pricingExists
                                                            ? 'Update pricing'
                                                            : 'Save pricing'}
                                                </button>

                                            </div>

                                        </form>

                                    </div>

                                    {/* DELETE STORE */}

                                    <div className="danger-zone">

                                        <div>
                                            <strong>
                                                Delete this store
                                            </strong>

                                            <p>
                                                Deleting a store cannot be undone.
                                            </p>
                                        </div>

                                        <button
                                            className="danger-button"
                                            onClick={handleDeleteStore}
                                        >
                                            Delete store
                                        </button>

                                    </div>

                                </>

                            )}

                        </section>

                    </div>

                )}

            </main>

        </div>
    )
}

export default SellerDashboard