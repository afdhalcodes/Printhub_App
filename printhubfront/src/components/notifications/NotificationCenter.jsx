import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './NotificationCenter.css'

const API_BASE_URL = 'http://localhost:8080'

const MAX_STORED = 30
const MAX_TOASTS = 3
const RETRY_DELAY_MS = 5000

// =====================================================
// ICONS
// =====================================================

const ICON_PATHS = {
    bell: (
        <>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </>
    ),
    check: (
        <>
            <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" />
            <path d="m9 11 3 3L22 4" />
        </>
    ),
    printer: (
        <>
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <path d="M6 14h12v8H6z" />
        </>
    ),
    inbox: (
        <>
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z" />
        </>
    ),
    cancel: (
        <>
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </>
    ),
    package: (
        <>
            <path d="m7.5 4.3 9 5.2" />
            <path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
        </>
    )
}

function Icon({ name, size = 20 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {ICON_PATHS[name]}
        </svg>
    )
}

// =====================================================
// HELPERS
// =====================================================

function loadStored(storageKey) {
    try {
        const raw = window.localStorage.getItem(storageKey)
        const parsed = raw ? JSON.parse(raw) : []

        return Array.isArray(parsed)
            ? parsed.slice(0, MAX_STORED)
            : []
    } catch {
        return []
    }
}

function saveStored(storageKey, items) {
    try {
        window.localStorage.setItem(
            storageKey,
            JSON.stringify(items.slice(0, MAX_STORED))
        )
    } catch {
        // Storage can be full or blocked. Notifications still work live.
    }
}

function timeAgo(isoTime) {
    const seconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000)
    )

    if (seconds < 45) return 'Just now'

    const minutes = Math.round(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`

    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours} hr ago`

    const days = Math.round(hours / 24)
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`

    return new Date(isoTime).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
    })
}

// Turns a raw server event into a notification that can be shown.
function buildNotification(eventName, order) {

    const base = {
        orderId: order.id,
        storeName: order.storeName || 'Print shop',
        time: new Date().toISOString(),
        read: false
    }

    // ----- SELLER EVENTS -----

    if (eventName === 'new-order') {
        return {
            ...base,
            id: `new-order-${order.id}`,
            tone: 'new',
            icon: 'inbox',
            title: 'New order received',
            message: `Order #${order.id} from ${order.buyerUsername || 'a customer'}` +
                (order.documentName ? ` · ${order.documentName}` : '')
        }
    }

    if (eventName === 'order-cancelled') {
        return {
            ...base,
            id: `order-cancelled-${order.id}`,
            tone: 'danger',
            icon: 'cancel',
            title: 'Order cancelled',
            message: `${order.buyerUsername || 'The customer'} cancelled order #${order.id}.`
        }
    }

    // ----- BUYER EVENTS -----

    if (eventName === 'order-status') {

        switch (order.status) {

            case 'PRINTING':
                return {
                    ...base,
                    id: `order-printing-${order.id}`,
                    tone: 'info',
                    icon: 'printer',
                    title: 'Printing started',
                    message: `${base.storeName} is now printing your order #${order.id}.`
                }

            case 'PRINTED':
                return {
                    ...base,
                    id: `order-printed-${order.id}`,
                    tone: 'success',
                    icon: 'check',
                    title: 'Your order is ready!',
                    message: `Order #${order.id} is printed. Please collect it from ${base.storeName}.`
                }

            case 'COLLECTED':
                return {
                    ...base,
                    id: `order-collected-${order.id}`,
                    tone: 'neutral',
                    icon: 'package',
                    title: 'Order collected',
                    message: `Order #${order.id} was marked as collected. Thank you!`
                }

            default:
                return null
        }
    }

    return null
}

// Which window event the rest of the app listens to.
const WINDOW_EVENTS = {
    'new-order': 'printhub:new-order',
    'order-cancelled': 'printhub:order-cancelled',
    'order-status': 'printhub:order-updated'
}

const STREAM_EVENTS = {
    SELLER: ['new-order', 'order-cancelled'],
    BUYER: ['order-status']
}

// =====================================================
// TOAST
// =====================================================

function Toast({ notification, onClose, onOpen }) {
    return (
        <div
            className={`ph-toast ph-tone-${notification.tone}`}
            role="status"
        >
            <button
                type="button"
                className="ph-toast-body"
                onClick={onOpen}
            >
                <span className="ph-toast-icon">
                    <Icon name={notification.icon} />
                </span>

                <span className="ph-toast-text">
                    <span className="ph-toast-title">
                        {notification.title}
                    </span>

                    <span className="ph-toast-message">
                        {notification.message}
                    </span>

                    <span className="ph-toast-meta">
                        {notification.storeName} · Tap to view orders
                    </span>
                </span>
            </button>

            <button
                type="button"
                className="ph-toast-close"
                onClick={onClose}
                aria-label="Dismiss notification"
            >
                ×
            </button>

            {/* The toast closes itself when this bar finishes.
                Hovering pauses the bar, so the toast stays. */}
            <span
                className="ph-toast-progress"
                onAnimationEnd={event => {
                    if (event.target === event.currentTarget) onClose()
                }}
            />
        </div>
    )
}

