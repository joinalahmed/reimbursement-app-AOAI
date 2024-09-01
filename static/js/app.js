// app.js

function reimbursementSystem() {
    const employeeProfiles = [
        {
            name: 'John Doe',
            email: 'johndoe@example.com',
            designation: 'AI Architect',
            employeeId: 'EMP001',
            profilePicture: 'https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-profiles/avatar-1.webp'
        },
        {
            name: 'Jane Smith',
            email: 'janesmith@example.com',
            designation: 'Senior Developer',
            employeeId: 'EMP002',
            profilePicture: 'https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-profiles/avatar-2.webp'
        },
        {
            name: 'Mike Johnson',
            email: 'mikejohnson@example.com',
            designation: 'Project Manager',
            employeeId: 'EMP003',
            profilePicture: 'https://mdbcdn.b-cdn.net/img/new/avatars/2.webp'
        },
        {
            name: 'Emily Brown',
            email: 'emilybrown@example.com',
            designation: 'UX Designer',
            employeeId: 'EMP004',
            profilePicture: 'https://cdn.pixabay.com/photo/2021/02/27/16/25/woman-6055084_1280.jpg'
        },
        {
            name: 'Alex Lee',
            email: 'alexlee@example.com',
            designation: 'Data Scientist',
            employeeId: 'EMP005',
            profilePicture: 'https://image.api.playstation.com/cdn/UP1004/CUSA03041_00/wQYnx73VVaaHKanoA4EI44j6KxwO4eAj.png?w=440&thumb=false'
        }
    ];

    const exchangeRates = {
        '$': 74.5,
        'USD': 74.5,
        'EUR': 88.5,
        'GBP': 102.5,
        'INR': 1,
        '₹': 1 // Adding this to handle the ₹ symbol
    };

    return {
        invoices: [
            {
                vendor: '',
                date: '',
                items: [{ name: '', quantity: 0, rate: 0, amount: 0 }],
                subtotal: 0,
                service_charge: 0,
                gst: 0,
                vat: 0,
                gross_amount: 0,
                currency: '₹',
                filePreview: null,
                parsedData: null
            }
        ],
        employee: null,
        showEmployeeDetails: false,
        showReimbursementPopup: false,
        reimbursementId: '',
        isLoading: false,

        init() {
            this.employee = employeeProfiles[Math.floor(Math.random() * employeeProfiles.length)];
        },

        toggleEmployeeDetails() {
            this.showEmployeeDetails = !this.showEmployeeDetails;
        },

        convertToINR(amount, fromCurrency) {
            const rate = exchangeRates[fromCurrency] || 1;
            return amount * rate;
        },

        calculateTotalReimbursement() {
            return this.invoices.reduce((total, invoice) => {
                const amountInINR = this.convertToINR(invoice.gross_amount, invoice.currency);
                return total + amountInINR;
            }, 0);
        },

        formatCurrency(amount, currency = 'INR') {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency }).format(amount);
        },

        addInvoice() {
            this.invoices.push({
                vendor: '',
                date: '',
                items: [{ name: '', quantity: 0, rate: 0, amount: 0 }],
                subtotal: 0,
                service_charge: 0,
                gst: 0,
                vat: 0,
                gross_amount: 0,
                currency: '₹',
                filePreview: null,
                parsedData: null
            });
        },

        removeInvoice(index) {
            this.invoices.splice(index, 1);
            if (this.invoices.length === 0) {
                this.addInvoice();
            }
        },

        addItem(invoiceIndex) {
            this.invoices[invoiceIndex].items.push({ name: '', quantity: 0, rate: 0, amount: 0 });
        },

        removeItem(invoiceIndex) {
            if (this.invoices[invoiceIndex].items.length > 1) {
                this.invoices[invoiceIndex].items.pop();
                this.calculateTotals(invoiceIndex);
            }
        },

        calculateAmount(invoiceIndex, itemIndex) {
            const item = this.invoices[invoiceIndex].items[itemIndex];
            item.amount = item.quantity * item.rate;
            this.calculateTotals(invoiceIndex);
        },

        calculateTotals(invoiceIndex) {
            const invoice = this.invoices[invoiceIndex];
            invoice.subtotal = invoice.items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
            invoice.gross_amount = invoice.subtotal + invoice.service_charge + invoice.gst + invoice.vat;
        },

        prefillSampleData(index) {
            this.invoices[index] = {
                vendor: 'MANHATTAN BAR EXCHANGE',
                date: '2017-04-07',
                items: [
                    { name: 'TASTER', quantity: 1, rate: 0, amount: 0 },
                    { name: 'BEER PITCHER 1.5 LTR', quantity: 1, rate: 692, amount: 692 },
                    { name: 'Paneer Makhani Combo', quantity: 1, rate: 345, amount: 345 },
                    { name: 'Loaded Cheese Nachoes', quantity: 1, rate: 275, amount: 275 }
                ],
                subtotal: 1312,
                service_charge: 65.60,
                gst: 26.24,
                vat: 306.16,
                gross_amount: 1710,
                currency: '₹',
                filePreview: null,
                parsedData: null
            };
            this.calculateTotals(index);
        },

        clearInvoice(index) {
            this.invoices[index] = {
                vendor: '',
                date: '',
                items: [{ name: '', quantity: 0, rate: 0, amount: 0 }],
                subtotal: 0,
                service_charge: 0,
                gst: 0,
                vat: 0,
                gross_amount: 0,
                currency: '₹',
                filePreview: null,
                parsedData: null
            };
        },

        handleFileUpload(event, invoiceIndex) {
            const file = event.target.files[0];
            if (file) {
                this.displayInvoice(file, invoiceIndex);
                this.parseInvoice(file, invoiceIndex);
            }
        },

        displayInvoice(file, invoiceIndex) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (file.type.startsWith('image/')) {
                    this.invoices[invoiceIndex].filePreview = `<img src="${e.target.result}" alt="Uploaded Invoice" class="w-full h-auto">`;
                } else if (file.type === 'application/pdf') {
                    this.invoices[invoiceIndex].filePreview = `
                        <object data="${e.target.result}" type="application/pdf" width="100%" height="600px">
                            <p>Unable to display PDF. <a href="${e.target.result}" target="_blank">Download</a> instead.</p>
                        </object>
                    `;
                } else {
                    this.invoices[invoiceIndex].filePreview = '<p class="text-red-500">Unsupported file type</p>';
                }
                this.invoices[invoiceIndex].base64Image = e.target.result.split(',')[1];
            };
            reader.readAsDataURL(file);
        },

        parseInvoice(file, invoiceIndex) {
            this.isLoading = true;
            const formData = new FormData();
            formData.append('invoice', file);

            fetch('/verify_reimbursement', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                this.isLoading = false;
                if (data.error) {
                    console.error('Error:', data.error);
                    alert('Error parsing invoice: ' + data.error);
                } else {
                    const parsedData = data.invoice_analysis;
                    this.invoices[invoiceIndex].parsedData = parsedData;
                    this.fillFormWithParsedData(invoiceIndex, parsedData);
                }
            })
            .catch(error => {
                this.isLoading = false;
                console.error('Error:', error);
                alert('An error occurred while parsing the invoice.');
            });
        },

        fillFormWithParsedData(invoiceIndex, parsedData) {
            const invoice = this.invoices[invoiceIndex];
            invoice.vendor = parsedData.vendor || '';
            invoice.date = parsedData.date || '';
            invoice.items = (parsedData.items || []).map(item => ({
                name: item.name || '',
                quantity: item.quantity || 0,
                rate: item.rate || 0,
                amount: item.amount || 0
            }));
            invoice.subtotal = parsedData.subtotal || 0;
            invoice.service_charge = parsedData.service_charge || 0;
            invoice.gst = parsedData.gst || 0;
            invoice.vat = parsedData.vat_on_liquor || 0;
            invoice.gross_amount = parsedData.gross_amount || 0;
            invoice.currency = parsedData.currency || '₹';
            this.calculateTotals(invoiceIndex);
        },

        renderParsedData(parsedData) {
            if (!parsedData) return '<p>No parsed data available</p>';
        
            let html = `
            <div class="bg-white border border-gray-200 rounded-lg shadow-md p-8 font-sans">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">Invoice</h2>
                    <div class="text-right">
                        <p class="text-sm text-gray-600">Date: ${parsedData.date || 'N/A'}</p>
                        <p class="text-sm text-gray-600">Invoice #: ${parsedData.invoice_number || 'N/A'}</p>
                    </div>
                </div>
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-700 mb-2">Vendor</h3>
                    <p class="text-gray-600">${parsedData.vendor || 'N/A'}</p>
                </div>
                <table class="w-full mb-6">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="text-left py-2 text-sm font-semibold text-gray-600">Item</th>
                            <th class="text-right py-2 text-sm font-semibold text-gray-600">Quantity</th>
                            <th class="text-right py-2 text-sm font-semibold text-gray-600">Rate</th>
                            <th class="text-right py-2 text-sm font-semibold text-gray-600">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
        
            (parsedData.items || []).forEach(item => {
                html += `
                    <tr class="border-b border-gray-100">
                        <td class="py-2 text-sm text-gray-600">${item.name || 'N/A'}</td>
                        <td class="py-2 text-sm text-gray-600 text-right">${item.quantity || 0}</td>
                        <td class="py-2 text-sm text-gray-600 text-right">${this.formatCurrency(item.rate || 0, parsedData.currency)}</td>
                        <td class="py-2 text-sm text-gray-600 text-right">${this.formatCurrency(item.amount || 0, parsedData.currency)}</td>
                    </tr>
                `;
            });
        
            html += `
                    </tbody>
                </table>
                <div class="flex justify-end">
                    <div class="w-1/2">
                        <div class="flex justify-between mb-2">
                            <span class="text-sm font-semibold text-gray-600">Subtotal:</span>
                            <span class="text-sm text-gray-600">${this.formatCurrency(parsedData.subtotal || 0, parsedData.currency)}</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-sm font-semibold text-gray-600">Service Charge:</span>
                            <span class="text-sm text-gray-600">${this.formatCurrency(parsedData.service_charge || 0, parsedData.currency)}</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-sm font-semibold text-gray-600">GST:</span>
                            <span class="text-sm text-gray-600">${this.formatCurrency(parsedData.gst || 0, parsedData.currency)}</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-sm font-semibold text-gray-600">VAT on Liquor:</span>
                            <span class="text-sm text-gray-600">${this.formatCurrency(parsedData.vat_on_liquor || 0, parsedData.currency)}</span>
                        </div>
                        <div class="flex justify-between mt-4 pt-2 border-t border-gray-200">
                            <span class="text-base font-bold text-gray-700">Total Amount:</span>
                            <span class="text-base font-bold text-gray-700">${this.formatCurrency(parsedData.gross_amount || 0, parsedData.currency)}</span>
                        </div>
                        <div class="flex justify-between mt-2">
                            <span class="text-sm font-semibold text-gray-600">Amount in INR:</span>
                            <span class="text-sm text-gray-600">${this.formatCurrency(this.convertToINR(parsedData.gross_amount || 0, parsedData.currency))}</span>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                
                return html;
            },
    
            submitReimbursement() {
                this.isLoading = true;
                const reimbursementData = {
                    employee: this.employee,
                    invoices: this.invoices.map(invoice => ({
                        vendor: invoice.vendor,
                        date: invoice.date,
                        items: invoice.items,
                        subtotal: invoice.subtotal,
                        service_charge: invoice.service_charge,
                        gst: invoice.gst,
                        vat: invoice.vat,
                        gross_amount: invoice.gross_amount,
                        currency: invoice.currency,
                        parsedData: invoice.parsedData,
                        base64Image: invoice.base64Image
                    })),
                    claims: this.invoices.map(invoice => ({
                        vendor: invoice.vendor,
                        date: invoice.date,
                        items: invoice.items,
                        subtotal: invoice.subtotal,
                        service_charge: invoice.service_charge,
                        gst: invoice.gst,
                        vat: invoice.vat,
                        gross_amount: invoice.gross_amount,
                        currency: invoice.currency,
                    })),
                    totalReimbursement: this.calculateTotalReimbursement(),
                    currency: 'INR'
                };
    
                fetch('/submit_reimbursement', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(reimbursementData)
                })
                .then(response => response.json())
                .then(data => {
                    this.isLoading = false;
                    if (data.error) {
                        console.error('Error:', data.error);
                        alert('Failed to submit reimbursement claim. Please try again.');
                    } else {
                        console.log('Reimbursement claim submitted successfully:', data);
                        this.reimbursementId = data.reimbursement_id;
                        this.showReimbursementPopup = true;
                    }
                })
                .catch(error => {
                    this.isLoading = false;
                    console.error('Error:', error);
                    alert('An error occurred while submitting the reimbursement claim.');
                });
            },
    
            closeReimbursementPopup() {
                this.showReimbursementPopup = false;
                this.resetForm();
            },
    
            resetForm() {
                this.invoices = [{
                    vendor: '',
                    date: '',
                    items: [{ name: '', quantity: 0, rate: 0, amount: 0 }],
                    subtotal: 0,
                    service_charge: 0,
                    gst: 0,
                    vat: 0,
                    gross_amount: 0,
                    currency: '₹',
                    filePreview: null,
                    parsedData: null
                }];
                // We don't reset the employee info as it's randomly selected
            },
    
            // New helper function to get currency symbol
            getCurrencySymbol(currencyCode) {
                const symbols = {
                    'INR': '₹',
                    'USD': '$',
                    'EUR': '€',
                    'GBP': '£'
                };
                return symbols[currencyCode] || currencyCode;
            },
    
            // Updated formatCurrency function
            formatCurrency(amount, currency = 'INR') {
                const symbol = this.getCurrencySymbol(currency);
                return `${symbol}${amount.toFixed(2)}`;
            }
        };
    }