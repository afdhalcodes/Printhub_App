
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
    apiRequest
}) {
    const [form, setForm] = useState(emptyForm)
    const [document, setDocument] = useState(null)
    const [orders, setOrders] = useState([])

    const [loadingOrders, setLoadingOrders] = useState(true)
    const [placingOrder, setPlacingOrder] = useState(false)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [latestOrder, setLatestOrder] = useState(null)

    const loadOrders = async () => {
        setLoadingOrders(true)

        try {
            const data = await apiRequest('/api/buyer/orders')
            setOrders(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoadingOrders(false)
        }
    }

    useEffect(() => {
        loadOrders()

        // Load buyer orders when this component opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleFormChange = (event) => {
        const { name, value } = event.target

        setForm(previous => ({
            ...previous,
            [name]: value
        }))
    }

    const handleDocumentSelect = (event) => {
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

    const handlePlaceOrder = async (event) => {
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

        } catch (err) {
            setError(err.message)
        } finally {
            setPlacingOrder(false)
        }
    }

    const handleCancelOrder = async (orderId) => {
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

    const statusClass = (status) => {
        return `buyer-order-status status-${status?.toLowerCase()}`
    }

    const storeOrders = orders.filter(
        order => order.storeId === storeId
    )

    return (
        <section className="buyer-order-section">

            <div className="buyer-order-heading">
                <div>
                    <p className="buyer-eyebrow">ONLINE PRINTING</p>
                    <h2>Place a print order</h2>
                    <p>
                        Upload your PDF and configure how you want
                        {` ${storeName}`} to print it.
                    </p>
                </div>

                <span className="buyer-order-icon">▤</span>
            </div>

            {error && (
                <div className="buyer-order-alert error">
                    {error}
                    <button onClick={() => setError('')}>×</button>
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
                    <span>Maximum 20 MB · PDF only</span>
                </div>

                <label className="buyer-document-upload">
                    <input
                        id={`buyer-order-file-${storeId}`}
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleDocumentSelect}
                    />

                    <span className="buyer-upload-icon">↑</span>

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
                            <option value="false">No binding</option>
                            <option value="true">Include binding</option>
                        </select>
                    </label>

                </div>

                <div className="buyer-order-information">
                    <div>
                        <strong>How is the price calculated?</strong>
                        <p>
                            Our backend extracts the PDF page count
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
                    <div className="buyer-confirmation-icon">✓</div>

                    <div>
                        <span>ORDER #{latestOrder.id} CONFIRMED</span>
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

            <div className="buyer-order-history">
                <div className="buyer-order-history-heading">
                    <div>
                        <p className="buyer-eyebrow">YOUR ACTIVITY</p>
                        <h2>Orders at this shop</h2>
                    </div>

                    <button
                        type="button"
                        onClick={loadOrders}
                        disabled={loadingOrders}
                    >
                        {loadingOrders ? 'Loading...' : '↻ Refresh'}
                    </button>
                </div>

                {loadingOrders ? (
                    <div className="buyer-order-empty">
                        Loading your orders...
                    </div>
                ) : storeOrders.length === 0 ? (
                    <div className="buyer-order-empty">
                        You haven't placed any orders at this shop yet.
                    </div>
                ) : (
                    <div className="buyer-order-list">
                        {storeOrders.map(order => (
                            <article
                                className="buyer-order-card"
                                key={order.id}
                            >
                                <div className="buyer-order-card-top">
                                    <div>
                                        <strong>Order #{order.id}</strong>
                                        <small>{order.documentName}</small>
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
                                </div>

                                <div className="buyer-order-card-bottom">
                                    <div>
                                        <strong>
                                            {formatPrice(order.totalPrice)}
                                        </strong>
                                        <small>{formatDate(order.createdAt)}</small>
                                    </div>

                                    {order.status === 'PLACED' && (
                                        <button
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
