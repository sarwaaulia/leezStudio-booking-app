package connections

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	var err error
	dsn := os.Getenv("DB_URL")
	
	if dsn == "" {
        log.Fatal("DB_URL is not set in .env file")
    }

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		PrepareStmt: false,
		SkipDefaultTransaction: true,
	})
	
 	if err != nil {
  	log.Fatal("Failed to connect to database!")
 }
}