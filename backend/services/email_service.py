"""Email service for sending emails via SMTP."""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from app.config import (
    WAITLIST_EMAIL,
    WAITLIST_PASS,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURITY,
)

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP."""
    
    def __init__(
        self,
        smtp_host: str = SMTP_HOST,
        smtp_port: int = SMTP_PORT,
        smtp_email: str = WAITLIST_EMAIL,
        smtp_password: str = WAITLIST_PASS,
    ):
        """
        Initialize the email service.
        
        Args:
            smtp_host: SMTP server host
            smtp_port: SMTP server port
            smtp_email: SMTP sender email
            smtp_password: SMTP password
        """
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_email = smtp_email
        self.smtp_password = smtp_password
        self.smtp_security = SMTP_SECURITY
        self.smtp_timeout_seconds = 15

    def _send_message(self, msg: MIMEMultipart) -> None:
        """
        Send a prebuilt MIME message using configured SMTP transport.

        Notes:
        - Port 465 typically requires implicit TLS (SMTP_SSL) and must NOT call starttls().
        - Port 587 typically uses STARTTLS (SMTP + starttls()).
        """
        security = (self.smtp_security or "").strip().lower()
        context = ssl.create_default_context()

        if security == "ssl":
            with smtplib.SMTP_SSL(
                self.smtp_host,
                self.smtp_port,
                timeout=self.smtp_timeout_seconds,
                context=context,
            ) as server:
                server.login(self.smtp_email, self.smtp_password)
                server.send_message(msg)
            return

        with smtplib.SMTP(
            self.smtp_host,
            self.smtp_port,
            timeout=self.smtp_timeout_seconds,
        ) as server:
            server.ehlo()
            if security == "starttls":
                server.starttls(context=context)
                server.ehlo()
            server.login(self.smtp_email, self.smtp_password)
            server.send_message(msg)
    
    def _create_waitlist_confirmation_html(self, email: str) -> str:
        """
        Create HTML email template for waitlist confirmation.
        
        Args:
            email: User's email address
            
        Returns:
            HTML email content
        """
        return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're on the Glass Waitlist!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f7;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f7; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #75b5e6 0%, #6b8ec5 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <div style="display: inline-block; width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; padding: 12px; margin-bottom: 20px;">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">
                                Glass
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1d1d1f; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                                You're on the list! 🎉
                            </h2>
                            <p style="margin: 0 0 20px 0; color: #424245; font-size: 16px; line-height: 1.6;">
                                Thank you for joining the Glass waitlist! We're excited to have you on board.
                            </p>
                            <p style="margin: 0 0 20px 0; color: #424245; font-size: 16px; line-height: 1.6;">
                                Glass is currently live and helping users get balanced, well-reasoned answers through our innovative multi-model council process. As we scale our infrastructure to accommodate more users, you'll be among the first to know when spots open up.
                            </p>
                            
                            <!-- Feature Highlights -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="padding: 20px; background-color: #f5f5f7; border-radius: 8px; margin-bottom: 15px;">
                                        <h3 style="margin: 0 0 10px 0; color: #1d1d1f; font-size: 18px; font-weight: 600;">
                                            🎯 Stage 1: Individual Responses
                                        </h3>
                                        <p style="margin: 0; color: #424245; font-size: 14px; line-height: 1.5;">
                                            Multiple AI models provide their unique perspectives
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px; background-color: #f5f5f7; border-radius: 8px; margin-bottom: 15px;">
                                        <h3 style="margin: 0 0 10px 0; color: #1d1d1f; font-size: 18px; font-weight: 600;">
                                            ⚖️ Stage 2: Peer Rankings
                                        </h3>
                                        <p style="margin: 0; color: #424245; font-size: 14px; line-height: 1.5;">
                                            Models evaluate and rank each other's responses
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px; background-color: #f5f5f7; border-radius: 8px;">
                                        <h3 style="margin: 0 0 10px 0; color: #1d1d1f; font-size: 18px; font-weight: 600;">
                                            ✨ Stage 3: Final Synthesis
                                        </h3>
                                        <p style="margin: 0; color: #424245; font-size: 14px; line-height: 1.5;">
                                            An arbiter creates a comprehensive answer from the best insights
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0 0; color: #424245; font-size: 16px; line-height: 1.6;">
                                We'll send you an email as soon as we're ready to welcome you to Glass. In the meantime, stay tuned!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; text-align: center; background-color: #f5f5f7; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e5e7;">
                            <p style="margin: 0 0 10px 0; color: #86868b; font-size: 14px;">
                                Your email: <strong>{email}</strong>
                            </p>
                            <p style="margin: 0; color: #86868b; font-size: 12px; line-height: 1.5;">
                                © 2026 Glass. Production-ready LLM infrastructure.<br>
                                Questions that matter.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    
    async def send_waitlist_confirmation(self, to_email: str) -> bool:
        """
        Send waitlist confirmation email.
        
        Args:
            to_email: Recipient email address
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "You're on the Glass Waitlist! 🎉"
            msg['From'] = f"Glass <{self.smtp_email}>"
            msg['To'] = to_email
            
            # Create HTML part
            html_content = self._create_waitlist_confirmation_html(to_email)
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            self._send_message(msg)
            
            logger.info(f"Waitlist confirmation email sent to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send a generic email.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Optional plain text content
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"Glass <{self.smtp_email}>"
            msg['To'] = to_email
            
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            self._send_message(msg)
            
            logger.info(f"Email sent to {to_email}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False


# Singleton instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get or create email service instance."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
