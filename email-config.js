// email-config.js
// Replace these values with YOUR actual EmailJS credentials
const emailConfig = {
  serviceId: "YOUR_SERVICE_ID",
  templateId: "YOUR_TEMPLATE_ID",
  publicKey: "YOUR_PUBLIC_KEY"
};

// Initialize EmailJS
emailjs.init(emailConfig.publicKey);

console.log("EmailJS initialized successfully!");

// Function to send reminder email
async function sendReminderEmail(parentEmail, studentName, remainingAmount, dueDate, totalFee, paidAmount, status) {
  try {
    console.log('Preparing to send email with EmailJS...');
    
    const templateParams = {
      to_email: parentEmail,
      student_name: studentName,
      remaining_amount: remainingAmount,
      due_date: dueDate,
      total_fee: totalFee,
      paid_amount: paidAmount,
      status: status
    };

    console.log('Template params:', templateParams);
    
    const response = await emailjs.send(
      emailConfig.serviceId,
      emailConfig.templateId,
      templateParams
    );
    
    console.log('EmailJS response:', response);
    
    return {
      success: true,
      message: 'Email sent successfully!'
    };
  } catch (error) {
    console.error('EmailJS error:', error);
    return {
      success: false,
      message: error.text || error.message || 'Failed to send email'
    };
  }
}

console.log("Email config loaded successfully!");
