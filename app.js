// app.js - Students signup automatically, admin created manually
let currentUser = null;
let currentUserData = null;

// Authentication State Observer
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData();
    } else {
        currentUser = null;
        currentUserData = null;
        showAuthSection();
    }
});

// Show/Hide Functions
function showAuthSection() {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('studentDashboard').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    document.getElementById('studentDashboard').style.display = 'none';
    document.getElementById('adminName').textContent = currentUserData.name;
    loadAdminData();
}

function showStudentDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('studentDashboard').style.display = 'block';
    document.getElementById('studentName').textContent = currentUserData.name;
    loadStudentData();
}

// Login Function
window.login = async function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        showLoading();
        await firebase.auth().signInWithEmailAndPassword(email, password);
        hideLoading();
    } catch (error) {
        hideLoading();
        alert('Login failed: ' + error.message);
    }
};

// Signup Function (Always creates as student)
window.signup = async function() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const phone = document.getElementById('signupPhone').value;

    if (!name || !email || !password || !phone) {
        alert('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        showLoading();
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Create user document in Firestore - ALWAYS as 'student'
        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            phoneNumber: phone,
            role: 'student',  // Always set to student
            createdAt: firebase.firestore.Timestamp.now()
        });

        hideLoading();
        alert('Account created successfully!');
    } catch (error) {
        hideLoading();
        alert('Signup failed: ' + error.message);
    }
};

// Logout Function
window.logout = async function() {
    try {
        await firebase.auth().signOut();
        showAuthSection();
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
};

// Load User Data
async function loadUserData() {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            currentUserData = { id: userDoc.id, ...userDoc.data() };
            
            if (currentUserData.role === 'admin') {
                showAdminDashboard();
            } else {
                showStudentDashboard();
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Tab Navigation
window.showTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + 'Tab').style.display = 'block';
    event.target.classList.add('active');
    
    if (tabName === 'students') loadStudents();
    else if (tabName === 'fees') loadFees();
    else if (tabName === 'payments') loadPayments();
    else if (tabName === 'reminders') loadReminders();
};

// Show/Hide Forms
window.showLogin = function() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
};

window.showSignup = function() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
};

window.showAddStudentForm = function() {
    document.getElementById('addStudentForm').style.display = 'block';
};

window.hideAddStudentForm = function() {
    document.getElementById('addStudentForm').style.display = 'none';
    clearStudentForm();
};

window.showAddFeeForm = function() {
    document.getElementById('addFeeForm').style.display = 'block';
    populateStudentSelect('feeStudentSelect');
};

window.hideAddFeeForm = function() {
    document.getElementById('addFeeForm').style.display = 'none';
};

window.showAddPaymentForm = function() {
    document.getElementById('addPaymentForm').style.display = 'block';
    populateStudentSelect('paymentStudentSelect');
};

window.hideAddPaymentForm = function() {
    document.getElementById('addPaymentForm').style.display = 'none';
};

// Add Student
window.addStudent = async function() {
    const studentData = {
        name: document.getElementById('studentName').value,
        rollNumber: document.getElementById('rollNumber').value,
        class: document.getElementById('studentClass').value,
        section: document.getElementById('section').value,
        email: document.getElementById('studentEmail').value,
        parentContact: document.getElementById('parentContact').value,
        createdAt: firebase.firestore.Timestamp.now()
    };

    if (!studentData.name || !studentData.rollNumber || !studentData.class) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        showLoading();
        await firebase.firestore().collection('students').add(studentData);
        hideLoading();
        alert('Student added successfully!');
        hideAddStudentForm();
        loadStudents();
    } catch (error) {
        hideLoading();
        alert('Error adding student: ' + error.message);
    }
};

