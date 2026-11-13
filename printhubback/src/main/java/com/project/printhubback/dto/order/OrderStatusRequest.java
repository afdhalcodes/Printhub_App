package com.project.printhubback.dto.order;

import com.project.printhubback.model.order.OrderStatus;

public class OrderStatusRequest {

    private OrderStatus status;

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }
}
