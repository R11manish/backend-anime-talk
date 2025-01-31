import nodemailer from "nodemailer";
import logger from "../utlis/logger";
import { AppError } from "../middleware/error.middleware";
import "dotenv/config";

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: any;
  }>;
}

interface TemplateData {
  title: string;
  content: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("SMTP credentials are not configured");
    }

    this.from = process.env.SMTP_FROM || process.env.SMTP_USER;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!options.to || !options.subject) {
      throw new AppError(400, "Email recipient and subject are required");
    }

    try {
      const mailOptions = {
        from: this.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info("Email sent successfully", {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });
    } catch (error) {
      logger.error("Failed to send email", { error, to: options.to });

      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED")) {
          throw new AppError(500, "Unable to connect to email server");
        }
        if (error.message.includes("Invalid login")) {
          throw new AppError(500, "Email service configuration error");
        }
      }

      throw new AppError(500, "Failed to send email");
    }
  }

  async sendTemplateEmail(
    to: string | string[],
    subject: string,
    templateData: TemplateData
  ): Promise<void> {
    const html = `
      <h1>${templateData.title}</h1>
      <p>${templateData.content}</p>
    `;

    await this.sendEmail({
      to,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();
