# app.py

import os
from flask import Flask, request, render_template, jsonify
from werkzeug.utils import secure_filename
from openai import OpenAI
import PyPDF2
from pydantic import BaseModel
from typing import List, Literal, Dict, Any
import json
import base64
import uuid
import shutil
from flask_cors import CORS
import string
import random
# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure OpenAI client
api_key = "API_KEY"  # TODO: Replace with environment variable
client = OpenAI(api_key=api_key)

# Define constants
UPLOAD_FOLDER = 'uploads'
REIMBURSEMENTS_FOLDER = 'reimbursements'
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

# Configure app settings
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['REIMBURSEMENTS_FOLDER'] = REIMBURSEMENTS_FOLDER

# Define data models using Pydantic
class Item(BaseModel):
    """
    Represents an item in an invoice.
    """
    name: str
    quantity: int
    rate: float
    amount: float
    category: Literal[
        'free-items', 
        'alcoholic-beverages', 
        'food-items', 
        'drinks', 
        'water', 
        'office-supplies',
        'travel-expenses',
        'consulting-services',
        'maintenance',
        'subscriptions',
        'training',
        'other'
    ]

class Invoice(BaseModel):
    """
    Represents an invoice with its details.
    """
    invoice_number: str
    vendor: str
    date: str
    items: List[Item]
    subtotal: float
    service_charge: float
    gst: float
    currency: str
    gst_percent: float
    vat_on_liquor: float
    vat_on_liquor_percent: float
    gross_amount: float

class Employee(BaseModel):
    """
    Represents an employee submitting a reimbursement claim.
    """
    name: str
    email: str
    designation: str
    employee_id: str

class ClaimAnalysis(BaseModel):
    """
    Represents the analysis of a reimbursement claim.
    """
    total_eligibility: float
    justification: list[str]
    deductions: list[str]
    eligible_reimbursement: float
    currency: str

def allowed_file(filename: str) -> bool:
    """
    Check if the uploaded file has an allowed extension.
    
    Args:
        filename (str): Name of the uploaded file
    
    Returns:
        bool: True if the file extension is allowed, False otherwise
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        file_path (str): Path to the PDF file
    
    Returns:
        str: Extracted text content from the PDF
    """
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text()
    return text

