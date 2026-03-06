package main

import (
	"additional-project/connections"
	"additional-project/controllers"
	middleware "additional-project/middlewares"
	"additional-project/models"
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
)

func main() {
    fmt.Println("file go pertama")

    connections.LoadEnvVariables()
    connections.ConnectDB() // connection for db 
    
	// call db in file connections
    db := connections.DB

    err := db.AutoMigrate(
        &models.User{},
        &models.Studio{},
        &models.TimeSlot{},
        &models.Booking{},
    )

    if err != nil {
    	fmt.Println("Migration Notice (Skipped):", err) 
	}

    // checking if i run the code and there is written 'seed'
    args := os.Args
    if len(args) > 1 && args[1] =="seed" {
        fmt.Println("Seeding on processing...")
        connections.SeedAll(db)
        fmt.Println("Seeding completed!")
		return
    }

    r := gin.Default()

	r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:3000", "https://leezstudio.vercel.app"},
        AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        AllowCredentials: true,
    }))

    r.POST("/register", controllers.Register)
	r.POST("/login", controllers.Login)

	// guest books
	r.POST("/bookings", controllers.CreateBooking) // guest books
	r.GET("/track", controllers.TrackBooking)
	r.GET("/slots", controllers.GetAvailableSlots)

	// protect route admin only
	admin := r.Group("/admin")

	admin.Use(middleware.Middleware("ADMIN")) 
	{
		admin.GET("/dashboard", controllers.GetAllBookings)
		admin.GET("/bookings", controllers.GetAllBookings)

		admin.DELETE("/bookings/:id", controllers.BookingCancellation)

		admin.PATCH("/bookings/:id/approve", controllers.BookingApproval)
	}

	fmt.Println("Server running on port 8080")
	r.Run(":8080")

    fmt.Println("Migration success!")
}