import { useEffect, useState } from 'react'
import './BuyerOrderSection.css'

const emptyForm = {
    printType: 'BLACK_AND_WHITE',
    printSide: 'SINGLE_SIDE',
    copies: 1,
    bindingRequired: 'false'
}

function formatPrice(value) {
    if (value === null || value === undefined) return '—'
    return `₹${Number(value).toFixed(2)}`
}

function formatDate(value) {
    if (!value) return '—'

    return new Date(value).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    })
}

function BuyerOrderSection({
    storeId,
    storeName,
    pricing,
    apiRequest,
    mode = 'store'
}) {

    const isAllOrdersMode = mode === 'all'

    const [form, setForm] = useState(emptyForm)
    const [document, setDocument] = useState(null)
    const [orders, setOrders] = useState([])

    const [loadingOrders, setLoadingOrders] = useState(true)
    const [placingOrder, setPlacingOrder] = useState(false)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [latestOrder, setLatestOrder] = useState(null)

    const [orderFilter, setOrderFilter] = useState('ONGOING')

    // Order card that was just updated live (gets a short highlight).
    const [flashOrderId, setFlashOrderId] = useState(null)

    // =====================================================
    // LOAD ALL BUYER ORDERS
    // =====================================================

    // silent = true refreshes the list in the background without
    // showing the loading state or any error message.
    const loadOrders = async (silent = false) => {

        if (!silent) {
            setLoadingOrders(true)
            setError('')
        }

        try {

            const data = await apiRequest('/api/buyer/orders')

            setOrders(Array.isArray(data) ? data : [])

        } catch (err) {

            if (!silent) {
                setError(err.message)
            }

        } finally {

            if (!silent) {
                setLoadingOrders(false)
            }
        }
    }

    useEffect(() => {

        loadOrders()

        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, [])

    // =====================================================
    // LIVE ORDER UPDATES (NO REFRESH NEEDED)
    // =====================================================

    useEffect(() => {

        // The notification bell receives the server event and
        // forwards the updated order here.
        const handleOrderUpdated = event => {

            const updatedOrder = event.detail

            if (!updatedOrder?.id) return

            setOrders(previousOrders => {

                const exists = previousOrders.some(
                    order => order.id === updatedOrder.id
                )

                if (exists) {

                    return previousOrders.map(order =>
                        order.id === updatedOrder.id
                            ? updatedOrder
                            : order
                    )
                }

                return [updatedOrder, ...previousOrders]
            })

            // Highlight the card that just changed.
            setFlashOrderId(updatedOrder.id)

            // A printed order leaves the "Ongoing" tab, so move the
            // buyer to "Ready for collection" instead of making the
            // order seem to disappear.
            if (updatedOrder.status === 'PRINTED') {

                setOrderFilter(previous =>
                    previous === 'ONGOING' ? 'READY' : previous
                )

                if (
                    storeId &&
                    Number(updatedOrder.storeId) === Number(storeId)
                ) {
                    setSuccess(
                        `Order #${updatedOrder.id} is ready for collection!`
                    )

                    setError('')
                }
            }
        }

        // Events sent while the connection was down are lost,
        // so reload the list quietly when it comes back.
        const handleReconnected = () => {
            loadOrders(true)
        }

        // Reload when the buyer returns to this browser tab.
        const handleVisibility = () => {
            if (window.document.visibilityState === 'visible') {
                loadOrders(true)
            }
        }

        window.addEventListener(
            'printhub:order-updated',
            handleOrderUpdated
        )

        window.addEventListener(
            'printhub:notifications-reconnected',
            handleReconnected
        )

        window.document.addEventListener(
            'visibilitychange',
            handleVisibility
        )

        // Safety net: even if the live connection is blocked by a
        // proxy or network, the list still refreshes by itself.
        const poller = setInterval(() => {
            if (window.document.visibilityState === 'visible') {
                loadOrders(true)
            }
        }, 30000)

        return () => {

            window.removeEventListener(
                'printhub:order-updated',
                handleOrderUpdated
            )

            window.removeEventListener(
                'printhub:notifications-reconnected',
                handleReconnected
            )

            window.document.removeEventListener(
                'visibilitychange',
                handleVisibility
            )

            clearInterval(poller)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, [storeId])

    // Remove the highlight after a few seconds.
    useEffect(() => {

        if (!flashOrderId) return

        const timer = setTimeout(() => setFlashOrderId(null), 3000)

        return () => clearTimeout(timer)

    }, [flashOrderId])

    // =====================================================
    // FORM INPUT HANDLING
    // =====================================================

    const handleFormChange = event => {

        const { name, value } = event.target

        setForm(previous => ({
            ...previous,
            [name]: value
        }))
    }

    // =====================================================
    // PDF SELECTION
    // =====================================================

    const handleDocumentSelect = event => {

        const file = event.target.files?.[0]

        setError('')
        setSuccess('')
        setLatestOrder(null)

        if (!file) {
            setDocument(null)
            return
        }

        if (
            !file.name.toLowerCase().endsWith('.pdf') ||
            (file.type && file.type !== 'application/pdf')
        ) {

            setError('Please select a valid PDF document.')
            event.target.value = ''
            setDocument(null)
            return
        }

        if (file.size > 20 * 1024 * 1024) {

            setError('PDF size must not exceed 20 MB.')
            event.target.value = ''
            setDocument(null)
            return
        }

        setDocument(file)
    }

    // =====================================================
    // PLACE ORDER
    // =====================================================

    const handlePlaceOrder = async event => {

        event.preventDefault()

        setError('')
        setSuccess('')
        setLatestOrder(null)

        if (!pricing) {
            setError('This shop has not configured its pricing.')
            return
        }

        if (!document) {
            setError('Please upload a PDF document.')
            return
        }

        if (
            Number(form.copies) < 1 ||
            Number(form.copies) > 20
        ) {

            setError('Copies must be between 1 and 20.')
            return
        }

        const formData = new FormData()

        formData.append('storeId', String(storeId))
        formData.append('document', document)
        formData.append('printType', form.printType)
        formData.append('printSide', form.printSide)
        formData.append('copies', String(form.copies))
        formData.append('bindingRequired', form.bindingRequired)

        setPlacingOrder(true)

        try {

            const order = await apiRequest(
                '/api/buyer/orders',
                {
                    method: 'POST',
                    body: formData
                }
            )

            setLatestOrder(order)

            setSuccess(
                `Order #${order.id} placed successfully!`
            )

            setForm(emptyForm)
            setDocument(null)

            const fileInput = window.document.getElementById(
                `buyer-order-file-${storeId}`
            )

            if (fileInput) {
                fileInput.value = ''
            }

            await loadOrders()

            // Tell the dashboard that a new order was placed.
            window.dispatchEvent(
                new CustomEvent('printhub:order-placed', {
                    detail: order
                })
            )

        } catch (err) {

            setError(err.message)

        } finally {

            setPlacingOrder(false)
        }
    }

    // =====================================================
    // CANCEL ORDER
    // =====================================================

    const handleCancelOrder = async orderId => {

        if (!window.confirm(
            `Are you sure you want to cancel order #${orderId}?`
        )) {
            return
        }

        setError('')
        setSuccess('')

        try {

            await apiRequest(
                `/api/buyer/orders/${orderId}/cancel`,
                {
                    method: 'PATCH'
                }
            )

            setSuccess(`Order #${orderId} cancelled.`)

            await loadOrders()

        } catch (err) {

            setError(err.message)
        }
    }

    // =====================================================
    // FILTER ORDERS
    // =====================================================

    const storeOrders = storeId
        ? orders.filter(order =>
            Number(order.storeId) === Number(storeId)
        )
        : orders

    const ongoingOrders = storeOrders.filter(order =>
        ['PLACED', 'PRINTING'].includes(order.status)
    )

    const readyOrders = storeOrders.filter(
        order => order.status === 'PRINTED'
    )

    const completedOrders = storeOrders.filter(
        order => ['COLLECTED', 'CANCELLED'].includes(order.status)
    )

    const filteredOrders = (() => {

        switch (orderFilter) {

            case 'ONGOING':
                return ongoingOrders

            case 'READY':
                return readyOrders

            case 'COMPLETED':
                return completedOrders

            case 'ALL':
            default:
                return storeOrders
        }

    })()

    // =====================================================
    // STATUS DISPLAY
    // =====================================================

    const statusClass = status =>
        `buyer-order-status status-${status?.toLowerCase()}`

    const getStatusMessage = status => {

        switch (status) {

            case 'PLACED':
                return 'Your request has been sent to the shop.'

            case 'PRINTING':
                return 'The shop is currently printing your document.'

            case 'PRINTED':
                return 'Your print is ready. Please collect it from the shop.'

            case 'COLLECTED':
                return 'You have collected this order.'

            case 'CANCELLED':
                return 'This order has been cancelled.'

            default:
                return ''
        }
    }

    // =====================================================
    // UI
    // =====================================================

    return (

        <section className="buyer-order-section">

            {/* ORDER FORM - ONLY IN STORE MODE */}

            {!isAllOrdersMode && (

                <>

                    <div className="buyer-order-heading">

                        <div>

                            <p className="buyer-eyebrow">
                                ONLINE PRINTING
                            </p>

                            <h2>Place a print order</h2>

                            <p>
                                Upload your PDF and configure how you want
                                {` ${storeName}`} to print it.
                            </p>

                        </div>

                        <span className="buyer-order-icon">
                            ▤
                        </span>

                    </div>

                    {error && (
                        <div className="buyer-order-alert error">
                            {error}

                            <button
                                type="button"
                                onClick={() => setError('')}
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {success && (
                        <div className="buyer-order-alert success">
                            {success}
                        </div>
                    )}

                    <form
                        className="buyer-order-form"
                        onSubmit={handlePlaceOrder}
                    >

                        <div className="buyer-order-form-heading">

                            <h3>Document details</h3>

                            <span>
                                Maximum 20 MB · PDF only
                            </span>

                        </div>

                        <label className="buyer-document-upload">

                            <input
                                id={`buyer-order-file-${storeId}`}
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleDocumentSelect}
                            />

                            <span className="buyer-upload-icon">
                                ↑
                            </span>

                            <strong>
                                {document
                                    ? document.name
                                    : 'Choose your PDF document'}
                            </strong>

                            <small>
                                {document
                                    ? `${(document.size / (1024 * 1024)).toFixed(2)} MB`
                                    : 'Click here to select a PDF file'}
                            </small>

                        </label>

                        <div className="buyer-order-fields">

                            <label>
                                <span>Print type</span>

                                <select
                                    name="printType"
                                    value={form.printType}
                                    onChange={handleFormChange}
                                >
                                    <option value="BLACK_AND_WHITE">
                                        Black & White
                                    </option>

                                    <option value="COLOUR">
                                        Colour
                                    </option>
                                </select>
                            </label>

                            <label>
                                <span>Printing side</span>

                                <select
                                    name="printSide"
                                    value={form.printSide}
                                    onChange={handleFormChange}
                                >
                                    <option value="SINGLE_SIDE">
                                        Single-sided
                                    </option>

                                    <option value="DOUBLE_SIDE">
                                        Double-sided
                                    </option>
                                </select>
                            </label>

                            <label>
                                <span>Number of copies</span>

                                <input
                                    type="number"
                                    name="copies"
                                    min="1"
                                    max="20"
                                    value={form.copies}
                                    onChange={handleFormChange}
                                    required
                                />
                            </label>

                            <label>
                                <span>Binding</span>

                                <select
                                    name="bindingRequired"
                                    value={form.bindingRequired}
                                    onChange={handleFormChange}
                                >
                                    <option value="false">
                                        No binding
                                    </option>

                                    <option value="true">
                                        Include binding
                                    </option>
                                </select>
                            </label>

                        </div>

                        <div className="buyer-order-information">

                            <div>
                                <strong>
                                    How is the price calculated?
                                </strong>

                                <p>
                                    The backend extracts the PDF page count
                                    and calculates the final price using
                                    this shop's configured rates.
                                </p>
                            </div>

                            <div className="buyer-order-price-note">
                                <span>Shop binding rate</span>

                                <strong>
                                    {formatPrice(pricing?.bindingCost)}
                                </strong>
                            </div>

                        </div>

                        <button
                            type="submit"
                            className="buyer-place-order-button"
                            disabled={placingOrder || !pricing}
                        >
                            {placingOrder
                                ? 'Uploading and calculating...'
                                : 'Upload PDF & Place Order →'}
                        </button>

                    </form>

                    {latestOrder && (

                        <div className="buyer-order-confirmation">

                            <div className="buyer-confirmation-icon">
                                ✓
                            </div>

                            <div>

                                <span>
                                    ORDER #{latestOrder.id} CONFIRMED
                                </span>

                                <h3>
                                    {formatPrice(latestOrder.totalPrice)}
                                </h3>

                                <p>
                                    {latestOrder.totalPages} pages ·
                                    {' '}{latestOrder.copies} copies ·
                                    {' '}{latestOrder.sheetsPerCopy} sheets per copy
                                </p>

                                <p>
                                    Your order has been sent to {latestOrder.storeName}.
                                </p>

                            </div>

                        </div>

                    )}

                </>
            )}

            {/* =================================================
                ORDER HISTORY
            ================================================= */}

            <div className="buyer-order-history">

                <div className="buyer-order-history-heading">

                    <div>

                        <p className="buyer-eyebrow">
                            {isAllOrdersMode ? 'YOUR ACTIVITY' : 'SHOP ACTIVITY'}
                        </p>

                        <h2>
                            {isAllOrdersMode
                                ? 'Your print orders'
                                : 'Orders at this shop'}
                        </h2>

                        <p>
                            Track the progress of your print requests.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() => loadOrders()}
                        disabled={loadingOrders}
                    >
                        {loadingOrders ? 'Loading...' : '↻ Refresh'}
                    </button>

                </div>

                {/* FILTER TABS */}

                <div className="buyer-order-filters">

                    {[
                        { value: 'ONGOING', label: 'Ongoing', count: ongoingOrders.length },
                        { value: 'READY', label: 'Ready for collection', count: readyOrders.length },
                        { value: 'COMPLETED', label: 'Completed', count: completedOrders.length },
                        { value: 'ALL', label: 'All orders', count: storeOrders.length }
                    ].map(filter => (

                        <button
                            type="button"
                            key={filter.value}
                            className={orderFilter === filter.value ? 'active' : ''}
                            onClick={() => setOrderFilter(filter.value)}
                        >
                            {filter.label}
                            <span>{filter.count}</span>
                        </button>

                    ))}

                </div>

                {error && isAllOrdersMode && (
                    <div className="buyer-order-alert error">
                        {error}
                    </div>
                )}

                {success && isAllOrdersMode && (
                    <div className="buyer-order-alert success">
                        {success}
                    </div>
                )}

                {loadingOrders ? (

                    <div className="buyer-order-empty">
                        Loading your orders...
                    </div>

                ) : filteredOrders.length === 0 ? (

                    <div className="buyer-order-empty">

                        <span>▤</span>

                        <h3>
                            {orderFilter === 'ONGOING'
                                ? 'No ongoing orders'
                                : orderFilter === 'READY'
                                    ? 'No orders ready for collection'
                                    : orderFilter === 'COMPLETED'
                                        ? 'No completed orders'
                                        : 'No orders yet'}
                        </h3>

                        <p>
                            {orderFilter === 'ONGOING'
                                ? 'Your active print requests will appear here.'
                                : 'Your print orders will appear here.'}
                        </p>

                    </div>

                ) : (

                    <div className="buyer-order-list">

                        {filteredOrders.map(order => (

                            <article
                                className={`buyer-order-card ${order.status === 'PRINTED' ? 'order-ready' : ''} ${flashOrderId === order.id ? 'ph-flash' : ''}`}
                                key={order.id}
                            >

                                <div className="buyer-order-card-top">

                                    <div>
                                        <strong>
                                            Order #{order.id}
                                        </strong>

                                        <small>
                                            {order.documentName}
                                        </small>

                                        <small className="buyer-order-shop-name">
                                            {order.storeName}
                                        </small>
                                    </div>

                                    <span className={statusClass(order.status)}>
                                        {order.status}
                                    </span>

                                </div>

                                <div className="buyer-order-card-details">

                                    <span>
                                        {order.totalPages} pages
                                    </span>

                                    <span>
                                        {order.copies} copies
                                    </span>

                                    <span>
                                        {order.printType === 'COLOUR'
                                            ? 'Colour'
                                            : 'B/W'}
                                    </span>

                                    <span>
                                        {order.printSide === 'DOUBLE_SIDE'
                                            ? 'Double-sided'
                                            : 'Single-sided'}
                                    </span>

                                    <span>
                                        {order.bindingRequired
                                            ? 'Binding'
                                            : 'No binding'}
                                    </span>

                                </div>

                                {order.status === 'PRINTED' && (

                                    <div className="buyer-order-ready-message">
                                        ✓ Your print is ready. Come and collect it!
                                    </div>

                                )}

                                <p className="buyer-order-status-message">
                                    {getStatusMessage(order.status)}
                                </p>

                                <div className="buyer-order-card-bottom">

                                    <div>
                                        <strong>
                                            {formatPrice(order.totalPrice)}
                                        </strong>

                                        <small>
                                            {formatDate(order.createdAt)}
                                        </small>
                                    </div>

                                    {order.status === 'PLACED' && (

                                        <button
                                            type="button"
                                            className="buyer-cancel-order"
                                            onClick={() =>
                                                handleCancelOrder(order.id)
                                            }
                                        >
                                            Cancel order
                                        </button>

                                    )}

                                </div>

                            </article>

                        ))}

                    </div>

                )}

            </div>

        </section>

    )
}

export default BuyerOrderSection