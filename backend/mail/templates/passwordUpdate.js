exports.passwordUpdated = (email, name = 'User') => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Password Updated - Beeja Learning Platform</title>
        <style>
            body {
                background-color: #f8f9fa;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 16px;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
            }
    
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }

            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
            }

            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }

            .content {
                padding: 40px 30px;
            }
    
            .greeting {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 20px;
                color: #2c3e50;
            }
    
            .message {
                font-size: 16px;
                margin-bottom: 25px;
                color: #555;
            }

            .security-notice {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }

            .security-notice strong {
                color: #d63031;
            }
    
            .footer {
                background-color: #f8f9fa;
                padding: 20px 30px;
                border-top: 1px solid #dee2e6;
                font-size: 14px;
                color: #6c757d;
                text-align: center;
            }

            .footer a {
                color: #667eea;
                text-decoration: none;
            }

            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    border-radius: 0;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .header {
                    padding: 25px 20px;
                }
            }
        </style>
    </head>
    
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:beeja-logo" alt="Beeja Logo" style="max-width: 150px; margin-bottom: 15px;">
                <h1>🔐 Password Successfully Updated</h1>
            </div>
            
            <div class="content">
                <div class="greeting">Hello ${name},</div>
                
                <div class="message">
                    Your password for the Beeja Learning Platform account associated with <strong>${email}</strong> has been successfully updated.
                </div>

                <div class="security-notice">
                    <strong>⚠️ Security Notice:</strong> If you did not make this change, please contact our support team immediately as your account may have been compromised.
                </div>

                <div class="message">
                    <strong>Security Tips:</strong>
                    <ul>
                        <li>Never share your password with anyone</li>
                        <li>Use unique passwords for different accounts</li>
                        <li>Enable two-factor authentication if available</li>
                        <li>Regularly monitor your account activity</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p>This is an automated message from Beeja Learning Platform. If you have any questions, please contact our support team.</p>
                <p>
                    <a href="mailto:info@beejaacademy.com">info@beejaacademy.com</a>
                </p>
                <p style="margin-top: 15px; font-size: 12px; color: #999;">
                    © 2024 Beeja Innovative Ventures. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    
    </html>`;
};