def encode_image(image_path: str) -> str:
    """
    Encode an image file to base64.
    
    Args:
        image_path (str): Path to the image file
    
    Returns:
        str: Base64 encoded string of the image
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def analyze_invoice(file_path: str) -> Invoice:
    """
    Analyze an invoice using OpenAI's GPT model.
    
    Args:
        file_path (str): Path to the invoice file (PDF or image)
    
    Returns:
        Invoice: Parsed invoice data
    """
    if file_path.lower().endswith('.pdf'):
        invoice_text = extract_text_from_pdf(file_path)
        prompt = f"Analyze this invoice and provide an itemized JSON object for the items, vendor, date, along with category such as food, alcoholic-beverages, non-alcoholic-beverages etc. Invoice text: {invoice_text}"
        messages = [
            {"role": "system", "content": "You are an AI assistant that extracts information from invoices and formats it as JSON."},
            {"role": "user", "content": prompt}
        ]
    else:  # Image file
        base64_image = encode_image(file_path)
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """You are an data extraction export to process receipts,
                                analyze this receipt and give an itemized JSON object for the items, vendor, date, along with category such as food, alcoholic-beverages, non-alcoholic-beverages, consumables, 
                                and currency give symbol based on address of the vendor and country
                                some receipt might not have item rate, but show total rate, in that case calculate the item rate by dividing the total by number of items, if GST or VAT not defined, put 0
                                focus on spellings of items, Tax calculations
                                 give date alwars in yyyy-MM-dd format """
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]

    # Use OpenAI's GPT model to analyze the invoice
    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=1000,
        response_format=Invoice,
        temperature=0
    )
    print(response.choices[0].message.parsed)
    return response.choices[0].message.parsed

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html')

@app.route('/verify_reimbursement', methods=['POST'])
def verify_reimbursement():
    """
    Verify and analyze a reimbursement claim based on an uploaded invoice.
    
    Returns:
        JSON response with invoice analysis or error message
    """
    if 'invoice' not in request.files:
        return jsonify({"error": "No invoice file provided"}), 400
    
    file = request.files['invoice']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            invoice_data_dict = analyze_invoice(file_path)
            return jsonify({
                "invoice_analysis": invoice_data_dict.dict()  
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/submit_reimbursement', methods=['POST'])
def submit_reimbursement():
    """
    Submit a reimbursement claim.
    
    Returns:
        JSON response with confirmation message and reimbursement ID
    """
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Generate a unique reimbursement ID
    reimbursement_id = "OMTEC-REIM-"+''.join(random.choices(string.ascii_uppercase + string.digits, k=5))

    # Add base64 encoded images to the data
    for invoice in data['invoices']:
        if 'filePreview' in invoice:
            # Extract the base64 data from the data URL
            _, base64_data = invoice['filePreview'].split(',', 1)
            invoice['base64_image'] = base64_data

    # Add employee details to the data
    data['employee'] = {
        "name": request.json["employee"]['name'],
        "email": request.json["employee"]['email'],
        "designation": request.json["employee"]['designation'],
        "employee_id": request.json["employee"]['employeeId']
    }
    data['status'] = 'not-approved'

    # Save the reimbursement data as a JSON file
    filename = f"{reimbursement_id}.json"
    file_path = os.path.join(app.config['REIMBURSEMENTS_FOLDER'], filename)

    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

    return jsonify({
        "message": "Reimbursement claim saved successfully",
        "reimbursement_id": reimbursement_id
    }), 200

@app.route('/admin')
def admin_page():
    """Render the admin page of the application."""
    return render_template('admin.html')

@app.route('/api/claims')
def get_claims():
    """
    Retrieve all reimbursement claims (both pending and processed).
    
    Returns:
        JSON response with a list of all claims
    """
    pending_claims = []
    processed_claims = []
    
    # Get pending claims
    for filename in os.listdir(app.config['REIMBURSEMENTS_FOLDER']):
        if filename.endswith('.json'):
            with open(os.path.join(app.config['REIMBURSEMENTS_FOLDER'], filename), 'r') as f:
                claim_data = json.load(f)
                pending_claims.append({
                    'id': filename.split('.')[0],
                    'employee': claim_data['employee'],
                    'processed': False
                })
    
    # Get processed claims
    processed_folder = os.path.join(app.config['REIMBURSEMENTS_FOLDER'], 'processed')
    if os.path.exists(processed_folder):
        for filename in os.listdir(processed_folder):
            if filename.endswith('.json'):
                with open(os.path.join(processed_folder, filename), 'r') as f:
                    claim_data = json.load(f)
                    processed_claims.append({
                        'id': filename.split('.')[0],
                        'employee': claim_data['employee'],
                        'processed': True
                    })
    
    return jsonify(pending_claims + processed_claims)

@app.route('/api/approve-claim/<claim_id>', methods=['POST'])
def approve_claim(claim_id):
    """
    Approve a reimbursement claim.
    
    Args:
        claim_id (str): ID of the claim to be approved
    
    Returns:
        JSON response with success status and message
    """
    data = request.json
    
    source_file = os.path.join(app.config['REIMBURSEMENTS_FOLDER'], f"{claim_id}.json")
    if not os.path.exists(source_file):
        return jsonify({'success': False, 'message': 'Claim not found'}), 404
    
    with open(source_file, 'r') as f:
        claim_data = json.load(f)
    analysis = analyze_claim_against_policy(claim_data.copy(), reimbursement_policy)
    
    # Update claim data with approval information and analysis results
    claim_data['analysis'] = analysis
    claim_data['status'] = 'approved'
    claim_data['approved'] = {
        'eligible_reimbursement': data['eligibleReimbursement'],
        'comments': data['comments']
    }
    
    # Create processed folder if it doesn't exist
    processed_folder = os.path.join(app.config['REIMBURSEMENTS_FOLDER'], 'processed')
    os.makedirs(processed_folder, exist_ok=True)
    
    # Move the file to the processed folder
    dest_file = os.path.join(processed_folder, f"{claim_id}.json")
    shutil.move(source_file, dest_file)
    
    # Update the JSON file with new data
    with open(dest_file, 'w') as f:
        json.dump(claim_data, f, indent=2)
    
    return jsonify({'success': True, 'message': 'Claim approved successfully'})

# Define the reimbursement policy
reimbursement_policy={
  "policy": {
    "name": "Employee Travel Expense Reimbursement Policy",
    "description": "This policy provides a comprehensive framework for reimbursing employees for various travel-related expenses incurred during business trips, including flights, local transport, meals, hotels, consumables, and stationary. It includes guidelines on eligible and ineligible expenses, reimbursement limits, and documentation requirements.",
    "eligible_expenses": [
      {
        "category": "Flights",
        "description": "Expenses for business-class or economy-class flight tickets for domestic and international travel. Reimbursement is subject to the company's travel class policy and booking guidelines."
      },
      {
        "category": "Local transport",
        "description": "Expenses for local transportation such as taxis, ride-sharing services, and public transit used for business purposes during travel."
      },
      {
        "category": "Meals",
        "description": "Expenses for breakfast, lunch, and dinner incurred while traveling for business purposes. Includes eligible costs for meals in restaurants or hotel dining facilities."
      },
      {
        "category": "Hotels",
        "description": "Expenses for hotel accommodations required during business travel. Includes room rates, taxes, and any applicable hotel service fees."
      },
      {
        "category": "Consumables",
        "description": "Expenses for necessary consumables purchased during business travel, such as toiletries, bottled water, and snacks that are not classified as meals."
      },
      {
        "category": "Stationary",
        "description": "Expenses for stationary items purchased for business purposes during travel, such as notebooks, pens, and other office supplies."
      }
    ],
    "ineligible_expenses": [
      {
        "category": "Alcoholic beverages",
        "description": "Costs for alcoholic drinks, including beer, wine, and spirits, are not eligible for reimbursement."
      },
      {
        "category": "Personal dining",
        "description": "Expenses for meals that are not related to business travel or are considered personal in nature."
      },
      {
        "category": "Room service charges",
        "description": "Charges for room service in hotels, including food and beverage orders delivered to the room."
      },
      {
        "category": "Personal entertainment",
        "description": "Expenses for personal entertainment or leisure activities, such as movie tickets or sightseeing tours, are not reimbursable."
      }
    ],
    "reimbursement_limits": {
      "flights": {
        "domestic": {
          "max_amount": 25000,
          "currency": "INR",
          "description": "The maximum allowable reimbursement amount for domestic flight tickets."
        },
        "international": {
          "max_amount": 80000,
          "currency": "INR",
          "description": "The maximum allowable reimbursement amount for international flight tickets."
        }
      },
      "local_transport": {
        "max_amount": 2000,
        "currency": "INR",
        "description": "The maximum allowable reimbursement amount for local transport expenses per day."
      },
      "meals": {
        "breakfast": {
          "max_amount": 2000,
          "currency": "INR",
          "description": "The maximum allowable reimbursement amount for breakfast expenses per day."
        },
        "lunch": {
          "max_amount": 2500,
          "currency": "INR",
          "description": "The maximum allowable reimbursement amount for lunch expenses per day."
        },
        "dinner": {
          "max_amount": 4000,
          "currency": "INR",
          "description": "The maximum allowable reimbursement amount for dinner expenses per day."
        }
      },
      "hotels": {
        "max_amount_per_night": 12000,
        "currency": "INR",
        "description": "The maximum allowable reimbursement amount for hotel accommodations per night."
      },
      "consumables": {
        "max_amount": 1500,
        "currency": "INR",
        "description": "The maximum allowable reimbursement amount for consumables per day."
      },
      "stationary": {
        "max_amount": 2000,
        "currency": "INR",
        "description": "The maximum allowable reimbursement amount for stationary items per trip."
      }
    },
    "receipt_requirements": {
      "required": True,
      "details": "Receipts must be itemized, clearly indicating the date of the expense, the location where it was incurred, and the total amount spent. Each receipt should clearly show these details to ensure reimbursement eligibility."
    },
    "per_diem_option": {
      "available": True,
      "amount": 50,
      "currency": "INR",
      "description": "An optional per diem amount of 50 INR per day is available for employees who prefer a simplified reimbursement process instead of submitting individual receipts."
    },
    "contact_information": {
      "finance_department_email": "finance@example.com",
      "travel_coordinator_email": "travel@example.com",
      "description": "For any questions or clarifications regarding the reimbursement process, employees can contact the Finance Department or the Travel Coordinator via the provided email addresses."
    }
  }
}

def analyze_claim_against_policy(claim_data: Dict[str, Any], policy: Dict[str, Any]) -> ClaimAnalysis:
    """
    Analyze a reimbursement claim against the company policy using OpenAI's GPT model.
    
    Args:
        claim_data (Dict[str, Any]): The claim data to be analyzed
        policy (Dict[str, Any]): The company's reimbursement policy
    
    Returns:
        ClaimAnalysis: Analysis results of the claim
    """
    claim_data_file = claim_data.copy()
    invoices = claim_data_file.get('invoices', [])
    for invoice in invoices:
        invoice.pop('base64Image', None)

    prompt = f"""
    Analyze the following reimbursement claim against the company policy:

    Claim Data:
    {json.dumps(claim_data_file, indent=2)}

    Company Policy:
    {json.dumps(policy, indent=2)}

    Please provide:
    1. The total eligibility amount
    2. A step-by-step justification of any deductions
    3. A breakdown of deductions
    4. The final eligible reimbursement amount
    5. Calculate the final eligibility after deducting any ineligible expenses.
    6. Factor in appropriate taxes
    7. In justification, add full calculations
    8. The invoices may be of different currency, assume a suitable exchange rate to INR and do the calculations
    9. Give the final reimbursement in Indian rupees with symbol.