// =====================================================
// NOTIFICATION CENTER (BELL + DROPDOWN + TOASTS)
// =====================================================

function NotificationCenter({ role, userKey, onOpenOrders }) {

    const normalizedRole = role === 'SELLER' ? 'SELLER' : 'BUYER'
    const storageKey = `printhub:notifications:${normalizedRole}:${userKey || 'user'}`

    const [items, setItems] = useState(() => loadStored(storageKey))
    const [toasts, setToasts] = useState([])
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState('CONNECTING')
    const [ringing, setRinging] = useState(false)
    const [, setClock] = useState(0)

    const rootRef = useRef(null)
    const ringTimer = useRef(null)
    const openRef = useRef(false)

    const unreadCount = items.filter(item => !item.read).length

    // Remember whether the dropdown is open, so new popups can be skipped
    // while the person is already looking at the notification list.
    useEffect(() => {
        openRef.current = open
    }, [open])

    // -------------------------------------------------
    // SAVE TO LOCAL STORAGE
    // -------------------------------------------------

    useEffect(() => {
        saveStored(storageKey, items)
    }, [items, storageKey])

    // -------------------------------------------------
    // KEEP "x min ago" LABELS FRESH
    // -------------------------------------------------

    useEffect(() => {
        const timer = setInterval(() => setClock(value => value + 1), 30000)
        return () => clearInterval(timer)
    }, [])

    // -------------------------------------------------
    // ADD A NOTIFICATION (LIST + TOAST + BELL WIGGLE)
    // -------------------------------------------------

    const pushNotification = useCallback(notification => {

        setItems(previous => [
            notification,
            ...previous.filter(item => item.id !== notification.id)
        ].slice(0, MAX_STORED))

        if (!openRef.current) {
            setToasts(previous => [
                notification,
                ...previous.filter(item => item.id !== notification.id)
            ].slice(0, MAX_TOASTS))
        }

        setRinging(true)
        clearTimeout(ringTimer.current)
        ringTimer.current = setTimeout(() => setRinging(false), 1400)

    }, [])

    useEffect(() => () => clearTimeout(ringTimer.current), [])

    // -------------------------------------------------
    // LIVE CONNECTION (SSE) WITH AUTOMATIC RETRY
    // -------------------------------------------------

    useEffect(() => {

        let eventSource = null
        let retryTimer = null
        let stopped = false
        let hasConnectedBefore = false

        const streamPath = normalizedRole === 'SELLER'
            ? '/api/seller/notifications/stream'
            : '/api/buyer/notifications/stream'

        const handleServerEvent = (eventName, rawData) => {

            let order

            try {
                order = JSON.parse(rawData)
            } catch (error) {
                console.error(`Invalid ${eventName} notification:`, error)
                return
            }

            if (!order?.id) return

            // 1. Let the page update itself instantly, no refresh needed.
            window.dispatchEvent(
                new CustomEvent(WINDOW_EVENTS[eventName], { detail: order })
            )

            // 2. Show the popup and add it to the bell list.
            const notification = buildNotification(eventName, order)

            if (notification) {
                pushNotification(notification)
            }
        }

        const connect = () => {

            if (stopped) return

            eventSource = new EventSource(
                `${API_BASE_URL}${streamPath}`,
                { withCredentials: true }
            )

            eventSource.onopen = () => {

                setStatus('CONNECTED')

                // Events sent while we were disconnected are lost,
                // so ask the pages to reload their data once.
                if (hasConnectedBefore) {
                    window.dispatchEvent(
                        new CustomEvent('printhub:notifications-reconnected')
                    )
                }

                hasConnectedBefore = true
            }

            eventSource.addEventListener('connected', () => {
                setStatus('CONNECTED')
            })

            STREAM_EVENTS[normalizedRole].forEach(eventName => {
                eventSource.addEventListener(eventName, event => {
                    handleServerEvent(eventName, event.data)
                })
            })

            eventSource.onerror = () => {

                if (stopped) return

                setStatus('RECONNECTING')

                // The browser gives up when the server answers with an
                // error status. In that case we retry ourselves.
                if (eventSource.readyState === EventSource.CLOSED) {
                    eventSource.close()
                    retryTimer = setTimeout(connect, RETRY_DELAY_MS)
                }
            }
        }

        connect()

        return () => {
            stopped = true
            clearTimeout(retryTimer)
            eventSource?.close()
        }

    }, [normalizedRole, pushNotification])

    // -------------------------------------------------
    // CLOSE THE DROPDOWN (OUTSIDE CLICK / ESCAPE)
    // -------------------------------------------------

    useEffect(() => {

        if (!open) return

        const handlePointerDown = event => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false)
            }
        }

        const handleKeyDown = event => {
            if (event.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }

    }, [open])

    // -------------------------------------------------
    // ACTIONS
    // -------------------------------------------------

    const markRead = id => {
        setItems(previous =>
            previous.map(item =>
                item.id === id ? { ...item, read: true } : item
            )
        )
    }

    const markAllRead = () => {
        setItems(previous => previous.map(item => ({ ...item, read: true })))
    }

    const clearAll = () => {
        setItems([])
    }

    const closeToast = id => {
        setToasts(previous => previous.filter(item => item.id !== id))
    }

    const openNotification = notification => {
        markRead(notification.id)
        closeToast(notification.id)
        setOpen(false)
        onOpenOrders?.(notification)
    }

    const statusText = status === 'CONNECTED'
        ? 'Live updates are on'
        : status === 'RECONNECTING'
            ? 'Reconnecting…'
            : 'Connecting…'

    // -------------------------------------------------
    // UI
    // -------------------------------------------------

    return (
        <>
            <span className="ph-notify" ref={rootRef}>

                <button
                    type="button"
                    className={`ph-bell ${open ? 'open' : ''} ${ringing ? 'ringing' : ''}`}
                    onClick={() => {
                        // Popups are not needed once the list is open.
                        if (!open) setToasts([])
                        setOpen(previous => !previous)
                    }}
                    aria-label={
                        unreadCount > 0
                            ? `Notifications, ${unreadCount} unread`
                            : 'Notifications'
                    }
                    aria-haspopup="true"
                    aria-expanded={open}
                >
                    <Icon name="bell" size={21} />

                    {unreadCount > 0 && (
                        <span className="ph-bell-badge" key={unreadCount}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}

                    <span className={`ph-bell-status ${status.toLowerCase()}`} />
                </button>

                {open && (
                    <section
                        className="ph-panel"
                        role="dialog"
                        aria-label="Notifications"
                    >
                        <header className="ph-panel-head">
                            <h3>
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ph-panel-count">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h3>

                            <span className="ph-panel-actions">
                                <button
                                    type="button"
                                    onClick={markAllRead}
                                    disabled={unreadCount === 0}
                                >
                                    Mark all read
                                </button>

                                <button
                                    type="button"
                                    onClick={clearAll}
                                    disabled={items.length === 0}
                                >
                                    Clear
                                </button>
                            </span>
                        </header>

                        {items.length === 0 ? (

                            <p className="ph-empty">
                                <span className="ph-empty-icon">
                                    <Icon name="bell" size={26} />
                                </span>

                                <span className="ph-empty-title">
                                    You&apos;re all caught up
                                </span>

                                <span className="ph-empty-text">
                                    {normalizedRole === 'SELLER'
                                        ? 'New orders will show up here instantly.'
                                        : 'Updates about your print orders will show up here.'}
                                </span>
                            </p>

                        ) : (

                            <ul className="ph-list">
                                {items.map(item => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            className={`ph-item ${item.read ? '' : 'unread'}`}
                                            onClick={() => openNotification(item)}
                                        >
                                            <span className={`ph-item-icon ph-tone-${item.tone}`}>
                                                <Icon name={item.icon} size={18} />
                                            </span>

                                            <span className="ph-item-text">
                                                <span className="ph-item-title">
                                                    {item.title}
                                                </span>

                                                <span className="ph-item-message">
                                                    {item.message}
                                                </span>

                                                <span className="ph-item-time">
                                                    {timeAgo(item.time)}
                                                </span>
                                            </span>

                                            {!item.read && (
                                                <span className="ph-dot" aria-label="Unread" />
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <p className="ph-panel-foot">
                            <span className={`ph-live ${status.toLowerCase()}`} />
                            {statusText}
                        </p>
                    </section>
                )}

            </span>

            {/* POPUPS (rendered at the top of the page) */}

            {createPortal(
                <div className="ph-toast-stack" aria-live="polite">
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            notification={toast}
                            onClose={() => closeToast(toast.id)}
                            onOpen={() => openNotification(toast)}
                        />
                    ))}
                </div>,
                document.body
            )}
        </>
    )
}

export default NotificationCenter