import { useEffect, useState } from 'react'
import './SellerOrders.css'

const API_BASE_URL = 'http://localhost:8080'

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

function SellerOrders({ apiRequest }) {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [updatingId, setUpdatingId] = useState(null)
    const [downloadingId, setDownloadingId] = useState(null)
    const [filter, setFilter] = useState('ALL')

    // Order card that just arrived or changed (gets a short highlight).
    const [flashOrderId, setFlashOrderId] = useState(null)

    // =====================================================
    // LOAD SELLER ORDERS
    // =====================================================

    // silent = true refreshes in the background without the loading
    // state or any error message.
    const loadOrders = async (silent = false) => {
        if (!silent) {
            setLoading(true)
            setError('')
        }

        try {
            const data = await apiRequest('/api/seller/orders')

            // Merge the API response with any orders received
            // through SSE while the request was running.
            setOrders(previous => {
                const mergedOrders = new Map()

                previous.forEach(order => {
                    mergedOrders.set(order.id, order)
                })

                if (Array.isArray(data)) {
                    data.forEach(order => {
                        mergedOrders.set(order.id, order)
                    })
                }

                return Array.from(mergedOrders.values())
                    .sort((a, b) => b.id - a.id)
            })
        } catch (err) {
            if (!silent) {
                setError(err.message)
            }
        } finally {
            if (!silent) {
                setLoading(false)
            }
        }
    }

    // =====================================================
    // LIVE UPDATES
    // The notification bell in the navbar owns the server
    // connection. It forwards every event to this page.
    // =====================================================

    useEffect(() => {

        loadOrders()

        // A customer placed a new order.
        const handleNewOrder = event => {

            const newOrder = event.detail

            if (!newOrder?.id) return

            setOrders(previous => {

                if (previous.some(order => order.id === newOrder.id)) {
                    return previous
                }

                return [newOrder, ...previous]
            })

            setFlashOrderId(newOrder.id)
            setError('')
        }

        // A customer cancelled an order.
        const handleOrderCancelled = event => {

            const cancelledOrder = event.detail

            if (!cancelledOrder?.id) return

            setOrders(previous => {

                const exists = previous.some(
                    order => order.id === cancelledOrder.id
                )

                if (!exists) {
                    return [cancelledOrder, ...previous]
                }

                return previous.map(order =>
                    order.id === cancelledOrder.id
                        ? cancelledOrder
                        : order
                )
            })

            setFlashOrderId(cancelledOrder.id)
        }

        // Events sent while the connection was down are lost,
        // so reload the list quietly when it comes back.
        const handleReconnected = () => {
            loadOrders(true)
        }

        const handleVisibility = () => {
            if (window.document.visibilityState === 'visible') {
                loadOrders(true)
            }
        }

        window.addEventListener('printhub:new-order', handleNewOrder)
        window.addEventListener('printhub:order-cancelled', handleOrderCancelled)
        window.addEventListener('printhub:notifications-reconnected', handleReconnected)
        window.document.addEventListener('visibilitychange', handleVisibility)

        // Safety net in case the live connection is blocked.
        const poller = setInterval(() => {
            if (window.document.visibilityState === 'visible') {
                loadOrders(true)
            }
        }, 30000)

        return () => {
            window.removeEventListener('printhub:new-order', handleNewOrder)
            window.removeEventListener('printhub:order-cancelled', handleOrderCancelled)
            window.removeEventListener('printhub:notifications-reconnected', handleReconnected)
            window.document.removeEventListener('visibilitychange', handleVisibility)
            clearInterval(poller)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Remove the highlight after a few seconds.
    useEffect(() => {

        if (!flashOrderId) return

        const timer = setTimeout(() => setFlashOrderId(null), 3000)

        return () => clearTimeout(timer)

    }, [flashOrderId])

    // =====================================================
    // DOWNLOAD ORDER DOCUMENT
    // =====================================================

    const handleDownload = async (order) => {
        setDownloadingId(order.id)
        setError('')
        setSuccess('')

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/seller/orders/${order.id}/document`,
                {
                    method: 'GET',
                    credentials: 'include'
                }
            )

            if (!response.ok) {
                let message = 'Unable to download the PDF document.'

                try {
                    const data = await response.json()
                    message = data.message || message
                } catch {
                    // Keep the default message.
                }

                throw new Error(message)
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)

            const link = window.document.createElement('a')
            link.href = url
            link.download = order.documentName || `order-${order.id}.pdf`

            window.document.body.appendChild(link)
            link.click()
            link.remove()

            window.URL.revokeObjectURL(url)

            setSuccess(
                `Document for order #${order.id} downloaded.`
            )
        } catch (err) {
            setError(err.message)
        } finally {
            setDownloadingId(null)
        }
    }

    // =====================================================
    // UPDATE ORDER STATUS
    // =====================================================

    const handleStatusUpdate = async (order, status) => {
        setUpdatingId(order.id)
        setError('')
        setSuccess('')

        try {
            const updated = await apiRequest(
                `/api/seller/orders/${order.id}/status`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ status })
                }
            )

            setOrders(previous =>
                previous.map(item =>
                    item.id === updated.id ? updated : item
                )
            )

            setSuccess(
                `Order #${order.id} updated to ${status}.`
            )
        } catch (err) {
            setError(err.message)
        } finally {
            setUpdatingId(null)
        }
    }

    // =====================================================
    // NEXT STATUS ACTION
    // =====================================================

    const getNextAction = (status) => {
        switch (status) {
            case 'PLACED':
                return {
                    label: 'Start printing',
                    nextStatus: 'PRINTING'
                }

            case 'PRINTING':
                return {
                    label: 'Mark as printed',
                    nextStatus: 'PRINTED'
                }

            case 'PRINTED':
                return {
                    label: 'Mark as collected',
                    nextStatus: 'COLLECTED'
                }

            default:
                return null
        }
    }

    // =====================================================
    // FILTER AND STATISTICS
    // =====================================================

    const filteredOrders = filter === 'ALL'
        ? orders
        : orders.filter(order => order.status === filter)

    const countStatus = (status) => {
        return orders.filter(order => order.status === status).length
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <section className="seller-orders-section">

            <div className="seller-orders-heading">

                <div>
                    <p className="eyebrow">ORDER MANAGEMENT</p>

                    <h2>Incoming print orders</h2>

                    <p>
                        Review customer documents, download PDFs
                        and manage printing progress.
                    </p>
                </div>

                <button
                    className="seller-order-refresh"
                    onClick={() => loadOrders()}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : '↻ Refresh orders'}
                </button>

            </div>

            {error && (
                <div className="seller-order-alert error">
                    {error}
                </div>
            )}

            {success && (
                <div className="seller-order-alert success">
                    {success}
                </div>
            )}

            {/* ORDER STATISTICS */}

            <div className="seller-order-stats">

                <div>
                    <span>Total orders</span>
                    <strong>{orders.length}</strong>
                </div>

                <div>
                    <span>New orders</span>
                    <strong>{countStatus('PLACED')}</strong>
                </div>

                <div>
                    <span>Printing</span>
                    <strong>{countStatus('PRINTING')}</strong>
                </div>

                <div>
                    <span>Ready for pickup</span>
                    <strong>{countStatus('PRINTED')}</strong>
                </div>

            </div>

            {/* ORDER FILTERS */}

            <div className="seller-order-filters">

                {[
                    'ALL',
                    'PLACED',
                    'PRINTING',
                    'PRINTED',
                    'COLLECTED',
                    'CANCELLED'
                ].map(status => (
                    <button
                        key={status}
                        className={filter === status ? 'active' : ''}
                        onClick={() => setFilter(status)}
                    >
                        {status === 'ALL' ? 'All orders' : status}
                    </button>
                ))}

            </div>

            {/* ORDER LIST */}

            {loading ? (

                <div className="seller-order-empty">
                    Loading incoming orders...
                </div>

            ) : filteredOrders.length === 0 ? (

                <div className="seller-order-empty">
                    <span>▤</span>

                    <h3>No orders found</h3>

                    <p>
                        New customer orders will appear here automatically.
                    </p>
                </div>

            ) : (

                <div className="seller-order-list">

                    {filteredOrders.map(order => {

                        const nextAction = getNextAction(order.status)

                        return (

                            <article
                                className={`seller-order-card ${flashOrderId === order.id ? 'ph-flash' : ''}`}
                                key={order.id}
                            >

                                <div className="seller-order-card-header">

                                    <div>
                                        <span className="seller-order-number">
                                            ORDER #{order.id}
                                        </span>

                                        <h3>{order.documentName}</h3>

                                        <p>{order.storeName}</p>
                                    </div>

                                    <span
                                        className={`seller-order-status status-${order.status.toLowerCase()}`}
                                    >
                                        {order.status}
                                    </span>

                                </div>

                                <div className="seller-order-customer">

                                    <div>
                                        <span>Customer</span>
                                        <strong>{order.buyerUsername}</strong>
                                    </div>

                                    <div>
                                        <span>Placed on</span>
                                        <strong>
                                            {formatDate(order.createdAt)}
                                        </strong>
                                    </div>

                                </div>

                                <div className="seller-order-specifications">

                                    <div>
                                        <span>PDF pages</span>
                                        <strong>{order.totalPages}</strong>
                                    </div>

                                    <div>
                                        <span>Copies</span>
                                        <strong>{order.copies}</strong>
                                    </div>

                                    <div>
                                        <span>Sheets / copy</span>
                                        <strong>{order.sheetsPerCopy}</strong>
                                    </div>

                                    <div>
                                        <span>Print type</span>

                                        <strong>
                                            {order.printType === 'COLOUR'
                                                ? 'Colour'
                                                : 'Black & White'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Print side</span>

                                        <strong>
                                            {order.printSide === 'DOUBLE_SIDE'
                                                ? 'Double-sided'
                                                : 'Single-sided'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Binding</span>

                                        <strong>
                                            {order.bindingRequired
                                                ? 'Required'
                                                : 'Not required'}
                                        </strong>
                                    </div>

                                </div>

                                <div className="seller-order-price">

                                    <div>
                                        <span>Price per sheet</span>

                                        <strong>
                                            {formatPrice(order.pricePerSheet)}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Binding / copy</span>

                                        <strong>
                                            {formatPrice(order.bindingCost)}
                                        </strong>
                                    </div>

                                    <div className="seller-order-total">
                                        <span>Order total</span>

                                        <strong>
                                            {formatPrice(order.totalPrice)}
                                        </strong>
                                    </div>

                                </div>

                                <div className="seller-order-actions">

                                    <button
                                        className="seller-download-button"
                                        onClick={() => handleDownload(order)}
                                        disabled={downloadingId === order.id}
                                    >
                                        {downloadingId === order.id
                                            ? 'Downloading...'
                                            : '↓ Download PDF'}
                                    </button>

                                    {nextAction && (

                                        <button
                                            className="seller-status-button"
                                            onClick={() =>
                                                handleStatusUpdate(
                                                    order,
                                                    nextAction.nextStatus
                                                )
                                            }
                                            disabled={updatingId === order.id}
                                        >
                                            {updatingId === order.id
                                                ? 'Updating...'
                                                : nextAction.label}

                                            {updatingId !== order.id && ' →'}
                                        </button>

                                    )}

                                </div>

                            </article>

                        )
                    })}

                </div>

            )}

        </section>
    )
}

export default SellerOrders