// Add Fee Record
window.addFeeRecord = async function() {
    const studentId = document.getElementById('feeStudentSelect').value;
    const academicYear = document.getElementById('academicYear').value;
    const totalFee = parseFloat(document.getElementById('totalFee').value);
    const dueDate = document.getElementById('dueDate').value;

    if (!studentId || !academicYear || !totalFee || !dueDate) {
        alert('Please fill in all fields');
        return;
    }

    const feeData = {
        studentId: studentId,
        academicYear: academicYear,
        totalFee: totalFee,
        paidAmount: 0,
        remainingAmount: totalFee,
        dueDate: firebase.firestore.Timestamp.fromDate(new Date(dueDate)),
        status: 'pending',
        createdAt: firebase.firestore.Timestamp.now()
    };

    try {
        showLoading();
        await firebase.firestore().collection('feeRecords').add(feeData);
        hideLoading();
        alert('Fee record added successfully!');
        hideAddFeeForm();
        loadFees();
    } catch (error) {
        hideLoading();
        alert('Error adding fee record: ' + error.message);
    }
};

// Add Payment
window.addPayment = async function() {
    const studentId = document.getElementById('paymentStudentSelect').value;
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const paymentDate = document.getElementById('paymentDate').value;
    const method = document.getElementById('paymentMethod').value;
    const receiptNumber = document.getElementById('receiptNumber').value;

    if (!studentId || !amount || !paymentDate || !method || !receiptNumber) {
        alert('Please fill in all fields');
        return;
    }

    try {
        showLoading();
        
        await firebase.firestore().collection('payments').add({
            studentId: studentId,
            amount: amount,
            paymentDate: firebase.firestore.Timestamp.fromDate(new Date(paymentDate)),
            method: method,
            receiptNumber: receiptNumber,
            recordedBy: currentUser.uid,
            createdAt: firebase.firestore.Timestamp.now()
        });

        const feeQuery = firebase.firestore().collection('feeRecords').where("studentId", "==", studentId);
        const feeSnapshot = await feeQuery.get();
        
        if (!feeSnapshot.empty) {
            const feeDoc = feeSnapshot.docs[0];
            const feeData = feeDoc.data();
            const newPaidAmount = feeData.paidAmount + amount;
            const newRemainingAmount = feeData.totalFee - newPaidAmount;
            
            await firebase.firestore().collection('feeRecords').doc(feeDoc.id).update({
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newRemainingAmount <= 0 ? 'paid' : 'pending',
                updatedAt: firebase.firestore.Timestamp.now()
            });
        }

        hideLoading();
        alert('Payment recorded successfully!');
        hideAddPaymentForm();
        loadPayments();
        loadFees();
    } catch (error) {
        hideLoading();
        alert('Error recording payment: ' + error.message);
    }
};

// Load Admin Data
async function loadAdminData() {
    loadStudents();
}

// Load Students
async function loadStudents() {
    try {
        const studentsSnapshot = await firebase.firestore().collection('students').get();
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = '';

        studentsSnapshot.forEach((doc) => {
            const student = doc.data();
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${student.rollNumber}</td>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.section}</td>
                <td>${student.email}</td>
                <td>${student.parentContact}</td>
            `;
        });
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Load Fees
async function loadFees() {
    try {
        const feesSnapshot = await firebase.firestore().collection('feeRecords').get();
        const studentsSnapshot = await firebase.firestore().collection('students').get();
        
        const studentsMap = {};
        studentsSnapshot.forEach(doc => {
            studentsMap[doc.id] = doc.data();
        });

        const tbody = document.getElementById('feesTableBody');
        tbody.innerHTML = '';

        feesSnapshot.forEach((doc) => {
            const fee = doc.data();
            const student = studentsMap[fee.studentId];
            
            if (student) {
                const dueDate = fee.dueDate.toDate();
                const isOverdue = dueDate < new Date() && fee.status !== 'paid';
                
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${student.name}</td>
                    <td>${student.rollNumber}</td>
                    <td>${fee.academicYear}</td>
                    <td>₹${fee.totalFee}</td>
                    <td>₹${fee.paidAmount}</td>
                    <td>₹${fee.remainingAmount}</td>
                    <td>${dueDate.toLocaleDateString()}</td>
                    <td><span class="status ${isOverdue ? 'overdue' : fee.status}">${isOverdue ? 'OVERDUE' : fee.status.toUpperCase()}</span></td>
                `;
            }
        });
    } catch (error) {
        console.error('Error loading fees:', error);
    }
}

