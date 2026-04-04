package utils

import (
    "os"
    "os/exec"
    "testing"
)

func TestGetJWTSecret_MissingEnv(t *testing.T) {
    // menggunakan subprocess jika crach
    if os.Getenv("BE_CRASHER") == "1" {
        os.Unsetenv("JWT_SECRET") // kosong
        getJWTSecret()            // memanggil fungsi yang memanggil env
        return
    }

    // menjalankan ulang sebagai subprocess menggunakan executeable 
    cmd := exec.Command(os.Args[0], "-test.run=TestGetJWTSecret_MissingEnv")
    cmd.Env = append(os.Environ(), "BE_CRASHER=1")
    
    err := cmd.Run()

    // akan menghasilkan non-0 
    if e, ok := err.(*exec.ExitError); ok && !e.Success() {
        return // jika sukses
    }
    
    t.Fatalf("proses status %v, seharusnya fatal/exit karena jwt kosong", err)
}