# MayDiv CRM Pipeline API Documentation

## Overview
MayDiv CRM is a **4-stage pipeline workflow system** for import/export job management, not a simple task management system. The system manages jobs through different stages from initial creation to billing.

## Base URL
`http://maytm.online`

## Authentication
All endpoints (except `/api/test` and `/api/login`) require authentication via session cookies.

---

## Quick Start - Test Connection

### 1. Test Basic Connectivity
**Endpoint:** `GET http://maytm.online/api/test`

**Expected Response:**
```json
{
    "message": "Test endpoint working"
}
```

---

## Authentication Endpoints

### 2. User Login
**Endpoint:** `POST http://maytm.online/api/login`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "username": "admin",
    "password": "123456"
}
```

**Expected Response:**
```json
{
    "success": true,
    "is_admin": true,
    "role": "admin",
    "username": "admin"
}
```

### 3. Check Session Status
**Endpoint:** `GET http://maytm.online/api/session`

**Expected Response:**
```json
{
    "authenticated": true,
    "user_id": 1,
    "username": "admin",
    "is_admin": true,
    "role": "admin"
}
```

### 4. User Logout
**Endpoint:** `POST http://maytm.online/api/logout`

**Expected Response:**
```json
{
    "success": true
}
```

---

## Pipeline Job Management

### 5. Get All Jobs (Admin/Subadmin/Stage1 Employee)
**Endpoint:** `GET http://maytm.online/api/pipeline/jobs`

**Expected Response:**
```json
[
    {
        "id": 1,
        "job_no": "JOB001",
        "current_stage": "stage1",
        "status": "active",
        "created_by": 1,
        "assigned_to_stage2": 2,
        "assigned_to_stage3": 3,
        "customer_id": 4,
        "notification_email": "customer@example.com",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    }
]
```

### 6. Get My Jobs (Role-based)
**Endpoint:** `GET http://maytm.online/api/pipeline/myjobs`

**Expected Response:**
```json
[
    {
        "id": 1,
        "job_no": "JOB001",
        "current_stage": "stage1",
        "status": "active",
        "created_by": 1,
        "assigned_to_stage2": 2,
        "assigned_to_stage3": 3,
        "customer_id": 4,
        "notification_email": "customer@example.com",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    }
]
```

### 7. Create New Job (Admin Only)
**Endpoint:** `POST http://maytm.online/api/pipeline/jobs`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "job_no": "JOB002",
    "assigned_to_stage2": 2,
    "assigned_to_stage3": 3,
    "customer_id": 4,
    "notification_email": "customer@example.com"
}
```

**Expected Response:**
```json
{
    "success": true,
    "job_id": 2
}
```

### 8. Get Job Details by ID
**Endpoint:** `GET http://maytm.online/api/pipeline/jobs/{job_id}`

**Expected Response:**
```json
{
    "job": {
        "id": 1,
        "job_no": "JOB001",
        "current_stage": "stage1",
        "status": "active",
        "created_by": 1,
        "assigned_to_stage2": 2,
        "assigned_to_stage3": 3,
        "customer_id": 4,
        "notification_email": "customer@example.com",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    },
    "stage1_data": {
        "id": 1,
        "job_id": 1,
        "job_no": "JOB001",
        "job_date": "2024-01-15",
        "consignee": "ABC Import Co.",
        "shipper": "XYZ Export Ltd.",
        "commodity": "Electronics",
        "current_status": "Documents Received"
    },
    "stage2_data": null,
    "stage3_data": null,
    "stage4_data": null
}
```

---

## Stage Data Management

### 9. Update Stage 2 Data (Customs & Documentation)
**Endpoint:** `POST http://maytm.online/api/pipeline/jobs/{job_id}/stage2`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "hsn_code": "8517.13.00",
    "filing_requirement": "Standard filing",
    "checklist_sent_date": "2024-01-16",
    "approval_date": "2024-01-17",
    "bill_of_entry_no": "BE123456",
    "bill_of_entry_date": "2024-01-18",
    "duty_amount": 5000.00,
    "duty_paid_by": "Customer",
    "ocean_freight": 2000.00,
    "destination_charges": 500.00
}
```

### 10. Update Stage 3 Data (Clearance & Logistics)
**Endpoint:** `POST http://maytm.online/api/pipeline/jobs/{job_id}/stage3`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "exam_date": "2024-01-20",
    "out_of_charge": "2024-01-21",
    "clearance_exps": 1000.00,
    "stamp_duty": 100.00,
    "custodian": "Port Authority",
    "offloading_charges": 300.00,
    "transport_detention": 200.00,
    "dispatch_info": "Delivered to warehouse"
}
```

### 11. Update Stage 4 Data (Billing & Customer)
**Endpoint:** `POST http://maytm.online/api/pipeline/jobs/{job_id}/stage4`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "bill_no": "BILL001",
    "bill_date": "2024-01-25",
    "amount_taxable": 8000.00,
    "gst_5_percent": 400.00,
    "gst_18_percent": 1440.00,
    "bill_mail": "customer@example.com",
    "bill_courier": "Express Delivery",
    "courier_date": "2024-01-26"
}
```

---

## File Management

### 12. Upload File to Job Stage
**Endpoint:** `POST http://maytm.online/api/pipeline/files/upload`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
- Key: `file` (Type: File)
- Key: `job_id` (Type: Text) - Value: `1`
- Key: `stage` (Type: Text) - Value: `stage1`

