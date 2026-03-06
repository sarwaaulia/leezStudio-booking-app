package utils

import (
	"fmt"
	"net/smtp"
	"os"
)

func SendEmail(to string, subject string, body string) error {
    from := os.Getenv("EMAIL_USER")
    password := os.Getenv("EMAIL_PASS")
    if from == "" || password == "" {
        return fmt.Errorf("ENV EMAIL_USER atau EMAIL_PASS kosong")
    }

    smtpHost := "sandbox.smtp.mailtrap.io"
    smtpPort := "2525"

    // format email
    header := make(map[string]string)
	header["From"] = "LeezStudio <no-reply@leezstudio.com>"
	header["To"] = to
	header["Subject"] = subject
	header["MIME-Version"] = "1.0"
	header["Content-Type"] = "text/html; charset=\"utf-8\""

	message := ""
	for k, v := range header {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + body

    auth := smtp.PlainAuth("", from, password, smtpHost)

    err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, []byte(message))

    if err != nil {
        fmt.Println("Error sending email:", err)
        return err
    }
    fmt.Println("Email sent successfully!")
    return nil
}