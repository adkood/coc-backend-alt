import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sgMail from "@sendgrid/mail";
import { Users } from "@/api/entity/user/Users";
import { AppDataSource } from "@/server";

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendResetEmail = async (req: Request, res: Response) => {
  try {
    const { toEmail, resetLink } = req.body;

    // Validate input
    if (!toEmail || !resetLink) {
      return res.status(400).json({
        status: "error",
        message: "Both email and reset link are required"
      });
    }

    const personalDetailsRepo = AppDataSource.getRepository(Users);
    const user = await personalDetailsRepo.findOne({
      where: { emailAddress: toEmail }
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User with this email doesn't exist"
      });
    }

    // Generate token
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.ACCESS_SECRET_KEY!,
      { expiresIn: "1h" }
    );

    const newResetLink = `${resetLink}?token=${resetToken}`;

    // Send email
    await sgMail.send({
      to: toEmail,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: "Reset Your Password",
      html: `
         <p>Hi,</p>
         <p>You requested a password reset. Please click the link below to reset your password:</p>
         <a href="${newResetLink}">Reset Password</a>
         <p>If you did not request this, please ignore this email.</p>
         <p>Thank you,</p>
         <p>The Coceducation Team</p>
       `,
      text: `You requested a password reset. Please visit this link to reset your password: ${newResetLink}`,

    });

    res.status(200).json({
      success: true,
      message: "Reset email sent successfully"
    });

  } catch (error: any) {
    console.error("Password reset error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.body
    });

    res.status(500).json({
      success: false,
      message: error.response?.body?.errors?.[0]?.message ||
        "Failed to send reset email"
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ status: "error", message: "Token and new password are required" });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.ACCESS_SECRET_KEY!);
    } catch (err) {
      return res.status(400).json({ status: "error", message: "Invalid or expired token" });
    }

    const { userId } = payload;

    const personalDetailsRepo = AppDataSource.getRepository(Users);
    const user = await personalDetailsRepo.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await personalDetailsRepo.save(user);

    res.status(200).json({ success: true, message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};