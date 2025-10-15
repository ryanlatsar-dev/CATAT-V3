// Global variables
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwNrRhfntHGKA0JHd-8yHp6r5n08L1rdSjEkrQCxMPAw5pqcsLe50RRRgLIwiJoT712_w/exec';
let borrowData = [];
let borrowerSelect; // Moved to global scope

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Buttons
    const borrowButton = document.getElementById('borrowButton');
    const returnButton = document.getElementById('returnButton');
    const cancelBorrowButton = document.getElementById('cancelBorrow');
    const cancelReturnButton = document.getElementById('cancelReturn');
    
    // Forms
    const borrowingForm = document.getElementById('borrowingForm');
    const returnForm = document.getElementById('returnForm');
    const borrowFormElement = document.getElementById('borrowForm');
    const returnFormElement = document.getElementById('returnFormElement');
    
    // Other elements
    borrowerSelect = document.getElementById('borrowerSelect'); // Assigned to global variable
    const borrowInfo = document.getElementById('borrowInfo');
    const otherItem = document.getElementById('otherItem');
    const otherItemText = document.getElementById('otherItemText');
    
    // Set current date and time
    const borrowDate = document.getElementById('borrowDate');
    const now = new Date();
    borrowDate.value = formatDateTime(now);
    
    // Event Listeners
    borrowButton.addEventListener('click', () => {
        borrowingForm.classList.remove('hidden');
        returnForm.classList.add('hidden');
        document.querySelector('.service-selection').classList.add('hidden');
    });
    
    returnButton.addEventListener('click', () => {
        returnForm.classList.remove('hidden');
        borrowingForm.classList.add('hidden');
        document.querySelector('.service-selection').classList.add('hidden');
        loadBorrowers();
    });
    
    cancelBorrowButton.addEventListener('click', () => {
        borrowFormElement.reset();
        borrowingForm.classList.add('hidden');
        document.querySelector('.service-selection').classList.remove('hidden');
    });
    
    cancelReturnButton.addEventListener('click', () => {
        returnFormElement.reset();
        returnForm.classList.add('hidden');
        borrowInfo.classList.add('hidden');
        document.querySelector('.service-selection').classList.remove('hidden');
    });
    
    otherItem.addEventListener('change', () => {
        otherItemText.disabled = !otherItem.checked;
        if (!otherItem.checked) {
            otherItemText.value = '';
        }
    });
    
    borrowerSelect.addEventListener('change', () => {
        const selectedBorrower = borrowerSelect.value;
        if (selectedBorrower) {
            // Find the borrower data by ID
            const borrower = borrowData.find(item => item.id === selectedBorrower);
            
            if (borrower) {
                displayBorrowerInfo(borrower);
                borrowInfo.classList.remove('hidden');
            } else {
                borrowInfo.classList.add('hidden');
            }
        } else {
            borrowInfo.classList.add('hidden');
        }
    });
    
    // Form submissions
    borrowFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        submitBorrowForm();
    });
    
    returnFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        submitReturnForm();
    });
    
    // Initialize
    otherItemText.disabled = true;
});

// Helper Functions
function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

function showSuccessPopup(title, message) {
    const popup = document.getElementById('successPopup');
    const titleElement = document.getElementById('successTitle');
    const messageElement = document.getElementById('successMessage');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    popup.classList.remove('hidden');
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 300);
    }, 3000);
}

function showNotification(message, isSuccess = true) {
    // Only use for error notifications now
    if (!isSuccess) {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        
        notification.style.backgroundColor = '#e74c3c';
        notificationMessage.textContent = message;
        
        notification.classList.remove('hidden');
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 300);
        }, 3000);
    }
}

function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const buttonText = button.querySelector('.button-text');
    const loadingSpinner = button.querySelector('.loading-spinner');
    
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        buttonText.style.opacity = '0';
        loadingSpinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        buttonText.style.opacity = '1';
        loadingSpinner.classList.add('hidden');
    }
}

