const nodemailer = require('nodemailer');
const sendEmail = require('../../../utils/email');

jest.mock('nodemailer');

describe('sendEmail', () => {

    afterAll(() => {
        jest.clearAllMocks();
    });

    it('should send email', async () => {

        const transporter = {
            sendMail: jest.fn().mockReturnValueOnce(true)
        };

        nodemailer.createTransport.mockReturnValueOnce(transporter);

        const options = {
            email: 'test@email.com',
            subject: 'subject',
            message: 'message',
        }

        await sendEmail(options);

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: process.env.EMAIL_HOST,
            port: 2525,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        expect(transporter.sendMail).toHaveBeenCalledWith({
            from: 'Blog App <blogapp@gmail.com>',
            to: options.email,
            subject: options.subject,
            text: options.message
        });
    });
});