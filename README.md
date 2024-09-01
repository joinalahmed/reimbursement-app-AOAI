# Reimbursement Management System

## Overview

The Reimbursement Management System is a web application built with Flask and OpenAI's GPT model to automate and streamline the process of submitting, analyzing, and approving employee reimbursement claims. The system uses AI to extract information from invoices, analyze claims against company policies, and provide detailed breakdowns of eligible expenses.

## Features

- User-friendly web interface for submitting reimbursement claims
- AI-powered invoice analysis and data extraction
- Automatic claim analysis against company reimbursement policies
- Admin interface for reviewing and approving claims
- Support for multiple file types (PDF, JPG, JPEG, PNG)
- Detailed breakdowns of eligible expenses and deductions

## Prerequisites

- Python 3.7+
- Flask
- OpenAI Python library
- PyPDF2
- Pydantic
- Flask-CORS

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/reimbursement-management-system.git
   cd reimbursement-management-system
   ```

2. Create a virtual environment and activate it:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Configuration

1. Open `app.py` in a text editor.

2. Locate the following line:
   ```python
   api_key = "API_KEY"
   ```

3. Replace the API key with your own OpenAI API key. It's recommended to use an environment variable for security:
   ```python
   import os
   api_key = os.environ.get('OPENAI_API_KEY')
   ```

4. Set the environment variable in your terminal:
   ```
   export OPENAI_API_KEY='your-api-key-here'  # On Windows, use `set OPENAI_API_KEY=your-api-key-here`
   ```

## Running the Application

1. Ensure you're in the project directory and your virtual environment is activated.

2. Run the Flask application:
   ```
   python app.py
   ```

3. Open a web browser and navigate to `http://localhost:8080` to access the user interface.

4. To access the admin interface, navigate to `http://localhost:8080/admin`.

## Usage

### For Employees:
1. Navigate to the home page.
2. Fill in the invoice details and upload the invoice file.
3. Submit the reimbursement claim.

### For Admins:
1. Navigate to the admin page.
2. Review pending claims.
3. Analyze and approve claims as necessary.

## Folder Structure

- `uploads/`: Temporary storage for uploaded invoice files
- `reimbursements/`: Storage for submitted reimbursement claims
- `templates/`: HTML templates for the web interface
- `static/`: Static files (CSS, JavaScript, images)

## Customization

To modify the reimbursement policy, edit the `reimbursement_policy` dictionary in `app.py`. This will affect how claims are analyzed and what expenses are considered eligible.

## Limitations

1. **AI Accuracy**: While the AI-powered invoice analysis is generally accurate, it may occasionally misinterpret complex or ambiguous invoice data. Manual verification is recommended for critical or high-value claims.

2. **File Format Support**: The system currently supports PDF, JPG, JPEG, and PNG file formats. Other file types, such as scanned images in TIFF format or native digital receipts, are not supported.

3. **Language Support**: The current implementation is optimized for English-language invoices. Invoices in other languages may not be accurately processed.

4. **Currency Conversion**: The system assumes a fixed exchange rate for currency conversions. Real-time exchange rates are not incorporated, which may lead to slight inaccuracies for international expenses.

5. **Scalability**: The current implementation may face performance issues with a very large number of simultaneous users or extremely high volumes of claims. It's designed for small to medium-sized organizations.

6. **Security**: While basic security measures are in place, the system lacks advanced features like multi-factor authentication, role-based access control, or encryption of stored claims. Additional security measures should be implemented for use in a production environment.

7. **Customization**: The reimbursement policy is currently defined as a static dictionary in the code. Dynamic policy management or company-specific policy variations are not supported out of the box.

8. **Reporting**: The system lacks advanced reporting features, such as generating expense reports, trend analysis, or exporting data for further processing.

9. **Integration**: There's no built-in integration with accounting software, ERP systems, or payroll platforms. Claims approved in this system would need to be manually entered into other financial systems.

10. **Mobile Support**: The current user interface is not optimized for mobile devices, which may limit usability for employees submitting claims from smartphones.

## Troubleshooting

- If you encounter issues with file uploads, ensure that the `UPLOAD_FOLDER` and `REIMBURSEMENTS_FOLDER` directories exist and have the correct permissions.
- For API-related errors, double-check that your OpenAI API key is correct and has the necessary permissions.

## Security Considerations

- Never commit your API keys to version control. Always use environment variables or a secure configuration management system.
- Implement proper authentication and authorization for the admin interface in a production environment.
- Sanitize and validate all user inputs to prevent security vulnerabilities.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
