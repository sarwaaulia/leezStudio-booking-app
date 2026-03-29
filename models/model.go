package models

import (
	"time"
	"errors"
)

type Role string 
const (
	USER Role = "USER"
	ADMIN Role = "ADMIN"
)

type BookingStatus string 
const (
	PENDING BookingStatus = "PENDING"
	CONFIRMED BookingStatus = "CONFIRMED"
	CANCELLED BookingStatus = "CANCELLED"
)

type User struct {
	ID uint 			`gorm:"primaryKey"`
	Name string 		`gorm:"not null"`
	Email string 		`gorm:"unique;not null"`
	Password string 	`gorm:"not null"`
	PhoneNumber string
	Role Role 			`gorm:"type:varchar(10);default:'USER'"`
	Bookings []Booking 	`gorm:"foreignKey:UserID"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Studio struct {
	ID uint 			`gorm:"primaryKey"`
	Name string			`gorm:"unique;not null"`
	Description string
	Price int
	Slots []TimeSlot	`gorm:"foreignKey:StudioID"`
	CreatedAt time.Time
}

type TimeSlot struct {
	ID        uint      `gorm:"primaryKey"`
	StudioID  uint      `gorm:"uniqueIndex:idx_studio_time"`
	StartTime time.Time `gorm:"uniqueIndex:idx_studio_time"`
	EndTime   time.Time 
	IsBooked  bool      `gorm:"default:false"`
	Studio    Studio    `gorm:"constraint:OnDelete:CASCADE;"`
}

type Booking struct {
	ID            uint          `gorm:"primaryKey"`
	UserID        *uint			`json:"user_id"`
	StudioID      uint			`json:"studio_id"`
	SlotID        uint          `gorm:"unique" json:"slot_id"`
	CustomerName  string        `gorm:"not null" json:"name"`
	CustomerPhone string        `gorm:"not null" json:"phone"`
	CustomerEmail string        `gorm:"not null" json:"email"`
	Status        BookingStatus `gorm:"type:varchar(20);default:'PENDING'"`
	User          User          `gorm:"foreignKey:UserID" json:"-"`
	Studio        Studio        `gorm:"foreignKey:StudioID" json:"studio"`
	Slot          TimeSlot      `gorm:"foreignKey:SlotID" json:"slot"`
	CreatedAt     time.Time     `json:"created_at"`
}

var (
    ErrSlotNotFound      = errors.New("Slot not found")
    ErrSlotAlreadyBooked = errors.New("Slot already booked by others.")
    ErrBookingNotFound   = errors.New("Booking reserved not found.")
    ErrInternalServer    = errors.New("Internal server error")
)