10. Always convert the currency to INR and denote as ₹
    11. Be as descriptive as possible
    12. Ask to email the appropriate department for clarifications
    13. Check if all invoices are of the same time period with 15 days max difference

    Format your response as a JSON object.
    """

    messages = [
        {"role": "system", "content": "You are an AI assistant that analyzes reimbursement claims against company policies."},
        {"role": "user", "content": prompt}
    ]

    # Use OpenAI's GPT model to analyze the claim against the policy
    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=1000,
        response_format=ClaimAnalysis,
        temperature=0
    )

    analysis_dict = response.choices[0].message.parsed
    if analysis_dict.currency == 'INR':
        analysis_dict.currency = '₹'
    return analysis_dict.dict()

@app.route('/api/claims/<claim_id>')
def get_claim_details(claim_id):
    """
    Retrieve details of a specific reimbursement claim.
    
    Args:
        claim_id (str): ID of the claim to retrieve
    
    Returns:
        JSON response with claim details and analysis
    """
    file_path = os.path.join(app.config['REIMBURSEMENTS_FOLDER'], f"{claim_id}.json")
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            claim_data = json.load(f)
        
        # Analyze the claim against the policy
        analysis = analyze_claim_against_policy(claim_data.copy(), reimbursement_policy)
        with open(file_path, 'r') as f:
            claim_data = json.load(f)
        # Add the analysis results to the claim data
        # Add the analysis results to the claim data
        claim_data['analysis'] = analysis
        print(claim_data)  # For debugging purposes
        return jsonify(claim_data)
    else:
        return jsonify({'error': 'Claim not found'}), 404

@app.route('/api/claims/processed/<claim_id>')
def get_processed_claim_details(claim_id):
    """
    Retrieve details of a specific processed reimbursement claim.
    
    Args:
        claim_id (str): ID of the processed claim to retrieve
    
    Returns:
        JSON response with processed claim details
    """
    processed_folder = os.path.join(app.config['REIMBURSEMENTS_FOLDER'], 'processed')
    file_path = os.path.join(processed_folder, f"{claim_id}.json")
    
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            claim_data = json.load(f)
        
        return jsonify(claim_data)
    else:
        return jsonify({'error': 'Processed claim not found'}), 404

if __name__ == '__main__':
    # Ensure necessary directories exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(REIMBURSEMENTS_FOLDER, exist_ok=True)
    
    # Run the Flask application
    app.run(debug=True, port=8080)