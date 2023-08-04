const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 2525,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // define the email options
    const mailOptions = {
        from: 'Blog App <blogapp@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }

    // send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;