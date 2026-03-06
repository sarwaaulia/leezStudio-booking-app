package connections

import (
 "fmt"

 "github.com/joho/godotenv"
)

// Di connections/loadEnv.go
func LoadEnvVariables() {
    err := godotenv.Load()
    if err != nil {
        fmt.Println("Running in production mode (No .env file found)")
    }
}