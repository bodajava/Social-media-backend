import nodemailer from "nodemailer"

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  html,
  attachments = []
} = {}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  // Send an email using async/await
  (async () => {
    const info = await transporter.sendMail({
      from: `"SARAHA APP" <${process.env.EMAIL_APP}>`,
      to,
      cc,
      bcc,
      subject,
      html,
      attachments
    });

    console.log("Message sent:", info.messageId);
  })();
}