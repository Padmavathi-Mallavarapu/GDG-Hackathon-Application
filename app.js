import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged 
} from "firebase/auth";
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    setDoc, 
    getDoc,
    query,
    where,
    updateDoc,
    orderBy,
    Timestamp 
} from "firebase/firestore";

let currentUser = null;
let currentUserData = null;

// Authentication State Observer
onAuthStateChanged(auth, async (user) => {
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
        await signInWithEmailAndPassword(auth, email, password);
        hideLoading();
    } catch (error) {
        hideLoading();
        alert('Login failed: ' + error.message);
    }
};

// Signup Function
window.signup = async function() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const phone = document.getElementById('signupPhone').value;
    const role = document.getElementById('signupRole').value;

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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
            name: name,
            email: email,
            phoneNumber: phone,
            role: role,
            createdAt: Timestamp.now()
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
        await signOut(auth);
        showAuthSection();
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
};

// Load User Data
async function loadUserData() {
    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
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
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').style.display = 'block';
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load data for the selected tab
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
        createdAt: Timestamp.now()
    };

    if (!studentData.name || !studentData.rollNumber || !studentData.class) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        showLoading();
        await addDoc(collection(db, "students"), studentData);
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
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        status: 'pending',
        createdAt: Timestamp.now()
    };

    try {
        showLoading();
        await addDoc(collection(db, "feeRecords"), feeData);
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
        
        // Add payment record
        await addDoc(collection(db, "payments"), {
            studentId: studentId,
            amount: amount,
            paymentDate: Timestamp.fromDate(new Date(paymentDate)),
            method: method,
            receiptNumber: receiptNumber,
            recordedBy: currentUser.uid,
            createdAt: Timestamp.now()
        });

        // Update fee record
        const feeQuery = query(collection(db, "feeRecords"), where("studentId", "==", studentId));
        const feeSnapshot = await getDocs(feeQuery);
        
        if (!feeSnapshot.empty) {
            const feeDoc = feeSnapshot.docs[0];
            const feeData = feeDoc.data();
            const newPaidAmount = feeData.paidAmount + amount;
            const newRemainingAmount = feeData.totalFee - newPaidAmount;
            
            await updateDoc(doc(db, "feeRecords", feeDoc.id), {
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newRemainingAmount <= 0 ? 'paid' : 'pending',
                updatedAt: Timestamp.now()
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
        const studentsSnapshot = await getDocs(collection(db, "students"));
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
        const feesSnapshot = await getDocs(collection(db, "feeRecords"));
        const studentsSnapshot = await getDocs(collection(db, "students"));
        
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
        const paymentsSnapshot = await getDocs(collection(db, "payments"));
        const studentsSnapshot = await getDocs(collection(db, "students"));
        
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
        const feesSnapshot = await getDocs(collection(db, "feeRecords"));
        const studentsSnapshot = await getDocs(collection(db, "students"));
        
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
                    row.innerHTML = `
                        <td>${student.name}</td>
                        <td>${student.parentContact}</td>
                        <td>₹${fee.remainingAmount}</td>
                        <td>${dueDate.toLocaleDateString()}</td>
                        <td><span class="status ${isOverdue ? 'overdue' : 'warning'}">${isOverdue ? 'OVERDUE' : 'DUE SOON'}</span></td>
                        <td><button onclick="sendReminder('${student.parentContact}', '${student.name}', ${fee.remainingAmount})" class="primary-btn">Send Reminder</button></td>
                    `;
                }
            }
        });

        document.getElementById('overdueCount').textContent = overdueCount;
        document.getElementById('dueSoonCount').textContent = dueSoonCount;
    } catch (error) {
        console.error('Error loading reminders:', error);
    }
}

// Send Reminder (placeholder - you would integrate SMS/Email service here)
window.sendReminder = function(contact, studentName, amount) {
    alert(`Reminder would be sent to ${contact}:\n\nDear Parent,\n\nThis is a reminder that ${studentName} has a pending fee of ₹${amount}. Please clear the dues at the earliest.\n\nThank you!`);
};

// Load Student Dashboard Data
async function loadStudentData() {
    try {
        // Find student record
        const studentsQuery = query(collection(db, "students"), where("email", "==", currentUser.email));
        const studentsSnapshot = await getDocs(studentsQuery);
        
        if (!studentsSnapshot.empty) {
            const studentDoc = studentsSnapshot.docs[0];
            const studentId = studentDoc.id;
            
            // Load fee records
            const feeQuery = query(collection(db, "feeRecords"), where("studentId", "==", studentId));
            const feeSnapshot = await getDocs(feeQuery);
            
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
            
            // Load payment history
            const paymentsQuery = query(collection(db, "payments"), where("studentId", "==", studentId));
            const paymentsSnapshot = await getDocs(paymentsQuery);
            
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
        const studentsSnapshot = await getDocs(collection(db, "students"));
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