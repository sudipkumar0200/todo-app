import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMemberCredentials(
  email: string,
  name: string,
  password: string
): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Welcome to Task Manager - Your Login Credentials",
      html: `
        <h2>Welcome to Task Manager!</h2>
        <p>Hi ${name},</p>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        <p>You can login at: <a href="http://localhost:5173/">http://localhost:5173/</a></p>
      `,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    // Don't throw error - member creation should succeed even if email fails
  }
}