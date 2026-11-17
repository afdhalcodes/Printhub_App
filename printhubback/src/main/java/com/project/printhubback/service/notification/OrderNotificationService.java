package com.project.printhubback.service.notification;


import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class OrderNotificationService {

    // Active SSE connections for each seller.
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>>
            sellerConnections = new ConcurrentHashMap<>();

    // Active SSE connections for each buyer.
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>>
            buyerConnections = new ConcurrentHashMap<>();

    private SseEmitter createConnection(
            Long userId,
            ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>> connections
    ) {

        // 0L means the connection does not have a fixed timeout.
        SseEmitter emitter = new SseEmitter(0L);

        connections.computeIfAbsent(
                userId,
                id -> new CopyOnWriteArrayList<>()
        ).add(emitter);

        // Remove the connection when the browser closes it.
        Runnable removeConnection = () -> removeEmitter(
                userId,
                emitter,
                connections
        );

        emitter.onCompletion(removeConnection);
        emitter.onTimeout(removeConnection);
        emitter.onError(error -> removeConnection.run());

        // Let the frontend know that the SSE connection is active.
        try {
            emitter.send(
                    SseEmitter.event()
                            .name("connected")
                            .data("Connected to PrintHub notifications")
            );
        } catch (IOException exception) {
            removeConnection.run();
        }

        return emitter;
    }

    public SseEmitter subscribeSeller(Long sellerId) {
        return createConnection(sellerId, sellerConnections);
    }

    public SseEmitter subscribeBuyer(Long buyerId) {
        return createConnection(buyerId, buyerConnections);
    }

    public void notifySeller(
            Long sellerId,
            String eventName,
            Object data
    ) {
        sendEvent(sellerId, eventName, data, sellerConnections);
    }

    public void notifyBuyer(
            Long buyerId,
            String eventName,
            Object data
    ) {
        sendEvent(buyerId, eventName, data, buyerConnections);
    }

    private void sendEvent(
            Long userId,
            String eventName,
            Object data,
            ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>> connections
    ) {

        List<SseEmitter> emitters = connections.get(userId);

        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(
                        SseEmitter.event()
                                .name(eventName)
                                .data(data)
                );
            } catch (IOException | IllegalStateException exception) {
                removeEmitter(userId, emitter, connections);
            }
        }
    }

    private void removeEmitter(
            Long userId,
            SseEmitter emitter,
            ConcurrentHashMap<Long, CopyOnWriteArrayList<SseEmitter>> connections
    ) {

        CopyOnWriteArrayList<SseEmitter> emitters =
                connections.get(userId);

        if (emitters != null) {
            emitters.remove(emitter);

            if (emitters.isEmpty()) {
                connections.remove(userId, emitters);
            }
        }
    }
}
