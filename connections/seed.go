package connections

import (
	"additional-project/models"
	"additional-project/utils"
	"fmt"
	"time"

	"gorm.io/gorm"
)

func SeedAll(db *gorm.DB) {
	fmt.Println("Starting seed...")

	// deleting old data and reset to 1
	db.Exec("TRUNCATE TABLE bookings RESTART IDENTITY CASCADE")
    db.Exec("TRUNCATE TABLE time_slots RESTART IDENTITY CASCADE")
    db.Exec("TRUNCATE TABLE studios RESTART IDENTITY CASCADE")
    db.Exec("TRUNCATE TABLE users RESTART IDENTITY CASCADE")

	// seeding user
	userData := []struct {
		Name string
		Email string
		Password string
		Role models.Role
	}{
		{Name: "Admin Studio", Email: "admin@studio.com", Password: "adminstudio", Role: "ADMIN"},
		{Name: "Bubu abu", Email: "bubu@example.com", Password: "bubumeong", Role: "USER"},
		{Name: "Mochi meong", Email: "mochi@example.com", Password: "mochicantik", Role: "USER"},
		{Name: "Prabowo", Email: "sawit1945@example.com", Password: "antekasing", Role: "USER"},
		{Name: "Ramadhan", Email: "ramadhan@example.com", Password: "ramadhan10", Role: "USER"},
		{Name: "Ramadhani", Email: "ramadhani@example.com", Password: "ramadhani2005", Role: "USER"},

	}
	for _, u := range userData {
		hashed, _ := utils.HashPassword(u.Password)
		user:= models.User {
			Name: u.Name,
			Email: u.Email,
			Password: hashed,
			Role: u.Role,
		}
		db.Create(&user)
	}
	fmt.Println("✅ Created users")

	// seeding for studio
	studios := []models.Studio{
		{Name: "Studio Ei - Classic", Description: "A studio to capture your moments either alone or with friends with a spotlight theme in various colors that matches the current photo trend and looks classy.", Price: 135000},
		{Name: "Studio Bi - Vintage", Description: "The studio with a vintage theme is equipped with balloon decorations, one of which is a number balloon, very suitable for capturing moments alone or with loved ones.", Price: 250000},
		{Name: "Studio Si - Minimalist", Description: "Minimalist studio with a clean white vibe that is suitable for capturing moments such as maternity or extended family photos.", Price: 340000},
	}

	var createdStudios []models.Studio
    for _, s := range studios {
        db.Create(&s)
        createdStudios = append(createdStudios, s)
    }
    fmt.Printf("✅ Created %d studios (ID 1, 2, 3)\n", len(createdStudios))

	// seeder for 2 time slots
	var allSlots []models.TimeSlot
    now := time.Now()

	for _, studio := range createdStudios {
        for day := 0; day <= 6; day++ {
			// start of the day
            startTime := time.Date(now.Year(), now.Month(), now.Day()+day, 9, 0, 0, 0, now.Location())
            
			// looping until end of the day 17.00
            for startTime.Hour() < 17 {
                endTime := startTime.Add(30 * time.Minute)

                allSlots = append(allSlots, models.TimeSlot{
                    StudioID:  studio.ID,
                    StartTime: startTime,
                    EndTime:   endTime,
                    IsBooked:  false,
                })

                startTime = endTime
            }
        }
    }

    if err := db.Create(&allSlots).Error; err != nil {
        fmt.Println("Error seeding slots:", err)
    }
    
    fmt.Printf("✅ Created %d time slots", len(allSlots))
}