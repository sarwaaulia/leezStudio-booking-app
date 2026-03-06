package controllers

import (
	"additional-project/connections"
	"additional-project/models"
	"additional-project/utils"
	"net/http"

	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// create booking for customer
func CreateBooking(c *gin.Context) {
    var input struct {
        SlotID        uint   `json:"slot_id" binding:"required"`
        CustomerName  string `json:"name" binding:"required"`
        CustomerPhone string `json:"phone" binding:"required"`
        CustomerEmail string `json:"email" binding:"required"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

	// to stores new booking data
    var createdBooking models.Booking

    // db transaction
    err := connections.DB.Transaction(func(tx *gorm.DB) error {
        var slot models.TimeSlot

		// if slot not found
        if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&slot, input.SlotID).Error; err != nil {
            return fmt.Errorf("Slot not found")
        }

        if slot.IsBooked {
            return fmt.Errorf("The slot is already booked")
        }

        // update status slot to true if user succeed booked studio
        if err := tx.Model(&slot).Update("is_booked", true).Error; err != nil {
            return err
        }

        // booking data
        createdBooking = models.Booking{
            StudioID:      slot.StudioID, // get from slot
            SlotID:        slot.ID,
            CustomerName:  input.CustomerName,
            CustomerPhone: input.CustomerPhone,
            CustomerEmail: input.CustomerEmail,
            Status:        "PENDING",
        }

        // stores to bookings tabel
        return tx.Create(&createdBooking).Error
    })

    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"message": err.Error()})
        return
    }

    
    // go routine to execute if db succeed commited
    go func(b models.Booking) {
    
    // send email to customer
    trackingLink := fmt.Sprintf("http://localhost:3000/?phone=%s&id=%d", b.CustomerPhone, b.ID)
    subjectUser := "Booking Received - #" + fmt.Sprint(b.ID)
    bodyUser := fmt.Sprintf(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; color: #333;">
            <div style="text-align: center; padding-bottom: 20px;">
                <h1 style="color: #2c3e50; margin: 0;">LeezStudio</h1>
            </div>
            <h2 style="border-bottom: 2px solid #f1f1f1; padding-bottom: 10px; color: #2c3e50;">Booking Confirmation</h2>
            <p>Hi <strong>%s</strong>,</p>
            <p>Thank you for choosing LeezStudio! We have received your booking request. Our team will review it shortly.</p>
            
            <table style="width: 100%%; background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <tr>
                    <td style="padding: 5px 0;"><strong>Booking ID:</strong></td>
                    <td style="text-align: right;">#%d</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Status:</strong></td>
                    <td style="text-align: right; color: #e67e22;"><strong>PENDING</strong></td>
                </tr>
            </table>

            <div style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background-color: #2c3e50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track My Reservation</a>
            </div>

            <p style="font-size: 12px; color: #7f8c8d; text-align: center;">If you didn't make this reservation, please ignore this email.</p>
        </div>
    `, b.CustomerName, b.ID, trackingLink)
    utils.SendEmail(b.CustomerEmail, subjectUser, bodyUser)

    // send to admin
    adminEmail := os.Getenv("EMAIL_USER")
    subjectAdmin := "🚨 NEW BOOKING ALERT: #" + fmt.Sprint(b.ID)

    bodyAdmin := fmt.Sprintf(`
        <div style="font-family: Arial, sans-serif; background: #fff4f4; padding: 20px; border: 1px solid #e74c3c;">
            <h3 style="color: #c0392b;">New Reservation Received!</h3>
            <p>Hello Admin, a new booking has been made:</p>
            <ul>
                <li><strong>Customer:</strong> %s</li>
                <li><strong>Slot ID:</strong> %d</li>
                <li><strong>Email:</strong> %s</li>
            </ul>
            <p>Please log in to the dashboard to approve or reject this request.</p>
        </div>
    `, b.CustomerName, b.SlotID, b.CustomerEmail)
    utils.SendEmail(adminEmail, subjectAdmin, bodyAdmin)
}(createdBooking)

    c.JSON(http.StatusCreated, gin.H{
        "status":  "success",
        "message": "Booking created successfully",
        "data": gin.H{
            "booking_id": createdBooking.ID,
        },
    })
}

