package controllers

import (
	"sync"
	"testing"
	"net/http"
	"net/http/httptest"
	"strings"
	"github.com/gin-gonic/gin"
)

func TestBookingRaceCondition(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/bookings", CreateBooking)

	var wg sync.WaitGroup
	numRequests := 10 // Ssimulasi 10 user klik bersamaan
	
	// channel untuk status code dari setiap request
	responses := make(chan int, numRequests)

	for i := 0; i < numRequests; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			
			// simulasi request
			body := `{"slot_id": 6, "user_id": 10}`
			req, _ := http.NewRequest("POST", "/bookings", strings.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			
			responses <- w.Code
		}()
	}

	wg.Wait()
	close(responses)

	// validasai hasil
	successCount := 0
	conflictCount := 0
	for code := range responses {
		if code == http.StatusOK || code == http.StatusCreated {
			successCount++
		} else if code == http.StatusConflict || code == http.StatusBadRequest {
			conflictCount++
		}
	}

	t.Logf("Success: %d, Conflict/Fail: %d", successCount, conflictCount)
	if successCount > 1 {
		t.Errorf("Gagal! Terjadi double booking. Jumlah sukses: %d", successCount)
	}
}