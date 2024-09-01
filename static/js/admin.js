function reimbursementSystem() {
    return {
        pendingClaims: [],
        processedClaims: [],
        selectedClaimId: null,
        selectedClaim: null,
        employee: {
            name: 'John Cena',
            profilePicture: 'https://pyxis.nymag.com/v1/imgs/547/7eb/858f031ca8dd546c5ad0da7da900066bfb-18-john-cena.rsquare.w330.jpg',
            designation: 'Admin',
            email: 'john.cena@example.com',
            employeeId: '12345'
        },
        showEmployeeDetails: false,
        approvalForm: {
            eligibleReimbursement: 0,
            comments: ''
        },
        isLoggedIn: false,
        loginForm: {
            email: '',
            password: ''
        },
        isLoading: false,
        isClaimLoading: false,
        showImagePopup: false,
        popupImage: '',

        init() {
            this.checkLoginStatus();
        },

        checkLoginStatus() {
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            if (isLoggedIn === 'true') {
                this.isLoggedIn = true;
                this.fetchClaims();
            }
        },

        login() {
            // For demonstration purposes, we're using a hardcoded email and password
            // In a real application, this should be handled securely on the server side
            if (this.loginForm.email === 'admin@example.com' && this.loginForm.password === 'password123') {
                this.isLoggedIn = true;
                localStorage.setItem('isLoggedIn', 'true');
                this.fetchClaims();
            } else {
                alert('Invalid email or password. Please try again.');
            }
        },

        logout() {
            this.isLoggedIn = false;
            localStorage.removeItem('isLoggedIn');
            this.pendingClaims = [];
            this.processedClaims = [];
            this.selectedClaimId = null;
            this.selectedClaim = null;
        },

        fetchClaims() {
            this.isLoading = true;
            fetch('/api/claims')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    this.pendingClaims = data.filter(claim => !claim.processed);
                    this.processedClaims = data.filter(claim => claim.processed);
                    this.isLoading = false;
                })
                .catch(error => {
                    console.error('Error fetching claims:', error);
                    alert('Failed to fetch claims. Please try again.');
                    this.isLoading = false;
                });
        },

        selectClaim(claimId, type) {
            this.selectedClaimId = claimId;
            this.isClaimLoading = true;
            const endpoint = type === 'processed' ? `/api/claims/processed/${claimId}` : `/api/claims/${claimId}`;
            
            fetch(endpoint)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    this.selectedClaim = data;
                    if (type === 'pending' && data.analysis && data.analysis.eligible_reimbursement) {
                        this.approvalForm.eligibleReimbursement = data.analysis.eligible_reimbursement;
                    }
                    this.isClaimLoading = false;
                })
                .catch(error => {
                    console.error('Error fetching claim details:', error);
                    alert('Failed to fetch claim details. Please try again.');
                    this.isClaimLoading = false;
                });
        },

        approveClaim() {
            this.isClaimLoading = true;
            fetch(`/api/approve-claim/${this.selectedClaimId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.approvalForm),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('Claim approved successfully');
                    this.fetchClaims();
                    this.selectedClaim = null;
                } else {
                    throw new Error(data.message || 'Unknown error occurred');
                }
                this.isClaimLoading = false;
            })
            .catch(error => {
                console.error('Error approving claim:', error);
                alert('Failed to approve claim: ' + error.message);
                this.isClaimLoading = false;
            });
        },

        toggleEmployeeDetails() {
            this.showEmployeeDetails = !this.showEmployeeDetails;
        },

        formatCurrency(amount) {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
        },

        getItemCategory(item) {
            return item.category ? item.category : 'Uncategorized';
        },

        calculateTotalAmount(items) {
            return items.reduce((total, item) => total + item.amount, 0);
        },

        getInvoiceTotal(invoice) {
            return this.formatCurrency(invoice.gross_amount);
        },

        getClaimTotal(claim) {
            return this.formatCurrency(claim.gross_amount);
        },

        getAnalysisDeductions() {
            if (this.selectedClaim && this.selectedClaim.analysis && this.selectedClaim.analysis.deductions) {
                return Object.entries(this.selectedClaim.analysis.deductions);
            }
            return [];
        },

        isProcessed() {
            return this.selectedClaim && this.selectedClaim.processed;
        },

        openImagePopup(base64Image) {
            this.popupImage = base64Image;
            this.showImagePopup = true;
        },

        closeImagePopup() {
            this.showImagePopup = false;
            this.popupImage = '';
        }
    }
}