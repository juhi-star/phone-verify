const logger = require("../utils/logger");

class SMSService {
  constructor() {
    this.client = null;
    this.fromNumber = null;
  }

  _getClient() {
    if (this.client) return this.client;

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      logger.warn("Twilio credentials missing. SMS sending disabled.");
      return null;
    }

    try {
      const twilio = require("twilio");
      this.client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      this.fromNumber = TWILIO_PHONE_NUMBER;
      return this.client;
    } catch (err) {
      logger.warn(`Twilio initialization failed (${err.message}). SMS sending disabled.`);
      return null;
    }
  }

  async sendOTP(toNumber, otp) {
    const client = this._getClient();
    if (!client) {
      logger.info(`[DEMO] SMS to ${toNumber}: Your code is ${otp}`);
      return { sid: "demo-sms-sid" };
    }

    const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 2;

    const message = await client.messages.create({
      body: `Your verification code is: ${otp}. It expires in ${expiryMinutes} minutes. Do not share this code with anyone.`,
      from: this.fromNumber,
      to: toNumber,
    });

    logger.info(`SMS sent to ${toNumber} | SID: ${message.sid}`);
    return message;
  }
}

module.exports = new SMSService();