function getSelectedItems() {
    const checkboxes = document.querySelectorAll('input[name="items"]:checked');
    let items = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.value === 'other') {
            const otherValue = document.getElementById('otherItemText').value.trim();
            if (otherValue) {
                items.push(otherValue);
            }
        } else {
            items.push(checkbox.value);
        }
    });
    
    return items.join(', ');
}

function displayBorrowerInfo(borrower) {
    document.getElementById('infoName').textContent = borrower["Nama Lengkap"] || '-';
    document.getElementById('infoUnit').textContent = borrower["Unit"] || '-';
    document.getElementById('infoContact').textContent = borrower["Kontak"] || '-';
    document.getElementById('infoBorrowDate').textContent = borrower["Tanggal Peminjaman"] || '-';
    document.getElementById('infoPurpose').textContent = borrower["Tujuan"] || '-';
    document.getElementById('infoCondition').textContent = borrower["Kondisi Awal"] || '-';
    document.getElementById('infoItems').textContent = borrower["Barang"] || '-';
}

// Google Sheets API Integration
async function loadBorrowers() {
    try {
        console.log('Memulai loadBorrowers() - Refresh dropdown peminjam');
        
        // Fetch fresh data from Google Sheets
        const response = await fetch(WEB_APP_URL + '?action=getBorrowData&timestamp=' + Date.now());
        const data = await response.json();
        
        console.log('Respons API (fresh data):', data);
        
        if (data.success) {
            borrowData = data.data;
            console.log('Data peminjam terbaru:', borrowData);
            
            // Clear previous options completely
            borrowerSelect.innerHTML = '<option value="">-- Pilih Peminjam --</option>';
            
            // Add borrowers to select
            let borrowersAdded = 0;
            let borrowersFiltered = 0;
            
            borrowData.forEach(borrower => {
                console.log('Memproses peminjam:', borrower['Nama Lengkap']);
                console.log('Status pengembalian:', borrower.returned, 'Type:', typeof borrower.returned);
                
                // Tampilkan peminjam yang belum mengembalikan barang (bukan "Sudah")
                if (borrower.returned !== "Sudah" && borrower["Nama Lengkap"] && borrower["Tanggal Peminjaman"]) {
                    const option = document.createElement('option');
                    option.value = borrower.id;
                    
                    // Gunakan properti yang benar dari spreadsheet
                    const fullName = borrower["Nama Lengkap"] || "Tidak ada nama";
                    let borrowDate;
                    
                    try {
                        // Coba parse tanggal dengan format yang benar
                        const dateParts = borrower["Tanggal Peminjaman"].split(',')[0].split('/');
                        if (dateParts.length === 3) {
                            // Format DD/MM/YYYY
                            borrowDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
                            if (isNaN(borrowDate.getTime())) {
                                borrowDate = new Date(); // Gunakan tanggal hari ini jika parsing gagal
                            }
                        } else {
                            borrowDate = new Date(); // Gunakan tanggal hari ini jika format tidak sesuai
                        }
                    } catch (e) {
                        console.error('Error parsing date:', e);
                        borrowDate = new Date(); // Gunakan tanggal hari ini jika terjadi error
                    }
                    
                    option.textContent = `${fullName} - ${formatDate(borrowDate)}`;
                    borrowerSelect.appendChild(option);
                    borrowersAdded++;
                } else if (borrower.returned === "Sudah") {
                    borrowersFiltered++;
                    console.log(`Peminjam ${borrower['Nama Lengkap']} disembunyikan karena status "Sudah"`);
                }
            });
            
            console.log(`${borrowersAdded} peminjam aktif ditambahkan ke dropdown`);
            console.log(`${borrowersFiltered} peminjam dengan status "Sudah" disembunyikan`);
            
            if (borrowersAdded === 0) {
                console.log('Tidak ada peminjam aktif tersedia');
                showNotification('Tidak ada data peminjam yang aktif', false);
            } else {
                console.log(`Dropdown berhasil diperbarui dengan ${borrowersAdded} peminjam aktif`);
            }
        } else {
            console.error('API mengembalikan status tidak sukses:', data);
            showNotification('Gagal memuat data peminjam', false);
        }
    } catch (error) {
        console.error('Error loading borrowers:', error);
        showNotification('Terjadi kesalahan saat memuat data', false);
    }
}

