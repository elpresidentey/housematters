const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// Initialize email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

// Cache for compiled email templates
const templateCache = new Map();

// Load and compile email template
async function loadTemplate(templateName) {
    if (templateCache.has(templateName)) {
        return templateCache.get(templateName);
    }

    const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);
    templateCache.set(templateName, template);
    return template;
}

// Send email using template
async function sendEmail(to, subject, templateName, data) {
    try {
        const template = await loadTemplate(templateName);
        const html = template(data);

        const mailOptions = {
            from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
}

// Notification types
const notifications = {
    // Auth related notifications
    async sendWelcomeEmail(user) {
        return sendEmail(
            user.email,
            'Welcome to House Matters!',
            'welcome',
            {
                name: user.name,
                loginLink: `${process.env.FRONTEND_URL}/login`
            }
        );
    },

    async sendPasswordResetEmail(user, resetToken) {
        return sendEmail(
            user.email,
            'Reset Your Password',
            'password-reset',
            {
                name: user.name,
                resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
            }
        );
    },

    // Booking related notifications
    async sendBookingRequestToOwner(booking, property, tenant) {
        return sendEmail(
            property.owner.email,
            'New Booking Request',
            'booking-request-owner',
            {
                ownerName: property.owner.name,
                propertyTitle: property.title,
                tenantName: tenant.name,
                startDate: booking.startDate,
                endDate: booking.endDate,
                message: booking.message,
                actionLink: `${process.env.FRONTEND_URL}/bookings/${booking.id}`
            }
        );
    },

    async sendBookingRequestToTenant(booking, property) {
        return sendEmail(
            booking.user.email,
            'Booking Request Submitted',
            'booking-request-tenant',
            {
                tenantName: booking.user.name,
                propertyTitle: property.title,
                startDate: booking.startDate,
                endDate: booking.endDate,
                actionLink: `${process.env.FRONTEND_URL}/bookings/${booking.id}`
            }
        );
    },

    async sendBookingStatusUpdate(booking, property) {
        return sendEmail(
            booking.user.email,
            `Booking ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`,
            'booking-status-update',
            {
                tenantName: booking.user.name,
                propertyTitle: property.title,
                status: booking.status,
                startDate: booking.startDate,
                endDate: booking.endDate,
                actionLink: `${process.env.FRONTEND_URL}/bookings/${booking.id}`
            }
        );
    },

    // Message related notifications
    async sendNewMessageNotification(message, sender, receiver) {
        return sendEmail(
            receiver.email,
            'New Message Received',
            'new-message',
            {
                receiverName: receiver.name,
                senderName: sender.name,
                messagePreview: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
                actionLink: `${process.env.FRONTEND_URL}/messages/${sender.id}`
            }
        );
    },

    // Property related notifications
    async sendPropertyUpdateToInterested(property, interestedUsers) {
        const emailPromises = interestedUsers.map(user => 
            sendEmail(
                user.email,
                'Property Update: ' + property.title,
                'property-update',
                {
                    userName: user.name,
                    propertyTitle: property.title,
                    propertyLink: `${process.env.FRONTEND_URL}/properties/${property.id}`
                }
            )
        );

        return Promise.all(emailPromises);
    },

    // Weekly digests
    async sendWeeklyDigest(user, digest) {
        return sendEmail(
            user.email,
            'Your Weekly House Matters Update',
            'weekly-digest',
            {
                name: user.name,
                newProperties: digest.newProperties,
                upcomingBookings: digest.upcomingBookings,
                unreadMessages: digest.unreadMessages,
                actionLink: `${process.env.FRONTEND_URL}/dashboard`
            }
        );
    }
};

module.exports = notifications;