// Load Payments
async function loadPayments() {
    try {
        const paymentsSnapshot = await firebase.firestore().collection('payments').get();
        const studentsSnapshot = await firebase.firestore().collection('students').get();
        
        const studentsMap = {};
        studentsSnapshot.forEach(doc => {
            studentsMap[doc.id] = doc.data();
        });

        const tbody = document.getElementById('paymentsTableBody');
        tbody.innerHTML = '';

        paymentsSnapshot.forEach((doc) => {
            const payment = doc.data();
            const student = studentsMap[payment.studentId];
            
            if (student) {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${payment.paymentDate.toDate().toLocaleDateString()}</td>
                    <td>${student.name}</td>
                    <td>₹${payment.amount}</td>
                    <td>${payment.method}</td>
                    <td>${payment.receiptNumber}</td>
                `;
            }
        });
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

// Load Reminders
async function loadReminders() {
    try {
        const feesSnapshot = await firebase.firestore().collection('feeRecords').get();
        const studentsSnapshot = await firebase.firestore().collection('students').get();
        
        const studentsMap = {};
        studentsSnapshot.forEach(doc => {
            studentsMap[doc.id] = doc.data();
        });

        const tbody = document.getElementById('remindersTableBody');
        tbody.innerHTML = '';
        
        let overdueCount = 0;
        let dueSoonCount = 0;
        const today = new Date();
        const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        feesSnapshot.forEach((doc) => {
            const fee = doc.data();
            const student = studentsMap[fee.studentId];
            
            if (student && fee.status !== 'paid') {
                const dueDate = fee.dueDate.toDate();
                const isOverdue = dueDate < today;
                const isDueSoon = dueDate >= today && dueDate <= sevenDaysFromNow;
                
                if (isOverdue) overdueCount++;
                if (isDueSoon) dueSoonCount++;
                
                if (isOverdue || isDueSoon) {
                    const row = tbody.insertRow();
                    const day = String(dueDate.getDate()).padStart(2, '0');
                    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
                    const year = dueDate.getFullYear();
                    const displayDate = `${day}/${month}/${year}`;
                    const statusText = isOverdue ? 'OVERDUE' : 'DUE SOON';
                    
                    const emailBtn = `<button class="primary-btn send-reminder-btn" 
                        data-email="${student.email || ''}" 
                        data-name="${student.name}" 
                        data-remaining="${fee.remainingAmount}" 
                        data-date="${displayDate}" 
                        data-total="${fee.totalFee}" 
                        data-paid="${fee.paidAmount}" 
                        data-status="${statusText}">Send Email</button>`;
                    
                    row.innerHTML = `
                        <td>${student.name}</td>
                        <td>${student.email || 'No email'}</td>
                        <td>₹${fee.remainingAmount}</td>
                        <td>${displayDate}</td>
                        <td><span class="status ${isOverdue ? 'overdue' : 'warning'}">${statusText}</span></td>
                        <td>${emailBtn}</td>
                    `;
                }
            }
        });

        document.getElementById('overdueCount').textContent = overdueCount;
        document.getElementById('dueSoonCount').textContent = dueSoonCount;
        
        document.querySelectorAll('.send-reminder-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.getAttribute('data-email');
                const name = this.getAttribute('data-name');
                const remaining = this.getAttribute('data-remaining');
                const date = this.getAttribute('data-date');
                const total = this.getAttribute('data-total');
                const paid = this.getAttribute('data-paid');
                const status = this.getAttribute('data-status');
                
                sendReminder(email, name, remaining, date, total, paid, status);
            });
        });
    } catch (error) {
        console.error('Error loading reminders:', error);
    }
}

// Send Reminder Email
window.sendReminder = async function(parentEmail, studentName, remainingAmount, dueDate, totalFee, paidAmount, status) {
    console.log('sendReminder called with:', { parentEmail, studentName, remainingAmount, dueDate, totalFee, paidAmount, status });
    
    if (!parentEmail || !parentEmail.includes('@')) {
        alert('Invalid email address. Please update the student record with a valid email.');
        return;
    }

    const confirmed = confirm(`Send fee reminder email to ${parentEmail} for ${studentName}?`);
    
    if (!confirmed) {
        console.log('User cancelled');
        return;
    }

    console.log('Sending email...');
    showLoading();
    
    const result = await sendReminderEmail(
        parentEmail,
        studentName,
        remainingAmount,
        dueDate,
        totalFee,
        paidAmount,
        status
    );
    
    console.log('Email result:', result);
    hideLoading();
    
    if (result.success) {
        alert('✅ Reminder email sent successfully to ' + parentEmail);
    } else {
        alert('❌ Failed to send email: ' + result.message);
    }
};

// Load Student Dashboard Data
async function loadStudentData() {
    try {
        const studentsQuery = firebase.firestore().collection('students').where("email", "==", currentUser.email);
        const studentsSnapshot = await studentsQuery.get();
        
        if (!studentsSnapshot.empty) {
            const studentDoc = studentsSnapshot.docs[0];
            const studentId = studentDoc.id;
            
            const feeQuery = firebase.firestore().collection('feeRecords').where("studentId", "==", studentId);
            const feeSnapshot = await feeQuery.get();
            
            const feeInfoDiv = document.getElementById('studentFeeInfo');
            feeInfoDiv.innerHTML = '';
            
            if (!feeSnapshot.empty) {
                feeSnapshot.forEach(doc => {
                    const fee = doc.data();
                    const dueDate = fee.dueDate.toDate();
                    const isOverdue = dueDate < new Date() && fee.status !== 'paid';
                    
                    feeInfoDiv.innerHTML += `
                        <div class="fee-card ${isOverdue ? 'overdue-card' : ''}">
                            <h3>Academic Year: ${fee.academicYear}</h3>
                            <p><strong>Total Fee:</strong> ₹${fee.totalFee}</p>
                            <p><strong>Paid Amount:</strong> ₹${fee.paidAmount}</p>
                            <p><strong>Remaining:</strong> ₹${fee.remainingAmount}</p>
                            <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span class="status ${isOverdue ? 'overdue' : fee.status}">${isOverdue ? 'OVERDUE' : fee.status.toUpperCase()}</span></p>
                        </div>
                    `;
                });
            } else {
                feeInfoDiv.innerHTML = '<p>No fee records found.</p>';
            }
            
            const paymentsQuery = firebase.firestore().collection('payments').where("studentId", "==", studentId);
            const paymentsSnapshot = await paymentsQuery.get();
            
            const tbody = document.getElementById('studentPaymentsTableBody');
            tbody.innerHTML = '';
            
            paymentsSnapshot.forEach(doc => {
                const payment = doc.data();
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${payment.paymentDate.toDate().toLocaleDateString()}</td>
                    <td>₹${payment.amount}</td>
                    <td>${payment.method}</td>
                    <td>${payment.receiptNumber}</td>
                `;
            });
        }
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

// Populate Student Select Dropdown
async function populateStudentSelect(selectId) {
    try {
        const studentsSnapshot = await firebase.firestore().collection('students').get();
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select Student</option>';
        
        studentsSnapshot.forEach(doc => {
            const student = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${student.name} (${student.rollNumber})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating student select:', error);
    }
}

// Clear Forms
function clearStudentForm() {
    document.getElementById('studentName').value = '';
    document.getElementById('rollNumber').value = '';
    document.getElementById('studentClass').value = '';
    document.getElementById('section').value = '';
    document.getElementById('studentEmail').value = '';
    document.getElementById('parentContact').value = '';
}

// Loading Spinner
function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}
