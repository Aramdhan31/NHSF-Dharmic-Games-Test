// NHSF (UK) Admin Emails - Both @nhsf.org.uk and @gmail.com formats
export const ADMIN_EMAILS = [
  // General admin email
  "sanskaarteam@nhsf.org.uk",

  // Amulya Pabbisetty
  "amulya.pabbisetty@nhsf.org.uk",
  "amulya.pabbisetty.nhsf@gmail.com",

  // Vivek Motichande
  "vivek.motichande@nhsf.org.uk",
  "vivek.motichande.nhsf@gmail.com",

  // Arjun Ramdhan
  "arjun.ramdhan@nhsf.org.uk",
  "arjun.ramdhan.nhsf@gmail.com",

  // Naman Gupta
  "naman.gupta@nhsf.org.uk",
  "naman.gupta.nhsf@gmail.com",

  // Rhyanna Boodhoo
  "rhyanna.boodhoo@nhsf.org.uk",
  "rhyanna.boodhoo.nhsf@gmail.com",

  // Shreya Sharma
  "shreya.bhavani.sharma@nhsf.org.uk",
  "shreya.sharma.nhsf@gmail.com", // Using shorter version for gmail

  // Shruti Rajpra
  "shruti.rajpra@nhsf.org.uk",
  "shruti.rajpra.nhsf@gmail.com",

  // Somnath Kumar
  "somnath.kumar@nhsf.org.uk",
  "somnath.kumar.nhsf@gmail.com",

  // Sravya Vaddiraju
  "sravya.vaddiraju@nhsf.org.uk",
  "sravya.vaddiraju.nhsf@gmail.com",

  // Yash Hirani
  "yash.hirani@nhsf.org.uk",
  "yash.hirani.nhsf@gmail.com",
]

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export function getAdminName(email: string): string {
  const emailLower = email.toLowerCase()

  // Map both email formats to the same name
  const adminNames: Record<string, string> = {
    // General admin
    "sanskaarteam@nhsf.org.uk": "NHSF (UK) Admin",

    // Amulya Pabbisetty
    "amulya.pabbisetty@nhsf.org.uk": "Amulya Pabbisetty",
    "amulya.pabbisetty.nhsf@gmail.com": "Amulya Pabbisetty",

    // Vivek Motichande
    "vivek.motichande@nhsf.org.uk": "Vivek Motichande",
    "vivek.motichande.nhsf@gmail.com": "Vivek Motichande",

    // Arjun Ramdhan
    "arjun.ramdhan@nhsf.org.uk": "Arjun Ramdhan",
    "arjun.ramdhan.nhsf@gmail.com": "Arjun Ramdhan",

    // Naman Gupta
    "naman.gupta@nhsf.org.uk": "Naman Gupta",
    "naman.gupta.nhsf@gmail.com": "Naman Gupta",

    // Rhyanna Boodhoo
    "rhyanna.boodhoo@nhsf.org.uk": "Rhyanna Boodhoo",
    "rhyanna.boodhoo.nhsf@gmail.com": "Rhyanna Boodhoo",

    // Shreya Sharma
    "shreya.bhavani.sharma@nhsf.org.uk": "Shreya Sharma",
    "shreya.sharma.nhsf@gmail.com": "Shreya Sharma",

    // Shruti Rajpra
    "shruti.rajpra@nhsf.org.uk": "Shruti Rajpra",
    "shruti.rajpra.nhsf@gmail.com": "Shruti Rajpra",

    // Somnath Kumar
    "somnath.kumar@nhsf.org.uk": "Somnath Kumar",
    "somnath.kumar.nhsf@gmail.com": "Somnath Kumar",

    // Sravya Vaddiraju
    "sravya.vaddiraju@nhsf.org.uk": "Sravya Vaddiraju",
    "sravya.vaddiraju.nhsf@gmail.com": "Sravya Vaddiraju",

    // Yash Hirani
    "yash.hirani@nhsf.org.uk": "Yash Hirani",
    "yash.hirani.nhsf@gmail.com": "Yash Hirani",
  }

  return adminNames[emailLower] || "Admin"
}

// Helper function to get the primary email format for display
export function getPrimaryEmail(email: string): string {
  const emailLower = email.toLowerCase()

  // If it's a gmail account, show the @nhsf.org.uk version instead
  if (emailLower.includes(".nhsf@gmail.com")) {
    const name = emailLower.replace(".nhsf@gmail.com", "")
    return `${name}@nhsf.org.uk`
  }

  return email
}

// Get all unique admin names for display
export function getAllAdmins(): Array<{ name: string; primaryEmail: string; allEmails: string[] }> {
  const adminMap = new Map()

  ADMIN_EMAILS.forEach((email) => {
    const name = getAdminName(email)
    const primaryEmail = getPrimaryEmail(email)

    if (!adminMap.has(name)) {
      adminMap.set(name, {
        name,
        primaryEmail,
        allEmails: [],
      })
    }

    adminMap.get(name).allEmails.push(email)
  })

  return Array.from(adminMap.values()).filter((admin) => admin.name !== "NHSF (UK) Admin")
}
