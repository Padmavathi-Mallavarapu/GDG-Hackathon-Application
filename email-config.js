// EmailJS Configuration
export const EMAIL_CONFIG = {
    PUBLIC_KEY: '97bIUkxhkjz0TfHD5',
    SERVICE_ID: 'StudentFeeReminder',
    TEMPLATE_ID: 'template_aj6u24l'
};

// Initialize EmailJS
export function initEmailJS() {
    emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
}

// Format date to readable text format (no operators)
function formatDateForEmail(dateString) {
    // Convert "06/01/2026" to "06 January 2026"
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    
    const parts = dateString.split('/');
    if (parts.length === 3) {
        const day = parts[0];
        const monthIndex = parseInt(parts[1]) - 1;
        const year = parts[2];
        return `${day} ${months[monthIndex]} ${year}`;
    }
    return dateString;
}

// Send reminder email
export async function sendReminderEmail(parentEmail, studentName, remainingAmount, dueDate, totalFee, paidAmount, status) {
    const formattedDate = formatDateForEmail(dueDate);
    
    const templateParams = {
        to_email: parentEmail,
        student_name: studentName,
        remaining_amount: remainingAmount,
        due_date: formattedDate,
        total_fee: totalFee,
        paid_amount: paidAmount,
        status: status
    };

    try {
        const response = await emailjs.send(
            EMAIL_CONFIG.SERVICE_ID,
            EMAIL_CONFIG.TEMPLATE_ID,
            templateParams
        );
        console.log('Email sent successfully:', response);
        return { success: true, message: 'Email sent successfully!' };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, message: 'Failed to send email: ' + error.text };
    }
}