// for get slot time 
func GetAvailableSlots(c *gin.Context) {
    studioID := c.Query("studio_id")
    dateStr := c.Query("date") //yy-mm-dd

    var slots []models.TimeSlot

    // filter by studio id
    err := connections.DB.Where("studio_id = ? AND DATE(start_time) = ?", studioID, dateStr).
        Order("start_time ASC").
        Find(&slots).Error

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch slot"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data":   slots,
    })
}

// get tracking booking history
func TrackBooking(c *gin.Context) {
	// get data from query params
    phone := c.Query("phone")
    bookingID := c.Query("id")

    if phone == "" || bookingID == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Phone number and Booking ID are required"})
        return
    }

    var booking models.Booking

	// search for data whose phone number and id match
    err := connections.DB.Preload("Studio").Preload("Slot").
           Where("customer_phone = ? AND id = ?", phone, bookingID).
           First(&booking).Error

    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found. Check your ID or Phone number."})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "status": "success",
        "data":   booking,
    })
}

// get all booking reservation for admin
func GetAllBookings(c *gin.Context) {
	var bookings []models.Booking

	// get booking data and its relation to slot
	// preload = findMany with include in prisma
	err := connections.DB.Preload("Studio").Preload("Slot").Order("created_at desc").Find(&bookings).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch booking"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Get All Booking",
		"data":    bookings,
	})
}

// admin approval for booking reservation
func BookingApproval(c *gin.Context) {
    id := c.Param("id")
    var booking models.Booking

    // search booking data
    if err := connections.DB.First(&booking, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Booking reservation not found"})
        return
    }

    // check if status confirmed to avoid double booking
    if booking.Status == "CONFIRMED" {
        c.JSON(http.StatusBadRequest, gin.H{"message": "Booking is already approved"})
        return
    }

    // if error to update status
    if err := connections.DB.Model(&booking).Update("status", "CONFIRMED").Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
        return
    }

    // send email to customer that the booking reservation already approved
    go func(b models.Booking) {
            subject := "Booking Approved! - #" + fmt.Sprint(b.ID)
            body := fmt.Sprintf(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
            <div style="text-align: center; color: #27ae60;">
                <h2>Payment Verified & Approved!</h2>
            </div>
            <p>Hi <strong>%s</strong>,</p>
            <p>Your booking for <strong>Studio ID %d</strong> has been officially confirmed by our admin. We've reserved the slot just for you.</p>
            
            <div style="background: #ebf9f0; border-left: 5px solid #27ae60; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Session Details:</strong><br>
                Please make sure to arrive at the studio 10 minutes before your session starts.</p>
            </div>

            <p>See you at the studio!</p>
            <p>Best Regards,<br><strong>LeezStudio Team</strong></p>
        </div>
    `, b.CustomerName, b.StudioID)
    
    utils.SendEmail(b.CustomerEmail, subject, body)
    }(booking)

    c.JSON(http.StatusOK, gin.H{
        "status":  "success",
        "message": "Booking approved and customer notified!",
    })
}

// booking reject by admin 
func BookingCancellation(c *gin.Context) {
	id:= c.Param("id")
	var booking models.Booking

    // search booking data if not found
	if err:= connections.DB.First(&booking, id).Error; err!= nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking reservation not found"})
		return 
	}

    // if found then admin reject the reservation and status updated to false
	connections.DB.Model(&models.TimeSlot{}).Where("id = ? ", booking.SlotID).Update("is_booked", false)

	connections.DB.Model(&booking).Update("status", "CANCELLED")

    go func(b models.Booking) {
        subject := "Update Regarding Your Reservation - #" + fmt.Sprint(b.ID)
        body := fmt.Sprintf(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #c0392b;">Reservation Cancelled</h2>
            <p>Hi %s,</p>
            <p>We regret to inform you that your booking <strong>#%d</strong> has been cancelled by the admin due to technical reasons or scheduling conflicts.</p>
            
            <p>If you have already made a payment, our team will contact you shortly for the refund process. You are also welcome to re-book for another available time slot.</p>
            
            <p>We apologize for any inconvenience caused.</p>
            <br>
            <p>Regards,<br>LeezStudio Team</p>
        </div>
    `, b.CustomerName, b.ID)
    
    utils.SendEmail(b.CustomerEmail, subject, body)
    }(booking)

	c.JSON(http.StatusOK, gin.H{"message": "Booking successfully cancelled by admin and slot renewed"})
}