### 13. Download File
**Endpoint:** `GET http://maytm.online/api/pipeline/files/download?file_id={file_id}`

### 14. Get Files for Job Stage
**Endpoint:** `GET http://maytm.online/api/pipeline/files?job_id={job_id}&stage={stage}`

### 15. Delete File
**Endpoint:** `DELETE http://maytm.online/api/pipeline/files/delete`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "file_id": 1
}
```

---

## User Management

### 16. Get All Users (Admin Only)
**Endpoint:** `GET http://maytm.online/api/users`

**Expected Response:**
```json
[
    {
        "id": 1,
        "username": "admin",
        "designation": "Administrator",
        "is_admin": true,
        "role": "admin"
    },
    {
        "id": 2,
        "username": "stage1_emp",
        "designation": "Job Creator",
        "is_admin": false,
        "role": "stage1_employee"
    }
]
```

### 17. Create New User (Admin Only)
**Endpoint:** `POST http://maytm.online/api/users`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
    "username": "newuser",
    "password_hash": "123456",
    "designation": "Customs Officer",
    "is_admin": false,
    "role": "stage2_employee"
}
```

---

## Debug Endpoints

### 18. Debug Database
**Endpoint:** `GET http://maytm.online/api/debug`

### 19. Debug Stage 1 Data
**Endpoint:** `GET http://maytm.online/api/debug/stage1`

### 20. Debug Stage 2 Data
**Endpoint:** `GET http://maytm.online/api/debug/stage2`

### 21. Debug Stage 3 Data
**Endpoint:** `GET http://maytm.online/api/debug/stage3`

### 22. Debug Stage 4 Data
**Endpoint:** `GET http://maytm.online/api/debug/stage4`

---

## User Roles and Permissions

| Role | Can View All Jobs | Can Create Jobs | Can Update Stages | Can Upload Files |
|------|-------------------|-----------------|-------------------|------------------|
| admin | ✅ | ✅ | ✅ | ✅ |
| subadmin | ✅ | ✅ | ✅ | ✅ |
| stage1_employee | ✅ | ✅ | stage1 | stage1 |
| stage2_employee | ❌ | ❌ | stage2 | stage2 |
| stage3_employee | ❌ | ❌ | stage3 | stage3 |
| customer | ❌ | ❌ | stage4 | stage4 |

---

## Pipeline Stages

1. **Stage 1: Initial Job Creation** - Admin creates job with basic details
2. **Stage 2: Customs & Documentation** - Customs officer handles documentation
3. **Stage 3: Clearance & Logistics** - Logistics coordinator manages clearance
4. **Stage 4: Billing & Customer** - Customer handles billing and final delivery

---

## Testing Workflow in Postman

### 1. Test Connection
```
GET http://maytm.online/api/test
```

### 2. Login as Admin
```
POST http://maytm.online/api/login
Content-Type: application/json

{
    "username": "admin",
    "password": "123456"
}
```

### 3. Check Session
```
GET http://maytm.online/api/session
```

### 4. Get All Jobs
```
GET http://maytm.online/api/pipeline/jobs
```

### 5. Create New Job
```
POST http://maytm.online/api/pipeline/jobs
Content-Type: application/json

{
    "job_no": "JOB002",
    "assigned_to_stage2": 2,
    "assigned_to_stage3": 3,
    "customer_id": 4
}
```

### 6. Get Job Details
```
GET http://maytm.online/api/pipeline/jobs/1
```

---

## Common Error Responses

### 401 Unauthorized
```json
{
    "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
    "error": "Access denied"
}
```

### 404 Not Found
```json
{
    "error": "Job not found"
}
```

### 500 Internal Server Error
```json
{
    "error": "Internal server error"
}
```

---

## Important Notes

1. **Session Management**: Postman automatically handles cookies after login
2. **Role-based Access**: Different users see different jobs based on their role
3. **File Uploads**: Use form-data, not raw JSON for file uploads
4. **Stage Progression**: Jobs move through stages as data is updated
5. **Notifications**: Email notifications are sent when jobs progress

This is the correct API documentation for your MayDiv CRM pipeline system! 