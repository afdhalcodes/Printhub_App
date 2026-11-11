package com.project.printhubback.dto.store;

import java.time.LocalTime;

public class StoreResponse {

    private Long id;

    private String name;

    private String location;

    private String email;

    private String phoneNumber;

    private String description;

    private LocalTime openingTime;

    private LocalTime closingTime;

    private boolean active;

    private String pictureName;

    public StoreResponse(Long id, String name, String location,
                         String email, String phoneNumber, String description,
                         LocalTime openingTime, LocalTime closingTime,
                         boolean active, String pictureName) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.description = description;
        this.openingTime = openingTime;
        this.closingTime = closingTime;
        this.active = active;
        this.pictureName = pictureName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalTime getOpeningTime() {
        return openingTime;
    }

    public void setOpeningTime(LocalTime openingTime) {
        this.openingTime = openingTime;
    }

    public LocalTime getClosingTime() {
        return closingTime;
    }

    public void setClosingTime(LocalTime closingTime) {
        this.closingTime = closingTime;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getPictureName() {
        return pictureName;
    }

    public void setPictureName(String pictureName) {
        this.pictureName = pictureName;
    }
}
