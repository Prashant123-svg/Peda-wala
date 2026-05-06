import express from "express";
import User from "../models/user.js";
import { authMiddleware } from "../middlewares/Authentication.js";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";
import twilio from "twilio";

const router = express.Router();

let otpStore = {}; // memory store, production me Redis ya DB use karo

// Email transporter (using Gmail or any SMTP)
let transporter = null;

// Initialize email transporter only if credentials are valid
if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim().length > 0) {
  try {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.trim(),
      },
    });
    console.log("✅ Email transporter initialized for:", process.env.EMAIL_USER);
  } catch (err) {
    console.error("❌ Failed to initialize email transporter:", err.message);
    transporter = null;
  }
}

// Twilio SMS client - only initialize if credentials are provided
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log("✅ Twilio client initialized");
  } catch (err) {
    console.error("❌ Failed to initialize Twilio:", err.message);
    twilioClient = null;
  }
}

// Helper function to format phone number to E.164 format
function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // If it's an Indian number (10 digits), add +91
  if (cleaned.length === 10) {
    return "+91" + cleaned;
  }
  
  // If it already has country code, add + if missing
  if (cleaned.length === 12 && !phone.startsWith("+")) {
    return "+" + cleaned;
  }
  
  // If it already starts with +, use as is
  if (phone.startsWith("+")) {
    return phone;
  }
  
  return phone;
}

// ✅ DEBUG ENDPOINT
router.get("/debug", (req, res) => {
  res.json({
    status: "OTP Configuration",
    emailConfigured: !!transporter,
    emailUser: process.env.EMAIL_USER || "NOT SET",
    emailPassSet: !!process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim().length > 0,
    twilioConfigured: !!twilioClient,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? "SET" : "NOT SET",
    twilioPhone: process.env.TWILIO_PHONE_NUMBER || "NOT SET",
    nodeEnv: process.env.NODE_ENV
  });
});

// ✅ TEST EMAIL ENDPOINT
router.post("/test-email", authMiddleware, async (req, res) => {
  try {
    if (!transporter) {
      return res.status(400).json({ 
        message: "Email not configured. Check .env file."
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const testOtp = "123456";
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "🧪 Pedhe Wala - Test Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
          <h2>Test Email</h2>
          <p>If you see this, email OTP is working!</p>
          <h1 style="color: #FFC107; font-size: 36px;">${testOtp}</h1>
        </div>
      `,
    });

    res.json({ 
      message: "✅ Test email sent to " + user.email
    });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ 
      message: "❌ Email error: " + error.message
    });
  }
});

// Send OTP via SMS or Email
router.post("/send-otp", authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    
    console.log("\n📨 OTP Request - Phone:", phone, "| User:", req.user.id);
    
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Generate 6-digit OTP with numbers only
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const formattedPhone = formatPhoneNumber(phone);
    console.log("├─ Formatted:", formattedPhone, "| OTP:", otp);

    // Store OTP
    otpStore[req.user.id] = {
      otp,
      phone: formattedPhone,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update phone in DB
    user.phone = formattedPhone;
    await user.save();

    let otpSentVia = "console";
    let successMessage = "";
    let sentSuccessfully = false;

    // Try SMS (if configured)
    if (twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_PHONE_NUMBER) {
      try {
        console.log("├─ Trying SMS...");
        await twilioClient.messages.create({
          body: `Your Pedhe Wala OTP is: ${otp}. Valid for 5 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        console.log("└─ ✅ SMS Sent");
        otpSentVia = "SMS";
        successMessage = `OTP sent to ${formattedPhone} via SMS ✅`;
        sentSuccessfully = true;
      } catch (smsErr) {
        console.log("├─ SMS failed:", smsErr.message);
      }
    }

    // Try Email (if SMS failed or not configured)
    if (!sentSuccessfully && transporter) {
      try {
        console.log("├─ Trying Email...");
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Phone Verification OTP - Pedhe Wala",
          html: `<h1 style="color: #FFC107; font-size: 36px; text-align: center;">${otp}</h1>
                  <p style="text-align: center;">Valid for 5 minutes only.</p>`,
        });
        console.log("└─ ✅ Email Sent");
        otpSentVia = "Email";
        successMessage = `OTP sent to ${user.email} via Email ✅`;
        sentSuccessfully = true;
      } catch (emailErr) {
        console.log("├─ Email failed:", emailErr.message);
      }
    }

    // Console fallback (non-production / local development)
    // Treat any environment other than explicit 'production' as development/local
    if (!sentSuccessfully && process.env.NODE_ENV !== "production") {
      console.log(`└─ 🔐 Console: ${otp}\n`);
      otpSentVia = "console";
      successMessage = `🔐 OTP: ${otp} (Check server console)`;
      sentSuccessfully = true;
    }

    if (!sentSuccessfully) {
      return res.status(500).json({ 
        message: "Error sending OTP. Check email credentials in .env file.",
        debug: {
          emailOk: !!transporter,
          twilioOk: !!twilioClient,
          nodeEnv: process.env.NODE_ENV
        }
      });
    }

    res.json({ 
      message: successMessage,
      phone: formattedPhone,
      method: otpSentVia
    });
    
  } catch (error) {
    console.error("❌ OTP Error:", error.message);
    res.status(500).json({ 
      message: "Error sending OTP",
      error: error.message
    });
  }
});

// Verify OTP
router.post("/verify-otp", authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const storedData = otpStore[req.user.id];

    if (!storedData) {
      return res.status(400).json({ message: "No OTP found. Request a new one" });
    }

    if (Date.now() > storedData.expiresAt) {
      delete otpStore[req.user.id];
      return res.status(400).json({ message: "OTP expired. Request a new one" });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        phone: storedData.phone,
        isPhoneVerified: true 
      },
      { new: true }
    ).select("-password");

    delete otpStore[req.user.id];

    res.json({ 
      message: "Phone verified successfully ✅",
      user 
    });
  } catch (error) {
    res.status(500).json({ message: "Verification error", error: error.message });
  }
});

export default router;
