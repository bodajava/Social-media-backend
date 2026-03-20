

export const emailTemplet = async ({ code, title } = {}) => {

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #00b4db, #0083b0); color: #ffffff; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
            .content { padding: 30px; line-height: 1.6; color: #333333; }
            .content h2 { color: #0083b0; }
            .cta-button { display: inline-block; padding: 12px 30px; background-color: #0083b0; color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 20px; }
            .footer { background-color: #f9f9f9; color: #777777; padding: 20px; text-align: center; font-size: 12px; }
            .footer p { margin: 5px 0; }
            .code-box { background-color: #f0f8ff; border: 2px dashed #0083b0; padding: 20px; font-size: 32px; font-weight: bold; color: #0083b0; margin: 20px 0; letter-spacing: 5px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SARAHA APP</h1>
            </div>
            <div class="content">
                <h2>${title || 'Verification Code'} 🎉</h2>
                <p>Hello there,</p>
                <p>Thank you for choosing SARAHA APP. Please use the verification code below to complete your action:</p>
                <div class="code-box">${code}</div>
                <p>This code is valid for 2 minutes. If you didn't request this, please ignore this email.</p>
                <p>If you have any questions, feel free to reply to this email. We're here to help!</p>
            </div>
            <div class="footer">
                <p>&copy; 2025 SARAHA APP. All rights reserved.</p>
                <p>Cairo, Egypt</p>
            </div>
        </div>
    </body>
    </html>
    `
}