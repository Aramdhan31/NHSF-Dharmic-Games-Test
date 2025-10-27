# NHSF Dharmic Games - Account Security Policy

## 🔐 **Mandatory Approval Process for ALL Account Creation**

### **Core Security Principle**
**NO Firebase Authentication accounts can be created without admin approval.** All user accounts must go through a secure request → review → approval → account creation process.

### **Approved User Types & Collections**

#### **1. Admin Users**
- **Request Collection**: `adminAccessRequests`
- **Active Collection**: `users`
- **Roles**: `super_admin`, `zone_admin`
- **Approval Required**: ✅ YES
- **Access Level**: Full admin dashboard access

#### **2. University Users**
- **Request Collection**: `universityRequests`
- **Active Collection**: `universities`
- **Role**: `university`
- **Approval Required**: ✅ YES
- **Access Level**: University dashboard access

#### **3. Future User Types** (if needed)
- **Player Users**: Request → Approval → Account creation
- **Volunteer Users**: Request → Approval → Account creation
- **Staff Users**: Request → Approval → Account creation

### **Security Workflow**

```
1. User submits request → Saved to [TYPE]Requests collection
2. Admin reviews request → Approves or rejects
3. If approved → Firebase Auth account created + moved to active collection
4. If rejected → Request marked as rejected, no account created
5. User can login → Only after approval and account creation
```

### **Database Structure**

#### **Request Collections** (Pending Approval)
```
adminAccessRequests: {
  email: string,
  password: string (temporary),
  displayName: string,
  zone: string,
  status: 'pending',
  requestedAt: timestamp
}

universityRequests: {
  email: string,
  tempPassword: string,
  name: string,
  zone: string,
  sports: string[],
  status: 'pending_approval',
  requestDate: timestamp
}
```

#### **Active Collections** (Approved Users)
```
users: {
  uid: string (Firebase Auth UID),
  email: string,
  role: 'super_admin' | 'zone_admin',
  zone: string,
  permissions: object,
  approvedAt: timestamp,
  approvedBy: string
}

universities: {
  uid: string (Firebase Auth UID),
  email: string,
  name: string,
  zone: string,
  role: 'university',
  approved: boolean,
  approvedAt: timestamp
}
```

### **Security Rules**

#### **1. No Direct Account Creation**
- ❌ **FORBIDDEN**: Creating Firebase Auth accounts directly
- ❌ **FORBIDDEN**: Bypassing the approval process
- ❌ **FORBIDDEN**: Self-registration with immediate access

#### **2. Required Validation**
- ✅ **REQUIRED**: Email uniqueness check (requests + active)
- ✅ **REQUIRED**: Admin approval for all accounts
- ✅ **REQUIRED**: Audit trail for all approvals/rejections

#### **3. Access Control**
- ✅ **REQUIRED**: Role-based permissions
- ✅ **REQUIRED**: Zone-based access restrictions
- ✅ **REQUIRED**: Approval status verification on login

### **Implementation Guidelines**

#### **For New User Types**
1. Create request collection: `[type]Requests`
2. Create active collection: `[type]`
3. Implement approval workflow in admin panel
4. Add role validation to login process
5. Update security rules accordingly

#### **For Existing User Types**
1. All requests must go through approval process
2. No immediate Firebase Auth account creation
3. Admin must approve before account activation
4. Clear audit trail for all decisions

### **Firebase Security Rules**

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to write to request collections
    match /adminAccessRequests/{document} {
      allow read, write: if true;
    }
    
    match /universityRequests/{document} {
      allow read, write: if true;
    }
    
    // Only authenticated and approved users can access active collections
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.approved == true;
    }
    
    match /universities/{universityId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/universities/$(request.auth.uid)).data.approved == true;
    }
  }
}
```

### **Monitoring & Compliance**

#### **Regular Audits**
- Review all pending requests weekly
- Verify no unauthorized account creation
- Check approval audit trails
- Monitor failed login attempts

#### **Security Alerts**
- Multiple requests from same email
- Unusual approval patterns
- Failed authentication attempts
- Access from unauthorized zones

### **Emergency Procedures**

#### **Account Suspension**
1. Update user document: `approved: false`
2. Remove Firebase Auth account if necessary
3. Log suspension reason and admin who performed action
4. Notify user of suspension

#### **Account Recovery**
1. Verify user identity
2. Admin approval required for reactivation
3. Update approval timestamp
4. Restore access permissions

---

## ✅ **Compliance Checklist**

- [ ] All user types require admin approval
- [ ] No direct Firebase Auth account creation
- [ ] Request collections exist for all user types
- [ ] Approval workflow implemented in admin panel
- [ ] Login process validates approval status
- [ ] Security rules enforce access control
- [ ] Audit trail maintained for all decisions
- [ ] Email uniqueness enforced across all collections

**Last Updated**: October 2025
**Next Review**: November 2025
