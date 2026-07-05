const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;

  // Check if SMTP configuration is set in .env
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // If not configured, use Ethereal Email for testing/development
    console.log('No email configurations found. Creating an Ethereal Email test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      
      console.log(`Ethereal test account created successfully: ${testAccount.user}`);
    } catch (err) {
      console.error('Error creating Ethereal test account, sending emails will fail:', err.message);
      throw err;
    }
  }

  const mailOptions = {
    from: `"Auth Support" <noreply@example.com>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);

  console.log(`Message sent: ${info.messageId}`);
  
  // If using Ethereal Email, log the preview URL
  if (nodemailer.getTestMessageUrl(info)) {
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    // Attach the preview URL to the info response so we can inspect it in controller logs
    info.previewUrl = nodemailer.getTestMessageUrl(info);
  }

  return info;
};

module.exports = sendEmail;
