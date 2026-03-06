package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Middleware(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// parse token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
				"details": err.Error(),
			})
			return
		}

		// check token
		if claims, ok := token.Claims.(jwt.MapClaims); ok {

			// store id to users 
			c.Set("userId", claims["id"])
			c.Set("userRole", claims["role"])

			if requiredRole != "" && claims["role"] != requiredRole {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access denied: " + requiredRole + " only"})
				return
			}
			
			c.Next()
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Failed to parse claims"})
		}
	}
}