async function submitBorrowForm() {
    const fullName = document.getElementById('fullName').value;
    const unit = document.getElementById('unit').value;
    const contact = document.getElementById('contact').value;
    const borrowDate = document.getElementById('borrowDate').value;
    const items = getSelectedItems();
    const condition = document.querySelector('input[name="condition"]:checked').value;
    const purpose = document.getElementById('purpose').value;
    
    if (!items) {
        showNotification('Pilih minimal satu barang yang dipinjam', false);
        return;
    }
    
    // Set loading state
    setButtonLoading('submitBorrow', true);
    
    const formData = {
        fullName,
        unit,
        contact,
        borrowDate,
        items,
        condition,
        purpose,
        returned: false
    };
    
    try {
        console.log('Mengirim data peminjaman:', formData);
        // Send data to Google Sheets
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'addBorrowData',
                data: formData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccessPopup('Peminjaman Berhasil!', 'Data peminjaman telah disimpan dan tercatat dalam sistem.');
            document.getElementById('borrowForm').reset();
            document.getElementById('borrowDate').value = formatDateTime(new Date());
            document.getElementById('otherItemText').disabled = true;
            
            // Return to service selection
            document.getElementById('borrowingForm').classList.add('hidden');
            document.querySelector('.service-selection').classList.remove('hidden');
        } else {
            showNotification('Gagal menyimpan data peminjaman', false);
        }
    } catch (error) {
        console.error('Error submitting borrow form:', error);
        showNotification('Terjadi kesalahan saat menyimpan data', false);
    } finally {
        // Remove loading state
        setButtonLoading('submitBorrow', false);
    }
}

async function submitReturnForm() {
    const selectedBorrower = borrowerSelect.value;
    if (!selectedBorrower) {
        showNotification('Pilih peminjam terlebih dahulu', false);
        return;
    }
    
    console.log('Nilai borrowerSelect yang dipilih:', selectedBorrower);
    
    const returnCondition = document.querySelector('input[name="returnCondition"]:checked').value;
    const notes = document.getElementById('notes').value;
    
    // Find the borrower data by ID
    const borrower = borrowData.find(item => item.id === selectedBorrower);
    
    console.log('Data peminjam yang ditemukan:', borrower);
    
    if (!borrower) {
        showNotification('Data peminjam tidak ditemukan', false);
        return;
    }
    
    const returnDate = formatDateTime(new Date());
    
    // Set loading state
    setButtonLoading('submitReturn', true);
    
    try {
        console.log('Mengirim data pengembalian:', borrower.id);
        // Send data to Google Sheets
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateReturnData',
                data: {
                    id: borrower.id,
                    returnDate,
                    returnCondition,
                    notes
                }
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success popup
            showSuccessPopup('Pengembalian Berhasil!', `Pengembalian dari ${borrower['Nama Lengkap']} telah diproses.`);
            
            // Update local data immediately
            const borrowerIndex = borrowData.findIndex(item => item.id === borrower.id);
            if (borrowerIndex !== -1) {
                borrowData[borrowerIndex].returned = 'Sudah';
                console.log('Status lokal diperbarui:', borrowData[borrowerIndex]);
            }
            
            document.getElementById('returnFormElement').reset();
            document.getElementById('borrowInfo').classList.add('hidden');
            
            // Reset dropdown selection
            borrowerSelect.value = '';
            
            // Reload borrowers to refresh the list
            await loadBorrowers();
            
            // Return to service selection
            document.getElementById('returnForm').classList.add('hidden');
            document.querySelector('.service-selection').classList.remove('hidden');
        } else {
            showNotification('Gagal menyimpan data pengembalian', false);
        }
    } catch (error) {
        console.error('Error submitting return form:', error);
        showNotification('Terjadi kesalahan saat menyimpan data', false);
    } finally {
        // Remove loading state
        setButtonLoading('submitReturn', false);
    }
}